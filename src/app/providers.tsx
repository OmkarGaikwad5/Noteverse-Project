"use client";

import { ReactNode } from "react";
import SessionWrapper from "@/components/SessionWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionWrapper>
      <AuthProvider>
        <ToastProvider>
          <SyncProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)]">
              {children}
            </main>
          </SyncProvider>
        </ToastProvider>
      </AuthProvider>
    </SessionWrapper>
  );
}
