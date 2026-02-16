"use client";
import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __showTopLoading?: () => void;
    __hideTopLoading?: () => void;
  }
}

export default function TopLoadingBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const inflight = useRef(0);

  useEffect(() => {
    // expose manual controls
    window.__showTopLoading = () => {
      inflight.current += 1;
      start();
    };
    window.__hideTopLoading = () => {
      inflight.current = Math.max(0, inflight.current - 1);
      if (inflight.current === 0) finish();
    };

    // Patch fetch to automatically show/hide the bar for network requests
    type FetchType = typeof window.fetch;
    const origFetch: FetchType = window.fetch.bind(window) as FetchType;
    window.fetch = async (...args: Parameters<FetchType>): ReturnType<FetchType> => {
      try {
        window.__showTopLoading?.();
        const res = await origFetch(...args);
        return res;
      } finally {
        window.__hideTopLoading?.();
      }
    };

    return () => {
      // restore
      try {
        window.fetch = origFetch;
      } catch {
        /* ignore */
      }
      if (timer.current) window.clearInterval(timer.current);
      window.__showTopLoading = undefined;
      window.__hideTopLoading = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    if (timer.current) return;
    setVisible(true);
    setProgress(10);
    // slowly advance progress towards 80%
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 7;
        return next < 80 ? next : 80;
      });
    }, 400);
  }

  function finish() {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    setProgress(100);
    // hide after short delay
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }

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
