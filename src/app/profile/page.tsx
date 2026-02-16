"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/custom/button";
import {
  FaSignOutAlt,
  FaBook,
  FaPalette,
  FaEnvelope,
  FaCalendarAlt,
  FaChevronLeft,
  FaUser,
  FaCog,
  FaChartLine,
  FaBell,
  FaShieldAlt,
  FaEdit,
  FaGlobe,
  FaFileAlt,
  FaBrush,
  FaRegEdit,
  FaUserCircle,
  FaHistory,
  FaDatabase,
} from "react-icons/fa";
import { FiTrendingUp, FiSettings, FiUserCheck } from "react-icons/fi";
import { IoStatsChart } from "react-icons/io5";
import { TbDeviceDesktop, TbDeviceMobile } from "react-icons/tb";
import { useToast } from "@/hooks/useToast";

interface UserProfile {
  name: string;
  email: string;
  joinedAt: string;
  lastActive: string;
  plan: string;
  storageUsed: number;
  storageTotal: number;
}

interface UserStats {
  notes: number;
  canvases: number;
  totalNotes: number;
  activeProjects: number;
  last7Days: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ 
    notes: 0, 
    canvases: 0,
    totalNotes: 0,
    activeProjects: 0,
    last7Days: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState("overview");
  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setUser(data.user);
        setStats(data.stats);
      } catch (err) {
        console.error(err);
        setError('Could not load profile data');
        toast.error({ title: "Profile load failed", description: "Could not load profile data." });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session, toast]);

  const handleLogout = async () => {
    const toastId = toast.loading({ title: "Signing out...", description: "Ending your session." });
    await signOut({ callbackUrl: "/" });
    toast.update(toastId, "success", { title: "Signed out", description: "You have been logged out." });
  };

  const calculateStoragePercentage = () => {
    if (!user) return 0;
    return (user.storageUsed / user.storageTotal) * 100;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return "Yesterday";
    return formatDate(dateString);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center text-red-500 p-6 bg-white rounded-2xl shadow-lg">
          <p className="text-lg font-semibold mb-2">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/library"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <FaChevronLeft className="text-xs" />
                Back to Library
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FaBell className="text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaSignOutAlt />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                      alt="profile"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors">
                    <FaEdit className="text-gray-600 text-sm" />
                  </button>
                </div>

                <h2 className="text-xl font-bold text-gray-900">{user?.name || session?.user?.name}</h2>
                <p className="text-gray-500 text-sm mb-2">{user?.email || session?.user?.email}</p>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                  <FiUserCheck />
                  {user?.plan || "Free"} Plan
                </div>

                <div className="mt-6 w-full">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Storage</span>
                    <span>{user?.storageUsed?.toFixed(1) || "0"}GB / {user?.storageTotal || "5"}GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${calculateStoragePercentage()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Last active {formatLastActive(user?.lastActive || new Date().toISOString())}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === "overview"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <IoStatsChart />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === "account"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FaUserCircle />
                  Account
                </button>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === "preferences"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FaCog />
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === "security"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FaShieldAlt />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === "activity"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FaHistory />
                  Activity
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Stats Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Notes</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalNotes || 0}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <FaFileAlt className="text-emerald-600 text-xl" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-emerald-600">
                      <FiTrendingUp className="mr-1" />
                      <span>+{stats.last7Days || 0} this week</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Notebooks</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.notes || 0}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl">
                        <FaBook className="text-amber-600 text-xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      Text-based notes
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Canvases</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.canvases || 0}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <FaBrush className="text-blue-600 text-xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      Visual boards
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Active Projects</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeProjects || 0}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <FaChartLine className="text-purple-600 text-xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      Currently working on
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaUser className="text-emerald-600" />
                      Account Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FaEnvelope className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-medium">{user?.email || session?.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FaCalendarAlt className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium">
                            {user?.joinedAt ? formatDate(user.joinedAt) : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FaGlobe className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Plan</p>
                          <p className="font-medium">{user?.plan || "Free"} Plan</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TbDeviceDesktop className="text-blue-600" />
                      Usage Analytics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <TbDeviceDesktop className="text-blue-600 text-xl" />
                          <div>
                            <p className="text-sm text-gray-500">Desktop Usage</p>
                            <p className="font-medium">85%</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <TbDeviceMobile className="text-emerald-600 text-xl" />
                          <div>
                            <p className="text-sm text-gray-500">Mobile Usage</p>
                            <p className="font-medium">15%</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <FaDatabase className="text-purple-600 text-xl" />
                          <div>
                            <p className="text-sm text-gray-500">Storage Used</p>
                            <p className="font-medium">{user?.storageUsed?.toFixed(1) || "0"} GB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors group">
                      <div className="p-3 bg-white rounded-lg mb-2 group-hover:bg-emerald-100 transition-colors">
                        <FaRegEdit className="text-gray-600 group-hover:text-emerald-600 text-lg" />
                      </div>
                      <span className="text-sm font-medium">New Note</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors group">
                      <div className="p-3 bg-white rounded-lg mb-2 group-hover:bg-blue-100 transition-colors">
                        <FaPalette className="text-gray-600 group-hover:text-blue-600 text-lg" />
                      </div>
                      <span className="text-sm font-medium">New Canvas</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-amber-50 rounded-xl transition-colors group">
                      <div className="p-3 bg-white rounded-lg mb-2 group-hover:bg-amber-100 transition-colors">
                        <FiSettings className="text-gray-600 group-hover:text-amber-600 text-lg" />
                      </div>
                      <span className="text-sm font-medium">Settings</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors group">
                      <div className="p-3 bg-white rounded-lg mb-2 group-hover:bg-purple-100 transition-colors">
                        <FaShieldAlt className="text-gray-600 group-hover:text-purple-600 text-lg" />
                      </div>
                      <span className="text-sm font-medium">Security</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Other Tabs */}
            {activeTab !== "overview" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 capitalize">
                  {activeTab.replace("-", " ")}
                </h2>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === "account" && <FaUserCircle className="text-gray-400 text-2xl" />}
                    {activeTab === "preferences" && <FaCog className="text-gray-400 text-2xl" />}
                    {activeTab === "security" && <FaShieldAlt className="text-gray-400 text-2xl" />}
                    {activeTab === "activity" && <FaHistory className="text-gray-400 text-2xl" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    This section is currently under development. We're working hard to bring you more features!
                  </p>
                  <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                    Coming Soon
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
