"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    __showTopLoading?: () => void;
    __hideTopLoading?: () => void;
  }
}

export default function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const timer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const inflight = useRef(0);
  const navInflight = useRef(0);
  const navTarget = useRef<string | null>(null);
  const currentRoute = useRef("");

  const start = useCallback(() => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    setVisible(true);
    setProgress((p) => (p > 5 ? p : 8));

    if (timer.current) return;

    // Smoothly progress and never complete until all work is done.
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        const remaining = 92 - p;
        if (remaining <= 0.5) return 92;
        return p + Math.max(0.4, remaining * 0.08);
      });
    }, 120);
  }, []);

  const finish = useCallback(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }

    setProgress(100);

    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);
  }, []);

  const beginWork = useCallback(() => {
    inflight.current += 1;
    start();
  }, [start]);

  const endWork = useCallback(() => {
    inflight.current = Math.max(0, inflight.current - 1);
    if (inflight.current === 0) {
      finish();
    }
  }, [finish]);

  const normalizeRoute = useCallback((urlLike: string | URL | null | undefined) => {
    if (!urlLike) return currentRoute.current;
    try {
      const raw = typeof urlLike === "string" ? urlLike : urlLike.toString();
      const url = new URL(raw, window.location.href);
      return `${url.pathname}${url.search}`;
    } catch {
      return currentRoute.current;
    }
  }, []);

  const beginNav = useCallback((nextRoute?: string) => {
    const targetRoute = nextRoute ?? `${window.location.pathname}${window.location.search}`;
    if (targetRoute === currentRoute.current) return;
    if (targetRoute === navTarget.current) return;

    navTarget.current = targetRoute;
    navInflight.current += 1;
    beginWork();
  }, [beginWork]);

  useEffect(() => {
    window.__showTopLoading = () => {
      beginWork();
    };
    window.__hideTopLoading = () => {
      endWork();
    };

    currentRoute.current = `${window.location.pathname}${window.location.search}`;

    // Track API/network work.
    type FetchType = typeof window.fetch;
    const origFetch: FetchType = window.fetch.bind(window) as FetchType;
    window.fetch = async (...args: Parameters<FetchType>): ReturnType<FetchType> => {
      try {
        beginWork();
        const res = await origFetch(...args);
        return res;
      } finally {
        endWork();
      }
    };

    // Track navigation starts for App Router.
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const absolute = new URL(href, window.location.href);
      if (absolute.origin !== window.location.origin) return;

      const nextRoute = `${absolute.pathname}${absolute.search}`;
      beginNav(nextRoute);
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args) {
      const maybeUrl = args[2];
      beginNav(normalizeRoute(maybeUrl));
      return originalPushState(...args);
    };

    window.history.replaceState = function (...args) {
      const maybeUrl = args[2];
      beginNav(normalizeRoute(maybeUrl));
      return originalReplaceState(...args);
    };

    const onPopState = () => {
      beginNav(`${window.location.pathname}${window.location.search}`);
    };

    window.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      try {
        window.fetch = origFetch;
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      } catch {
        /* ignore */
      }

      if (timer.current) window.clearInterval(timer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);

      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);

      window.__showTopLoading = undefined;
      window.__hideTopLoading = undefined;
    };
  }, [beginNav, beginWork, endWork, finish, normalizeRoute]);

  useEffect(() => {
    const nextRoute = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    if (!nextRoute) return;

    currentRoute.current = nextRoute;
    navTarget.current = null;

    // Route settled: close only the navigation shares of inflight work.
    while (navInflight.current > 0) {
      navInflight.current -= 1;
      endWork();
    }
  }, [pathname, searchParams, endWork]);

  return (
    <div aria-hidden="true">
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 3,
          width: visible ? `${progress}%` : "0%",
          background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
          transition: "width 200ms linear, opacity 300ms linear",
          opacity: visible ? 1 : 0,
          zIndex: 9999,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 0,
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />
    </div>
  );
}
