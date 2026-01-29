
'use client';

import React, { useEffect, useState } from 'react';
import NotebookCover from './NotebookCover';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/custom/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Notebook {
    _id: string;
    title: string;
    coverColor: string;
    updatedAt: string;
    type?: 'canvas' | 'note';
}

export default function NotebookGrid() {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState<'canvas' | 'note'>('canvas');
    const [creatingStep, setCreatingStep] = useState(0); // 0: closed, 1: open

    // Fetch notebooks
    useEffect(() => {
        const fetchNotebooks = async () => {
            try {
                // Todo: dynamic userId
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error("Not auth");
                const userData = await res.json();

                const resNotes = await fetch(`/api/v2/notebooks?userId=${userData.user.id}`);
                const data = await resNotes.json();
                setNotebooks(data.notebooks || []);
            } catch (e) {
                console.error("Failed to fetch notebooks", e);
            } finally {
                setLoading(false);
            }
        };
        fetchNotebooks();
    }, []);

    const handleCreateClick = () => {
        setNewTitle('');
        setNewType('canvas');
        setIsCreating(true);
    };

    const confirmCreate = async () => {
        if (!newTitle.trim()) return;

        // Create a new notebook via API
        try {
            const resAuth = await fetch('/api/auth/me');
            if (!resAuth.ok) return;
            const userData = await resAuth.json();

            const res = await fetch('/api/v2/notebooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.user.id,
                    title: newTitle,
                    coverColor: '#3B82F6', // Default Blue
                    type: newType
                })
            });

            if (res.ok) {
                const data = await res.json();
                setNotebooks([data.notebook, ...notebooks]);
                setIsCreating(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8">Loading Library...</div>;

    return (
        <div className="p-8 relative">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-ink-primary">Documents</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCreateClick}
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-hover transition"
                    >
                        + New Notebook
                    </button>
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-ink-primary hover:bg-primary-soft hover:text-primary transition-colors shadow-sm"
                        title="Profile"
                    >
                        {/* Simple Profile Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {notebooks.map(nb => (
                    <NotebookCover
                        key={nb._id}
                        title={nb.title}
                        coverColor={nb.coverColor || '#3B82F6'}
                        onClick={() => router.push(`/notebook/${nb._id}`)}
                    />
                ))}

                {/* Empty State */}
                {notebooks.length === 0 && (
                    <div className="col-span-full text-center py-20 text-ink-muted">
                        No notebooks yet. Tap "+ New Notebook" to start.
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl shadow-2xl p-6 w-[400px] animate-in fade-in zoom-in duration-200 border border-border/50">
                        <h2 className="text-xl font-bold mb-4 text-ink-primary">Create New Notebook</h2>

                        <div className="space-y-4">
                            <div>
                                <Label className="mb-1 block text-ink-secondary">Notebook Title</Label>
                                <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Enter title..."
                                    autoFocus
                                    className="bg-background border-border text-ink-primary placeholder:text-ink-muted focus:border-primary"
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block text-ink-secondary">Type</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setNewType('canvas')}
                                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${newType === 'canvas'
                                            ? 'border-primary bg-primary-soft text-primary'
                                            : 'border-border hover:border-border/80 text-ink-secondary'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">✏️</div>
                                        <div className="text-sm font-medium">Canvas</div>
                                        <div className="text-[10px] text-ink-muted">Whiteboard</div>
                                    </button>

                                    <button
                                        onClick={() => setNewType('note')}
                                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${newType === 'note'
                                            ? 'border-primary bg-primary-soft text-primary'
                                            : 'border-border hover:border-border/80 text-ink-secondary'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">📝</div>
                                        <div className="text-sm font-medium">Note</div>
                                        <div className="text-[10px] text-ink-muted">Lines</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                                <Button variant="ghost" onClick={() => setIsCreating(false)} className="text-ink-secondary hover:text-ink-primary hover:bg-background">Cancel</Button>
                                <Button onClick={confirmCreate} disabled={!newTitle.trim()} className="bg-primary hover:bg-primary-hover text-white">Create</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
