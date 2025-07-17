'use client';
import React, { useEffect, useState } from 'react';
import { FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { Dialog } from '@headlessui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

type NoteType = 'canvas' | 'notebook';

interface Note {
    id: string;
    title: string;
    type: NoteType;
    createdAt: string;
}

const BIN_STORAGE_KEY = 'noteverse-bin';
const NOTES_STORAGE_KEY = 'noteverse-notes';

const Bin: React.FC = () => {
    const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
    const navigate = useRouter();
    useEffect(() => {
        const binData = localStorage.getItem(BIN_STORAGE_KEY);
        if (binData) setDeletedNotes(JSON.parse(binData));
    }, []);

    const handleRestore = (id: string) => {
        const note = deletedNotes.find((n) => n.id === id);
        if (!note) return;

        const updatedBin = deletedNotes.filter((n) => n.id !== id);
        localStorage.setItem(BIN_STORAGE_KEY, JSON.stringify(updatedBin));
        setDeletedNotes(updatedBin);

        const existingNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
        const updatedNotes = [note, ...existingNotes];
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    };

    const handlePermanentDelete = () => {
        if (!deleteTarget) return;
        const updatedBin = deletedNotes.filter((n) => n.id !== deleteTarget.id);
        localStorage.setItem(BIN_STORAGE_KEY, JSON.stringify(updatedBin));
        setDeletedNotes(updatedBin);
        setDeleteTarget(null);
    };

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center justify-between mb-8">
                <div onClick={() => navigate.push('/home')} className='flex cursor-pointer items-center gap-5'>
                    <span className=''>
                        <FaArrowLeft size={20} />
                    </span>
                    <h1 className="text-3xl flex gap-2 items-center font-bold text-slate-800">
                        <span>
                            <FiTrash2 size={26} />
                        </span>
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
                            key={note.id}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-300"
                        >
                            <div className="mb-2">
                                <h2 className="text-lg font-semibold text-slate-800 truncate">{note.title}</h2>
                                <p className="text-sm text-gray-500 capitalize">{note.type}</p>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">
                                Deleted on {new Date(note.createdAt).toLocaleString()}
                            </p>
                            <div className="flex justify-between items-center gap-3">
                                <button
                                    onClick={() => handleRestore(note.id)}
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

            {/* ❗ Confirm Delete Modal */}
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
                        This action cannot be undone. Are you sure you want to permanently delete&nbsp;
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