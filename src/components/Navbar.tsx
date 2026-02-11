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
  FaBell, 
  FaSearch,
  FaPlus,
  FaChevronDown,
  FaTimes,
  FaArrowLeft
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface SearchResult {
  _id: string;
  title: string;
  type: "canvas" | "note";
  description?: string;
  updatedAt: string;
  coverColor?: string;
}

interface Notebook {
  _id: string;
  title: string;
  type: "canvas" | "note";
  description?: string;
  updatedAt: string;
  coverColor?: string;
}

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Fetch notebooks for search (similar to NotebookGrid)
  const fetchNotebooksForSearch = async (): Promise<Notebook[]> => {
    try {
      // Get user data
      const res = await fetch('/api/auth/me');
      if (!res.ok) return [];
      const userData = await res.json();

      // Fetch notebooks
      const resNotes = await fetch(`/api/v2/notebooks?userId=${userData.user.id}`);
      const data = await resNotes.json();
      return data.notebooks || [];
    } catch (e) {
      console.error("Failed to fetch notebooks for search", e);
      return [];
    }
  };

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const notebooks = await fetchNotebooksForSearch();
      const searchQuery = query.toLowerCase().trim();
      
      // Filter notebooks by search query
      const results = notebooks.filter((notebook: Notebook) => {
        const titleMatch = notebook.title?.toLowerCase().includes(searchQuery);
        const descMatch = notebook.description?.toLowerCase().includes(searchQuery);
        const typeMatch = notebook.type?.toLowerCase().includes(searchQuery);
        
        return titleMatch || descMatch || typeMatch;
      });
      
      // Format results
      const formattedResults = results.map((notebook: Notebook): SearchResult => ({
        _id: notebook._id,
        title: notebook.title,
        type: notebook.type,
        description: notebook.description,
        updatedAt: notebook.updatedAt,
        coverColor: notebook.coverColor
      }));
      
      // Sort by relevance and recency
      const sortedResults = formattedResults.sort((a: SearchResult, b: SearchResult) => {
        // First, prioritize title matches
        const aTitleMatch = a.title.toLowerCase().includes(searchQuery);
        const bTitleMatch = b.title.toLowerCase().includes(searchQuery);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        
        // Then by recency
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setSearchResults(sortedResults.slice(0, 8)); // Limit to 8 results
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search for desktop
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsLoading(true);
    
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileSearch(false);
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    // Navigate to notebook page (same as NotebookGrid)
    router.push(`/notebook/${result._id}`);
    setSearchQuery("");
    setShowSearchResults(false);
    setShowMobileSearch(false);
    setSearchResults([]);
    inputRef.current?.blur();
    mobileInputRef.current?.blur();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  // Clear mobile search
  const clearMobileSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    mobileInputRef.current?.focus();
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      } else {
        // Navigate to library with search query
        router.push(`/library?search=${encodeURIComponent(searchQuery)}`);
        setSearchQuery("");
        setShowSearchResults(false);
        setShowMobileSearch(false);
      }
    }
  };

  // Handle mobile search submission
  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      } else {
        // Navigate to library with search query
        router.push(`/library?search=${encodeURIComponent(searchQuery)}`);
        setSearchQuery("");
        setShowSearchResults(false);
        setShowMobileSearch(false);
      }
    }
  };

  // Create new notebook
  const handleCreateNotebook = async (type: 'canvas' | 'note') => {
    setShowCreateMenu(false);
    
    try {
      const resAuth = await fetch('/api/auth/me');
      if (!resAuth.ok) return;
      const userData = await resAuth.json();

      const res = await fetch('/api/v2/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          title: `New ${type === 'canvas' ? 'Whiteboard' : 'Note'}`,
          description: `A ${type === 'canvas' ? 'whiteboard' : 'text'} notebook`,
          coverColor: type === 'canvas' ? '#6366F1' : '#10B981',
          type: type
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/notebook/${data.notebook._id}`);
      }
    } catch (e) {
      console.error("Failed to create notebook:", e);
    }
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
            {!showMobileSearch && (
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
            )}

            {/* Center Section - Search Bar (Desktop) */}
            {!showMobileSearch && (
              <div className="flex-1 max-w-xl mx-6 hidden lg:block" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 w-4 h-4" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search notebooks..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim()) {
                        setShowSearchResults(true);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) {
                        setShowSearchResults(true);
                      }
                    }}
                    className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all hover:bg-gray-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FaTimes className="text-gray-400 w-4 h-4 hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="px-4 py-3 text-center text-gray-500">
                          <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            Notebooks ({searchResults.length})
                          </div>
                          {searchResults.map((result) => (
                            <button
                              key={result._id}
                              onClick={() => handleResultClick(result)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group border-b border-gray-100 last:border-b-0"
                            >
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                result.type === 'canvas' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {result.type === 'canvas' ? (
                                  <FaPalette className="w-4 h-4" />
                                ) : (
                                  <FaBook className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title || "Untitled"}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span className="capitalize">{result.type === 'canvas' ? 'Whiteboard' : 'Note'}</span>
                                  <span>•</span>
                                  <span>
                                    Updated {new Date(result.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {result.description && (
                                  <div className="text-xs text-gray-400 truncate mt-1">
                                    {result.description}
                                  </div>
                                )}
                              </div>
                              <FaSearch className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                        </>
                      ) : searchQuery ? (
                        <div className="px-4 py-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaSearch className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="text-gray-600 font-medium mb-1">No notebooks found</div>
                          <div className="text-sm text-gray-500">
                            Try searching with different keywords
                          </div>
                          <button
                            onClick={() => {
                              router.push('/library');
                              setShowSearchResults(false);
                            }}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Browse all notebooks →
                          </button>
                        </div>
                      ) : null}
                      
                      {searchResults.length > 0 && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to open first result
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Mobile Search Bar (Full Screen) */}
            {showMobileSearch && (
              <div className="fixed inset-0 z-50 bg-white p-4" ref={mobileSearchRef}>
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => {
                      setShowMobileSearch(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">Search Notebooks</h2>
                </div>

                <form onSubmit={handleMobileSearchSubmit} className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 w-4 h-4" />
                  </div>
                  <input
                    ref={mobileInputRef}
                    type="text"
                    placeholder="Search notebooks..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim()) {
                        performSearch(e.target.value);
                      }
                    }}
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearMobileSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FaTimes className="text-gray-400 w-4 h-4 hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                </form>

                {/* Mobile Search Results */}
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <div className="text-gray-500">Searching...</div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Found {searchResults.length} notebooks
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={result._id}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 text-left bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          result.type === 'canvas' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {result.type === 'canvas' ? (
                            <FaPalette className="w-5 h-5" />
                          ) : (
                            <FaBook className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-gray-900">{result.title || "Untitled"}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span className="capitalize">{result.type === 'canvas' ? 'Whiteboard' : 'Note'}</span>
                            <span>•</span>
                            <span>
                              Updated {new Date(result.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {result.description && (
                            <div className="text-xs text-gray-400 truncate mt-1">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <FaChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90" />
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaSearch className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium mb-2 text-lg">No notebooks found</div>
                    <div className="text-gray-500 mb-6">
                      Try searching with different keywords
                    </div>
                    <button
                      onClick={() => {
                        router.push('/library');
                        setShowMobileSearch(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-base"
                    >
                      Browse all notebooks →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <FaSearch className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-gray-600 font-medium mb-2 text-lg">Search your notebooks</div>
                    <div className="text-gray-500 mb-6 max-w-sm">
                      Find notebooks by title, description, or type (canvas/note)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right Section - Actions & User Menu (Hidden when mobile search is active) */}
            {!showMobileSearch && (
              <div className="flex items-center gap-3">
                {/* Mobile Search Button */}
                <button 
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setShowMobileSearch(true);
                    setTimeout(() => {
                      mobileInputRef.current?.focus();
                    }, 100);
                  }}
                >
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
                      <button
                        onClick={() => handleCreateNotebook('canvas')}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left"
                      >
                        <FaPalette className="text-blue-500" />
                        <div>
                          <div className="font-medium">Canvas Notebook</div>
                          <div className="text-xs text-gray-500">Whiteboard & drawings</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCreateNotebook('note')}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border-t border-gray-100 w-full text-left"
                      >
                        <FaBook className="text-emerald-500" />
                        <div>
                          <div className="font-medium">Text Notebook</div>
                          <div className="text-xs text-gray-500">Documents & writings</div>
                        </div>
                      </button>
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
                      
                      <Link
                        href="/library"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <FaBook className="text-gray-400" />
                        <span>My Library</span>
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
            )}
          </div>

          {/* Mobile Navigation (Hidden when mobile search is active) */}
          {!showMobileSearch && (
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
                <button 
                  className="flex flex-col items-center gap-1 p-2 text-gray-600"
                  onClick={() => {
                    setShowMobileSearch(true);
                    setTimeout(() => {
                      mobileInputRef.current?.focus();
                    }, 100);
                  }}
                >
                  <FaSearch className="w-4 h-4" />
                  <span className="text-xs font-medium">Search</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close dropdowns */}
        {(showUserMenu || showCreateMenu || showSearchResults) && !showMobileSearch && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowUserMenu(false);
              setShowCreateMenu(false);
              setShowSearchResults(false);
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