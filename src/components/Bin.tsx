'use client';
import React, { useEffect, useState } from 'react';
import { FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { Dialog } from '@headlessui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

type NoteType = 'canvas' | 'notebook';

interface Note {
    _id: string;
    title: string;
    type: NoteType;
    createdAt: string;
}

const Bin: React.FC = () => {
    const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useRouter();

    /* ================= LOAD BIN FROM DATABASE ================= */
    const loadBin = async () => {
        try {
            const res = await fetch('/api/notes/bin', { cache: 'no-store' });
            const data = await res.json();

            console.log("BIN NOTES FROM DB:", data);

            setDeletedNotes(data.notes || []);
        } catch (err) {
            console.error("Failed to load bin:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBin();
    }, []);

    /* ================= RESTORE NOTE ================= */
    const handleRestore = async (id: string) => {
        try {
            await fetch(`/api/notes/${id}/restore`, {
                method: 'PUT'
            });

            await loadBin();
        } catch (err) {
            console.error("Restore failed:", err);
        }
    };

    /* ================= PERMANENT DELETE ================= */
    const handlePermanentDelete = async () => {
        if (!deleteTarget) return;

        try {
            await fetch(`/api/notes/${deleteTarget._id}/permanent`, {
                method: 'DELETE'
            });

            setDeleteTarget(null);
            await loadBin();
        } catch (err) {
            console.error("Permanent delete failed:", err);
        }
    };

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500 text-lg">
                Loading Bin...
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
                    {deletedNotes.map((note) => (
                        <div
                            key={note._id}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-300"
                        >
                            <div className="mb-2">
                                <h2 className="text-lg font-semibold text-slate-800 truncate">{note.title}</h2>
                                <p className="text-sm text-gray-500 capitalize">{note.type}</p>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">
                                Deleted note
                            </p>
                            <div className="flex justify-between items-center gap-3">
                                <button
                                    onClick={() => handleRestore(note._id)}
                                    className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium transition"
                                >
                                    <FiRotateCcw size={16} />
                                    Restore
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(note)}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium transition"
                                >
                                    <FiTrash2 size={16} />
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    ))}
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
