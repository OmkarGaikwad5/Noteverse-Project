"use client";

import { useMemo } from "react";
import { ToastInput, useToastContext } from "@/components/ui/toast";

interface PromiseToastInput<T> {
  loading: ToastInput;
  success: ToastInput | ((value: T) => ToastInput);
  error: ToastInput | ((error: unknown) => ToastInput);
}

export function useToast() {
  const { showToast, updateToast, dismissToast } = useToastContext();

  return useMemo(() => ({
    success: (input: ToastInput) => showToast("success", input),
    error: (input: ToastInput) => showToast("error", input),
    info: (input: ToastInput) => showToast("info", input),
    loading: (input: ToastInput) => showToast("loading", input),
    update: (id: string, variant: "success" | "error" | "info" | "loading", input: ToastInput) =>
      updateToast(id, variant, input),
    dismiss: (id: string) => dismissToast(id),
    promise: async <T>(promise: Promise<T>, input: PromiseToastInput<T>) => {
      const id = showToast("loading", input.loading);
      try {
        const value = await promise;
        const successInput = typeof input.success === "function" ? input.success(value) : input.success;
        updateToast(id, "success", successInput);
        return value;
      } catch (error) {
        const errorInput = typeof input.error === "function" ? input.error(error) : input.error;
        updateToast(id, "error", errorInput);
        throw error;
      }
    },
  }), [showToast, updateToast, dismissToast]);
}
