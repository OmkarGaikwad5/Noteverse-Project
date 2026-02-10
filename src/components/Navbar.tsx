"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/custom/button";
import { 
  FaBook, 
  FaSignOutAlt, 
  FaUserCircle, 
  FaHome, 
  FaPalette, 
  FaCog, 
  FaBell, 
  FaSearch,
  FaPlus,
  FaChevronDown
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Hide navbar on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/home", icon: <FaHome className="w-4 h-4" /> },
    { name: "Library", href: "/library", icon: <FaBook className="w-4 h-4" /> },
    { name: "Canvas", href: "/canvas", icon: <FaPalette className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/home" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg">NV</span>
                </div>
                <div className="hidden md:block">
                  <span className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Note</span>
                    <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">Verse</span>
                  </span>
                </div>
              </Link>

              {/* Navigation Items */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Center Section - Search Bar */}
            <div className="flex-1 max-w-xl mx-6 hidden lg:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400 w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search notes, notebooks, or tags..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all hover:bg-gray-100"
                />
              </div>
            </div>

            {/* Right Section - Actions & User Menu */}
            <div className="flex items-center gap-3">
              {/* Mobile Search */}
              <button className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <FaSearch className="w-5 h-5" />
              </button>

              {/* Create Button with Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                >
                  <FaPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create</span>
                  <FaChevronDown className="w-3 h-3" />
                </Button>
                
                {showCreateMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link
                      href="/note/new?mode=canvas"
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <FaPalette className="text-blue-500" />
                      <div>
                        <div className="font-medium">Canvas Note</div>
                        <div className="text-xs text-gray-500">Draw & sketch ideas</div>
                      </div>
                    </Link>
                    <Link
                      href="/note/new?mode=notebook"
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors border-t border-gray-100"
                    >
                      <FaBook className="text-purple-500" />
                      <div>
                        <div className="font-medium">Notebook</div>
                        <div className="text-xs text-gray-500">Write & organize notes</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>


              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      session?.user?.name?.charAt(0) || <FaUserCircle className="w-6 h-6" />
                    )}
                  </div>
                  <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">
                        {session?.user?.name || "User"}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {session?.user?.email || "user@example.com"}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <FaUserCircle className="text-gray-400" />
                      <span>Profile</span>
                    </Link>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                    >
                      <FaSignOutAlt />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-around">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                    pathname === item.href
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              ))}
              <button className="flex flex-col items-center gap-1 p-2 text-gray-600">
                <FaSearch className="w-4 h-4" />
                <span className="text-xs font-medium">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Click outside to close dropdowns */}
        {(showUserMenu || showCreateMenu) && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowUserMenu(false);
              setShowCreateMenu(false);
            }}
          />
        )}
      </nav>

      {/* Styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-from-top-2 {
          from { transform: translateY(-10px); }
          to { transform: translateY(0); }
        }
        
        .animate-in {
          animation-duration: 200ms;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
        }
        
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
      `}</style>
    </>
  );
}

