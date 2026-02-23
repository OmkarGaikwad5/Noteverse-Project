'use client'

import Image from "next/image";
import Link from "next/link";
import { 
  FaPenFancy, 
  FaBook, 
  FaMagic, 
  FaPalette, 
  FaRocket, 
  FaUsers, 
  FaLock, 
  FaSync, 
  FaStar, 
  FaArrowRight, 
  FaChevronDown,
  FaGoogle,
  FaGithub,
  FaTwitter,
  FaDiscord,
  FaHeart,
  FaBolt,
  FaCloud,
  FaLayerGroup,
  FaCrown,
  FaGlobe
} from "react-icons/fa";
import { HiOutlineSparkles, HiOutlineLightBulb } from "react-icons/hi";
import { MdOutlineDesignServices, MdOutlineSpeed } from "react-icons/md";
import { useEffect, useState, useRef } from "react";
import { useAuth } from '@/context/AuthContext';
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { user, loading, logout } = useAuth();
  const toast = useToast();
  
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const howItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FaPenFancy className="text-2xl sm:text-3xl" />,
      title: "Infinite Canvas",
      description: "Draw, sketch, and brainstorm on an infinite digital canvas with powerful drawing tools.",
      color: "from-blue-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-blue-50 to-cyan-50",
      border: "border-blue-200",
      shadow: "shadow-blue-500/10"
    },
    {
      icon: <FaBook className="text-2xl sm:text-3xl" />,
      title: "Smart Notebooks",
      description: "Organize notes in beautiful notebooks with rich text editing and markdown support.",
      color: "from-purple-500 to-pink-500",
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50",
      border: "border-purple-200",
      shadow: "shadow-purple-500/10"
    },
    {
      icon: <FaSync className="text-2xl sm:text-3xl" />,
      title: "Real-time Sync",
      description: "Access your notes anywhere with seamless cloud sync across all your devices.",
      color: "from-green-500 to-emerald-500",
      gradient: "bg-gradient-to-br from-green-50 to-emerald-50",
      border: "border-green-200",
      shadow: "shadow-green-500/10"
    },
    {
      icon: <FaLock className="text-2xl sm:text-3xl" />,
      title: "End-to-End Encrypted",
      description: "Your thoughts are private and secure with military-grade encryption.",
      color: "from-orange-500 to-red-500",
      gradient: "bg-gradient-to-br from-orange-50 to-red-50",
      border: "border-orange-200",
      shadow: "shadow-orange-500/10"
    },
    {
      icon: <FaUsers className="text-2xl sm:text-3xl" />,
      title: "Collaborate",
      description: "Share notebooks and collaborate in real-time with team members.",
      color: "from-indigo-500 to-purple-500",
      gradient: "bg-gradient-to-br from-indigo-50 to-purple-50",
      border: "border-indigo-200",
      shadow: "shadow-indigo-500/10"
    },
    {
      icon: <FaMagic className="text-2xl sm:text-3xl" />,
      title: "AI Assistant",
      description: "Get smart suggestions, summaries, and organization powered by AI.",
      color: "from-yellow-500 to-orange-500",
      gradient: "bg-gradient-to-br from-yellow-50 to-orange-50",
      border: "border-yellow-200",
      shadow: "shadow-yellow-500/10"
    }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Product Designer",
      content: "NoteVerse transformed how I organize my design thinking. The canvas mode is a game-changer!",
      rating: 5,
      avatar: "AC",
      company: "Design Studio"
    },
    {
      name: "Sarah Johnson",
      role: "Researcher",
      content: "Perfect balance between structure and creativity. My go-to for all research notes.",
      rating: 5,
      avatar: "SJ",
      company: "Research Lab"
    },
    {
      name: "Michael Torres",
      role: "Student",
      content: "From lecture notes to study diagrams, NoteVerse handles everything beautifully.",
      rating: 5,
      avatar: "MT",
      company: "University"
    },
    {
      name: "Emily Zhang",
      role: "Project Manager",
      content: "Our team's productivity increased by 40% since we started using NoteVerse for collaboration.",
      rating: 5,
      avatar: "EZ",
      company: "Tech Corp"
    }
  ];

  const stats = [
    { value: "100K+", label: "Active Users", icon: <FaUsers className="text-blue-500" /> },
    { value: "1M+", label: "Notes Created", icon: <FaBook className="text-purple-500" /> },
    { value: "50+", label: "Countries", icon: <FaGlobe className="text-green-500" /> },
    { value: "99.9%", label: "Uptime", icon: <FaCloud className="text-indigo-500" /> }
  ];

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleLogout = async () => {
    const toastId = toast.loading({ title: "Signing out...", description: "Ending your session." });
    try {
      await logout();
      toast.update(toastId, "success", { title: "Signed out", description: "You have been logged out." });
    } catch {
      toast.update(toastId, "error", { title: "Logout failed", description: "Please try again." });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 overflow-hidden">
      {/* Modern Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-40 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation - More transparent and sleek */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">NV</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Note</span>
                <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">Verse</span>
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden md:flex items-center space-x-8"
            >
              {['Features', 'Testimonials', 'Pricing'].map((item, i) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-600 hover:text-blue-600 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </motion.div>

            {/* Auth Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              {loading ? (
                <div className="w-20 h-8 sm:w-24 sm:h-8 bg-gray-200 rounded-xl animate-pulse" />
              ) : !user ? (
                <>
                  <Link 
                    href="/login" 
                    className="hidden sm:inline text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="relative inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Sign up free</span>
                    <span className="sm:hidden">Sign up</span>
                    <FaArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-gray-50 to-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200/80 shadow-sm">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                      {getUserInitial()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-medium text-gray-800 max-w-[100px] truncate">
                        {user.name?.split(' ')[0] || 'User'}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500">Signed in</span>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout} 
                    className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:bg-red-50 text-red-600 font-medium text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Exit</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section - FIXED: Proper spacing and image constraints */}
      <section ref={heroRef} className="relative pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            {/* Left Content - Takes full width on mobile, 55% on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-[55%] text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-blue-100"
              >
                <HiOutlineSparkles className="mr-1.5 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Introducing AI-Powered Notes
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-3 sm:mb-4"
              >
                <span className="block">Where Your</span>
                <span className="block mt-1">
                  <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                    Thoughts
                  </span>
                  <span className="mx-2 text-gray-900">Meet</span>
                  <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x animation-delay-1000">
                    Creativity
                  </span>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 mb-5 sm:mb-6"
              >
                Your all-in-one digital notebook for ideas, drawings, and collaboration. 
                Perfect for students, professionals, and creative minds.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <Link
                  href="/home"
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                >
                  <span>Start Your Journey</span>
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
                <Link
                  href="/library"
                  className="bg-white text-gray-800 px-6 sm:px-8 py-3 rounded-xl font-semibold text-sm sm:text-base border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-lg flex items-center justify-center"
                >
                  Explore Library
                </Link>
              </motion.div>

              {/* Social Proof */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <span className="font-semibold">10,000+</span> creators trust us
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image - Responsive with height constraints */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full lg:w-[45%] relative"
            >
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl border border-gray-200/60 max-w-md mx-auto lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-purple-600/10"></div>
                <div className="aspect-[16/10] sm:aspect-[16/9] relative">
                  <Image
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80"
                    alt="NoteVerse Interface"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 45vw"
                  />
                </div>
                
                {/* Floating UI Elements - Adjusted for mobile */}
                <motion.div 
                  animate={{ y: [-3, 3] }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white/95 backdrop-blur rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-2 shadow-md sm:shadow-lg border border-gray-200 flex items-center gap-1 sm:gap-2"
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] sm:text-xs font-medium">AI Processing</span>
                </motion.div>
                
                <motion.div 
                  animate={{ y: [3, -3] }}
                  transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                  className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-white/95 backdrop-blur rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-2 shadow-md sm:shadow-lg border border-gray-200 flex items-center gap-1 sm:gap-2"
                >
                  <FaSync className="text-blue-500 animate-spin-slow w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs font-medium">Synced</span>
                </motion.div>
              </div>
              
              {/* Stats Cards - Hidden on mobile, visible on desktop */}
              <div className="absolute -bottom-6 -left-6 hidden lg:block">
                <motion.div 
                  animate={{ y: [-3, 3] }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  className="bg-white rounded-xl shadow-xl p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <FaBolt className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">2.5x</p>
                      <p className="text-xs text-gray-600">Faster notes</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator - Adjusted position */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2"
        >
          <FaChevronDown className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl mb-2 sm:mb-3 shadow-sm border border-gray-200">
                  {stat.icon}
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rest of the sections remain exactly the same... */}
      {/* Features Section - Modern Grid */}
      <section id="features" ref={featuresRef} className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-blue-100">
              <HiOutlineSparkles className="inline mr-1 w-3 h-3 sm:w-4 sm:h-4" />
              Powerful Features
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
              Everything You Need for
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Perfect Notes
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              From simple notes to complex diagrams, we&apos;ve got you covered
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                className={`group relative bg-white p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border ${feature.border} hover:border-transparent transition-all duration-300 hover:shadow-2xl ${feature.shadow}`}
              >
                <div className={`absolute inset-0 ${feature.gradient} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className={`inline-flex p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.color} text-white mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1.5 sm:mb-2 lg:mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                  
                  {/* Hover Indicator */}
                  <motion.div 
                    animate={{ width: hoveredFeature === index ? '100%' : '0%' }}
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Modern Timeline */}
      <section ref={howItWorksRef} className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-white text-purple-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-purple-200 shadow-sm">
              <FaBolt className="inline mr-1 w-3 h-3 sm:w-4 sm:h-4" />
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
              Get Started in
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Minutes, Not Hours
              </span>
            </h2>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 relative">
            {/* Connecting Line - Hidden on mobile */}
            <div className="hidden lg:block absolute top-20 left-0 w-full h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200"></div>
            
            {[
              {
                step: "01",
                title: "Create Your Space",
                description: "Sign up for free and create your first notebook. Choose between canvas or text mode.",
                icon: <FaLayerGroup className="text-xl sm:text-2xl" />,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "Capture & Create",
                description: "Write notes, draw diagrams, add images, and organize everything in one place.",
                icon: <FaPenFancy className="text-xl sm:text-2xl" />,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Sync & Share",
                description: "Access from any device. Share with teammates or keep it private.",
                icon: <FaSync className="text-xl sm:text-2xl" />,
                color: "from-green-500 to-emerald-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="relative inline-block">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r ${item.color} rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold mx-auto mb-4 sm:mb-5 lg:mb-6 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center text-[10px] sm:text-xs lg:text-sm font-bold text-gray-700 border-2 border-gray-200 shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-2 sm:mb-3 text-gray-800">{item.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-xs mx-auto px-2">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Modern Carousel for Mobile */}
      <section id="testimonials" ref={testimonialsRef} className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-yellow-200">
              <FaStar className="inline mr-1 w-3 h-3 sm:w-4 sm:h-4" />
              Trusted by Creators
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
              Loved by Thinkers
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Worldwide
              </span>
            </h2>
          </motion.div>
          
          {/* Desktop Grid - Hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={testimonialsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex mb-2 sm:mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm">{testimonial.name}</h4>
                    <p className="text-gray-500 text-[10px] sm:text-xs">{testimonial.role}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Mobile Carousel */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-lg"
              >
                <div className="flex mb-2 sm:mb-3">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <FaStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                  "{testimonials[activeTestimonial].content}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">{testimonials[activeTestimonial].name}</h4>
                    <p className="text-gray-500 text-xs sm:text-sm">{testimonials[activeTestimonial].role}</p>
                    <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{testimonials[activeTestimonial].company}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-4 sm:mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                    index === activeTestimonial 
                      ? 'w-4 sm:w-6 bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern & Responsive */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl lg:rounded-4xl p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
            
            <div className="relative text-center text-white">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur mb-4 sm:mb-5 lg:mb-6"
              >
                <FaCrown className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </motion.div>
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4">
                Ready to Transform Your
                <span className="block mt-1 sm:mt-2 text-yellow-300">Note-Taking?</span>
              </h2>
              
              <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-5 sm:mb-6 lg:mb-8 max-w-2xl mx-auto px-4">
                Join thousands of creators who have made NoteVerse their go-to note-taking solution.
                <span className="block mt-1 sm:mt-2 font-semibold text-white">Free forever for personal use.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="group bg-white text-blue-600 px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                >
                  <span>Start Free Trial</span>
                  <FaArrowRight className="ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                </Link>
                <Link
                  href="/library"
                  className="bg-transparent text-white px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base border border-white/30 hover:border-white/80 transition-all duration-300 backdrop-blur flex items-center justify-center"
                >
                  Explore Features
                </Link>
              </div>
              
              <p className="text-[10px] sm:text-xs lg:text-sm text-blue-200 mt-4 sm:mt-5 lg:mt-6">
                ✨ No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Modern & Clean */}
      <footer className="bg-gray-900 text-white py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm sm:text-base lg:text-lg">NV</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold">
                  <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">Note</span>
                  <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">Verse</span>
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 lg:mb-6 max-w-md">
                The all-in-one note-taking universe for thinkers, creators, and visual minds. 
                Capture ideas, bring them to life.
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                {[FaTwitter, FaGithub, FaDiscord, FaGoogle].map((Icon, i) => (
                  <Link key={i} href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Links */}
            <div className="col-span-1 lg:col-span-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <div>
                  <h4 className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm">Product</h4>
                  <ul className="space-y-1.5 sm:space-y-2 lg:space-y-3 text-xs sm:text-sm text-gray-400">
                    <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                    <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                    <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                    <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm">Company</h4>
                  <ul className="space-y-1.5 sm:space-y-2 lg:space-y-3 text-xs sm:text-sm text-gray-400">
                    <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                    <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                    <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm">Legal</h4>
                  <ul className="space-y-1.5 sm:space-y-2 lg:space-y-3 text-xs sm:text-sm text-gray-400">
                    <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                    <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                    <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                    <li><Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 sm:mt-10 lg:mt-12 pt-5 sm:pt-6 lg:pt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-400">
              © {new Date().getFullYear()} NoteVerse. All rights reserved.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 flex items-center justify-center gap-1">
              Made with <FaHeart className="text-red-500 w-2.5 h-2.5 sm:w-3 sm:h-3" /> for note-takers everywhere
            </p>
          </div>
        </div>
      </footer>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: left center; }
          50% { background-position: right center; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-blob { animation: blob 7s infinite; }
        .animate-gradient-x { 
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite; 
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-6000 { animation-delay: 6s; }
        
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </main>
  );
}
