"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSpinner } from "react-icons/fa";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "loading";

export interface ToastInput {
  title: string;
  description?: string;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, input: ToastInput) => string;
  updateToast: (id: string, variant: ToastVariant, input: ToastInput) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3000;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") return <FaCheckCircle className="h-4 w-4 text-emerald-500" />;
  if (variant === "error") return <FaExclamationCircle className="h-4 w-4 text-red-500" />;
  if (variant === "loading") return <FaSpinner className="h-4 w-4 animate-spin text-blue-500" />;
  return <FaInfoCircle className="h-4 w-4 text-blue-500" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = input.duration ?? DEFAULT_DURATION;
      const toast: ToastItem = { ...input, id, variant };
      setToasts((prev) => [...prev, toast]);

      if (variant !== "loading" && duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast]
  );

  const updateToast = useCallback(
    (id: string, variant: ToastVariant, input: ToastInput) => {
      const duration = input.duration ?? DEFAULT_DURATION;

      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, ...input, variant, duration } : toast
        )
      );

      if (variant !== "loading" && duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ showToast, updateToast, dismissToast }),
    [showToast, updateToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl border bg-white/95 p-3 shadow-xl backdrop-blur animate-in slide-in-from-top-2 fade-in duration-200",
              toast.variant === "success" && "border-emerald-200",
              toast.variant === "error" && "border-red-200",
              toast.variant === "loading" && "border-blue-200",
              toast.variant === "info" && "border-slate-200"
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <ToastIcon variant={toast.variant} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-slate-600">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-xs text-slate-400 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}

