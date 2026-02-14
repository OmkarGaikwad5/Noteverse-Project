"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isGuest?: boolean;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Sync NextAuth session with custom auth state
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      // Convert NextAuth user to your custom User format
      setUser({
        id: session.user.id || session.user.email || '',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        provider: session.user.provider || 'oauth',
        isGuest: false
      });
      setLoading(false);
    } else {
      // Try to fetch from your custom API if no NextAuth session
      fetchUser();
    }
  }, [session, status]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ? { ...data.user, provider: 'credentials' } : null);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching user:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/custom-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await res.json();
      setUser({ ...data.user, provider: 'credentials' });
      router.push('/home');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/custom-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Signup failed');
      }

      const data = await res.json();
      setUser({ ...data.user, provider: 'credentials' });
      router.push('/home');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call custom logout API
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      // Also sign out from NextAuth
      await nextAuthSignOut({ redirect: false });
      
      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      setUser(null);
      
      // Force hard navigation to clear all state
      window.location.href = '/';
    } catch (e) {
      console.error('Logout error:', e);
      setUser(null);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated: !!user,
        refresh: fetchUser, 
        logout,
        login,
        signup
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;