"use client";

import { ReactNode } from "react";
import SessionWrapper from "@/components/SessionWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import Navbar from "@/components/Navbar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionWrapper>
      <AuthProvider>
        <SyncProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </SyncProvider>
      </AuthProvider>
    </SessionWrapper>
  );
}
