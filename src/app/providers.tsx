"use client";

import { SessionProvider } from "next-auth/react";
import { SyncProvider } from "@/context/SyncContext";
import Navbar from '@/components/Navbar';
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SyncProvider>
        <Navbar />
        <div className="pt-20">{children}</div>
      </SyncProvider>
    </SessionProvider>
  );
}