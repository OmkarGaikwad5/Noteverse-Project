"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/custom/button';
import { FaSignOutAlt, FaUser, FaBook, FaLayerGroup, FaEnvelope, FaCalendarAlt, FaChevronLeft } from 'react-icons/fa';

interface UserProfile {
    name: string;
    email: string;
    joinedAt: string;
}

interface UserStats {
    notes: number;
    canvases: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats>({ notes: 0, canvases: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                // Optional: Redirect to login if unauthorized
                // router.push('/login'); 
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/home');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-ink-secondary animate-pulse">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-coral font-medium">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                {/* Header / Back */}
                <div className="mb-8">
                    <Link href="/library" className="group inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors">
                        <div className="p-2 rounded-full bg-surface group-hover:bg-primary-soft group-hover:text-primary transition-all">
                            <FaChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Back to Library</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: User Card */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-soft to-indigo-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-surface shadow-inner text-3xl font-bold text-primary">
                                {user?.name?.charAt(0).toUpperCase() || <FaUser />}
                            </div>
                            <h2 className="text-xl font-bold text-ink-primary">{user?.name || 'Guest User'}</h2>
                            <p className="text-sm text-ink-secondary mb-6">{user?.email}</p>

                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <FaSignOutAlt /> Log Out
                            </Button>
                        </div>

                        <div className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider">Details</h3>
                            <div className="flex items-center gap-3 text-ink-primary">
                                <FaEnvelope className="text-ink-muted w-4 h-4" />
                                <span className="text-sm truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-ink-primary">
                                <FaCalendarAlt className="text-ink-muted w-4 h-4" />
                                <span className="text-sm">Joined {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Activity */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-ink-primary mb-6">Overview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Notebooks Stat */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 p-6 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
                                        <FaBook className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-gray-900">{stats.notes}</div>
                                        <div className="text-sm font-medium text-blue-600/80">Total Notebooks</div>
                                    </div>
                                </div>

                                {/* Canvases Stat */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 p-6 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                        <FaLayerGroup className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-gray-900">{stats.canvases}</div>
                                        <div className="text-sm font-medium text-emerald-600/80">Total Canvases</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Placeholder for future activity or settings */}
                        <div className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-sm h-64 flex items-center justify-center text-ink-muted border-dashed">
                            <p className="text-sm">Account Settings & Activity History (Coming Soon)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
