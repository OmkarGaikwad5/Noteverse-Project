"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: "oauth" | "credentials" | "guest";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);

  /* =========================================================
     RESOLVE USER (RUN ONLY ONCE AFTER NEXTAUTH READY)
  ========================================================= */
const resolveUser = async () => {

  // Wait until next-auth finishes checking cookies
  if (status === "loading") return;

  try {

    /* 1️⃣ GOOGLE LOGIN (NextAuth priority) */
    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.email!,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        provider: "oauth"
      });

      setLoading(false);
      return;
    }


    /* 2️⃣ CUSTOM LOGIN — ONLY IF COOKIE EXISTS */
    const hasPossibleAuthCookie =
      document.cookie.includes("token") ||
      document.cookie.includes("next-auth.session-token") ||
      document.cookie.includes("__Secure-next-auth.session-token");


    if (!hasPossibleAuthCookie) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Now safe to call backend
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store"
    });

    if (res.ok) {
      const data = await res.json();
      setUser({ ...data.user, provider: "credentials" });
    } else {
      // 401 or expired cookie
      setUser(null);
    }

  } catch (err) {
    console.error("Auth resolve failed:", err);
    setUser(null);
  }

  setLoading(false);
};


  /* RUN ONLY ONCE */
  useEffect(() => {
  resolveUser();
}, [status]);


  /* =========================================================
     MANUAL REFRESH (used after login/signup)
  ========================================================= */
  const refresh = async () => {
    setLoading(true);
    await resolveUser();
  };

  /* =========================================================
     LOGIN
  ========================================================= */
  const login = async (email: string, password: string) => {
    setLoading(true);

    const res = await fetch("/api/auth/custom-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });

    if (!res.ok) {
      setLoading(false);
      throw new Error("Login failed");
    }

    await refresh();
    router.replace("/home");
  };

  /* =========================================================
     SIGNUP
  ========================================================= */
  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);

    const res = await fetch("/api/auth/custom-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      credentials: "include"
    });

    if (!res.ok) {
      setLoading(false);
      throw new Error("Signup failed");
    }

    await refresh();
    router.replace("/home");
  };

  /* =========================================================
     LOGOUT
  ========================================================= */
  const logout = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await nextAuthSignOut({ redirect: false });
    } catch {}

    setUser(null);
    router.replace("/");
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
