
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
                <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
                <button
                    onClick={handleCreateClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                    + New Notebook
                </button>
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
                    <div className="col-span-full text-center py-20 text-gray-400">
                        No notebooks yet. Tap "+ New Notebook" to start.
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Create New Notebook</h2>

                        <div className="space-y-4">
                            <div>
                                <Label className="mb-1 block text-gray-700">Notebook Title</Label>
                                <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Enter title..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block text-gray-700">Type</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setNewType('canvas')}
                                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${newType === 'canvas'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">✏️</div>
                                        <div className="text-sm font-medium">Canvas</div>
                                        <div className="text-[10px] text-gray-400">Whiteboard</div>
                                    </button>

                                    <button
                                        onClick={() => setNewType('note')}
                                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${newType === 'note'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">📝</div>
                                        <div className="text-sm font-medium">Note</div>
                                        <div className="text-[10px] text-gray-400">Lines</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button onClick={confirmCreate} disabled={!newTitle.trim()}>Create</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
