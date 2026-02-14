"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import Navbar from '@/components/Navbar';
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SyncProvider>
          <Navbar />
          <div>{children}</div>
        </SyncProvider>
      </AuthProvider>
    </SessionProvider>
  );
}