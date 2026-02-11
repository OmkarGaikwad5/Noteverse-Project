"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FaRocket, FaArrowRight } from 'react-icons/fa';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NV</span>
            </div>
            <span className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Note</span>
              <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">Verse</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-8 bg-white/60 rounded-xl animate-pulse" />
            ) : !user ? (
              // When logged out we intentionally hide Login/Signup per request
              <></>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-3 bg-white/60 backdrop-blur rounded-full px-3 py-1 border border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">{(user.name || user.email || 'U').charAt(0)}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{user.name ?? user.email}</span>
                    <span className="text-xs text-gray-500">Signed in</span>
                  </div>
                </div>
                <button onClick={logout} className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-red-50 text-red-600 font-semibold shadow-sm transition transform hover:scale-105">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
