'use client';
import React, { useEffect, useState } from 'react';
import { FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { Dialog } from '@headlessui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

type NoteType = 'canvas' | 'notebook';

interface Note {
    _id: string;
    title: string;
    type: NoteType;
    createdAt: string;
    updatedAt?: string;
    isDeleted?: boolean;
}

const Bin: React.FC = () => {
    const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [permanentDeletingId, setPermanentDeletingId] = useState<string | null>(null);
    const navigate = useRouter();
    const toast = useToast();

    // Fetch deleted notes from API
    const loadBin = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notes/bin');
            if (!res.ok) throw new Error("Failed to fetch bin notes");
            const data = await res.json();
            setDeletedNotes(data.notes || []);
        } catch (error) {
            console.error("Failed to load bin:", error);
            toast.error({ title: "Error", description: "Failed to load deleted notes." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBin();
    }, []);

    // Listen for refresh events
    useEffect(() => {
        const handleRefresh = () => {
            loadBin();
        };
        window.addEventListener('noteverse-refresh', handleRefresh);
        return () => window.removeEventListener('noteverse-refresh', handleRefresh);
    }, []);

    const handleRestore = async (id: string) => {
        setRestoringId(id);
        try {
            const res = await fetch(`/api/notes/${id}/restore`, {
                method: 'PUT'
            });

            if (!res.ok) throw new Error("Failed to restore note");

            toast.success({ 
                title: "Note restored", 
                description: "Note has been restored to your notes." 
            });
            
            // Refresh the bin list
            await loadBin();
            
            // Dispatch event to refresh home page
            window.dispatchEvent(new CustomEvent('noteverse-refresh'));
        } catch (error) {
            console.error("Failed to restore note:", error);
            toast.error({ title: "Error", description: "Failed to restore note." });
        } finally {
            setRestoringId(null);
        }
    };

    const handlePermanentDelete = async () => {
        if (!deleteTarget) return;
        
        setPermanentDeletingId(deleteTarget._id);
        try {
            const res = await fetch(`/api/notes/${deleteTarget._id}/permanent`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Failed to delete permanently");

            toast.success({ 
                title: "Deleted permanently", 
                description: `"${deleteTarget.title}" was removed permanently.` 
            });
            
            // Refresh the bin list
            await loadBin();
            setDeleteTarget(null);
        } catch (error) {
            console.error("Failed to delete note permanently:", error);
            toast.error({ title: "Error", description: "Failed to delete note." });
        } finally {
            setPermanentDeletingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center justify-between mb-8">
                <div onClick={() => navigate.push('/home')} className='flex cursor-pointer items-center gap-5'>
                    <span>
                        <FaArrowLeft size={20} />
                    </span>
                    <h1 className="text-3xl flex gap-2 items-center font-bold text-slate-800">
                        <FiTrash2 size={26} />
                        Bin
                    </h1>
                </div>
                <span className="text-gray-500 text-sm">
                    {deletedNotes.length} {deletedNotes.length === 1 ? 'note' : 'notes'}
                </span>
            </div>

            {deletedNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-24 text-slate-400">
                    <FiTrash2 size={64} />
                    <p className="mt-4 text-lg font-medium">Your bin is empty</p>
                    <p className="text-sm text-slate-400 mt-1">Deleted notes will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deletedNotes.map((note) => {
                        const isRestoring = restoringId === note._id;
                        const isDeleting = permanentDeletingId === note._id;
                        return (
                            <div
                                key={note._id}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-300"
                            >
                                <div className="mb-2">
                                    <h2 className="text-lg font-semibold text-slate-800 truncate">{note.title}</h2>
                                    <p className="text-sm text-gray-500 capitalize">{note.type}</p>
                                </div>
                                <p className="text-xs text-gray-400 mb-4">
                                    Deleted on {note.updatedAt ? formatDate(note.updatedAt) : 'recently'}
                                </p>
                                <div className="flex justify-between items-center gap-3">
                                    <button
                                        onClick={() => handleRestore(note._id)}
                                        disabled={isRestoring || isDeleting}
                                        className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium transition disabled:opacity-50"
                                    >
                                        {isRestoring ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Restoring...
                                            </>
                                        ) : (
                                            <>
                                                <FiRotateCcw size={16} />
                                                Restore
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(note)}
                                        disabled={isRestoring || isDeleting}
                                        className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium transition disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <FiTrash2 size={16} />
                                                Delete Forever
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Delete Modal */}
            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                className="fixed z-50 inset-0 flex items-center justify-center p-4 bg-black/40"
            >
                <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                    <Dialog.Title className="text-lg font-semibold text-slate-800 mb-2">
                        Permanently delete note?
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-500 mb-4">
                        This action cannot be undone. Delete&nbsp;
                        <span className="font-semibold">&quot;{deleteTarget?.title}&quot;</span>?
                    </Dialog.Description>
                    <div className="flex justify-end gap-3">
                        <button
                            className="px-4 py-1.5 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                            onClick={handlePermanentDelete}
                        >
                            Delete
                        </button>
                    </div>
                </Dialog.Panel>
            </Dialog>
        </div>
    );
};

export default Bin;