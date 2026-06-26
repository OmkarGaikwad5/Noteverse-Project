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
   <main className="bg-gray-50 min-h-screen">

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
     {/* Navbar */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex items-center justify-between h-16">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">NV</span>
        </div>
        <span className="text-xl font-semibold text-gray-900">
          NoteVerse
        </span>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
        <a href="#" className="hover:text-gray-900">Pricing</a>
        <a href="#" className="hover:text-gray-900">App</a>
        <a href="#" className="hover:text-gray-900">Blog</a>
        <a href="#" className="hover:text-gray-900">Careers</a>
        <a href="#" className="hover:text-gray-900">About</a>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900">
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition"
        >
          Sign up
        </Link>
      </div>
    </div>
  </div>
</nav>
{/* Navbar */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex items-center justify-between h-16">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">NV</span>
        </div>
        <span className="text-xl font-semibold text-gray-900">
          NoteVerse
        </span>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
        <a href="#" className="hover:text-gray-900">Pricing</a>
        <a href="#" className="hover:text-gray-900">App</a>
        <a href="#" className="hover:text-gray-900">Blog</a>
        <a href="#" className="hover:text-gray-900">Careers</a>
        <a href="#" className="hover:text-gray-900">About</a>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900">
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition"
        >
          Sign up
        </Link>
      </div>
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
    {/* Stats Section */}
<section className="py-16 bg-white border-y border-gray-200">
  <div className="max-w-6xl mx-auto px-6">
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 text-center">

      {stats.map((stat, index) => (
        <div key={index} className="px-6 py-6">
          <div className="text-3xl font-semibold text-gray-900">
            {stat.value}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stat.label}
          </div>
        </div>
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

{/* How It Works */}
<section className="py-20 bg-white border-t border-gray-200">
  <div className="max-w-6xl mx-auto px-6">

    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        Get started in minutes
      </h2>
      <p className="text-gray-600">
        Simple setup. Powerful results.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-12 text-center">

      {[
        {
          step: "01",
          title: "Create Account",
          desc: "Sign up and create your first workspace in seconds."
        },
        {
          step: "02",
          title: "Capture Ideas",
          desc: "Write notes, record meetings, and organize content."
        },
        {
          step: "03",
          title: "Collaborate",
          desc: "Share and sync across all your devices instantly."
        }
      ].map((item, index) => (
        <div key={index}>
          <div className="text-purple-600 text-sm font-medium mb-3">
            {item.step}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {item.title}
          </h3>
          <p className="text-gray-600 text-sm">
            {item.desc}
          </p>
        </div>
      ))}

    </div>

  </div>
</section>


     

      {/* CTA Section */}
<section className="py-20 bg-white border-t border-gray-200">
  <div className="max-w-4xl mx-auto px-6 text-center">

    <h2 className="text-4xl font-bold text-gray-900 mb-6">
      Ready to boost your productivity?
    </h2>

    <p className="text-gray-600 mb-8">
      Start using NoteVerse today. Free forever for personal use.
    </p>

    <div className="flex justify-center gap-4">
      <Link
        href="/signup"
        className="bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 transition"
      >
        Get Started
      </Link>

      <Link
        href="/demo"
        className="border border-gray-300 px-6 py-3 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition"
      >
        Get a Demo
      </Link>
    </div>

  </div>
</section>


      <footer className="bg-white border-t border-gray-200 py-12">
  <div className="max-w-6xl mx-auto px-6">

    <div className="flex flex-col md:flex-row justify-between items-center">

      <div className="text-gray-900 font-semibold text-lg">
        NoteVerse
      </div>

      <div className="flex gap-6 text-sm text-gray-600 mt-6 md:mt-0">
        <Link href="#">Pricing</Link>
        <Link href="#">Blog</Link>
        <Link href="#">Privacy</Link>
        <Link href="#">Terms</Link>
      </div>
    </div>

    <div className="text-center text-gray-500 text-sm mt-8">
      © {new Date().getFullYear()} NoteVerse. All rights reserved.
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
