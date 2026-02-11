'use client'

import Image from "next/image";
import Link from "next/link";
import { FaPenFancy, FaBook, FaMagic, FaPalette, FaRocket, FaUsers, FaLock, FaSync, FaStar, FaArrowRight, FaChevronDown } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // auth provided by AuthProvider

  const features = [
    {
      icon: <FaPenFancy className="text-3xl" />,
      title: "Infinite Canvas",
      description: "Draw, sketch, and brainstorm on an infinite digital canvas with powerful drawing tools.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaBook className="text-3xl" />,
      title: "Smart Notebooks",
      description: "Organize notes in beautiful notebooks with rich text editing and markdown support.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaSync className="text-3xl" />,
      title: "Real-time Sync",
      description: "Access your notes anywhere with seamless cloud sync across all your devices.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <FaLock className="text-3xl" />,
      title: "End-to-End Encrypted",
      description: "Your thoughts are private and secure with military-grade encryption.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <FaUsers className="text-3xl" />,
      title: "Collaborate",
      description: "Share notebooks and collaborate in real-time with team members.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <FaMagic className="text-3xl" />,
      title: "AI Assistant",
      description: "Get smart suggestions, summaries, and organization powered by AI.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Product Designer",
      content: "NoteVerse transformed how I organize my design thinking. The canvas mode is a game-changer!",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      role: "Researcher",
      content: "Perfect balance between structure and creativity. My go-to for all research notes.",
      rating: 5
    },
    {
      name: "Michael Torres",
      role: "Student",
      content: "From lecture notes to study diagrams, NoteVerse handles everything beautifully.",
      rating: 5
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
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
                <>
                  <Link href="/login" className="hidden sm:inline text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
                  <Link
                    href="/signup"
                    className="relative inline-flex items-center px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </>
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-6">
              <FaRocket className="mr-2" />
              Introducing AI-Powered Notes
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="block">Where Your</span>
              <span className="block mt-2">
                <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-clip-text text-transparent animate-gradient-x">Thoughts</span>
                <span className="mx-4">Meet</span>
                <span className="bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 bg-clip-text text-transparent animate-gradient-x animation-delay-1000">Creativity</span>
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              NoteVerse is your all-in-one digital notebook. Capture ideas, draw diagrams, organize thoughts, 
              and collaborate seamlessly. Perfect for students, professionals, and creative minds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center"
              >
                Start Your Journey
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/library"
                className="bg-white text-gray-800 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-lg"
              >
                Try Demo
              </Link>
            </div>
            
            <div className="mt-16 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-4xl h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80"
                  alt="NoteVerse Interface"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <FaChevronDown className="text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need for Perfect Notes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple notes to complex diagrams, NoteVerse has all the tools you need
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl -z-10"></div>
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How NoteVerse Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, intuitive, and powerful. Start in seconds.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Create Your Space</h3>
              <p className="text-gray-600">
                Sign up for free and create your first notebook. Choose between canvas or text mode.
              </p>
            </div>
            
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Capture & Create</h3>
              <p className="text-gray-600">
                Write notes, draw diagrams, add images, and organize everything in one place.
              </p>
            </div>
            
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Sync & Share</h3>
              <p className="text-gray-600">
                Access from any device. Share with teammates or keep it private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Thinkers Worldwide</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of users who transformed their note-taking experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Note-Taking?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of users who have made NoteVerse their go-to note-taking solution. 
            Free forever for personal use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              Start Free Trial
              <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/library"
              className="bg-transparent text-white px-8 py-4 rounded-xl font-bold text-lg border-2 border-white/30 hover:border-white transition-all duration-300"
            >
              Explore Features
            </Link>
          </div>
          <p className="text-blue-200 mt-6 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Navbar is moved to layout for consistent cross-page header */}

      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">NV</span>
                </div>
                <span className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">Note</span>
                  <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">Verse</span>
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                The all-in-one note-taking universe for thinkers, creators, and visual minds.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                  <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                  <li><Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} NoteVerse. All rights reserved.</p>
            <p className="mt-2">Made with ❤️ for note-takers everywhere</p>
          </div>
        </div>
      </footer>

      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </main>
  );
}