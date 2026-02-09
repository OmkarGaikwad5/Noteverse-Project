'use client'
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import NoteOptions from "./NoteOptions";
import ModalWrapper from "./custom/ModalWrapper";
import { FiEdit2, FiTrash2, FiMoreVertical, FiPlus, FiFileText, FiImage } from "react-icons/fi";
import { FaPalette, FaBook } from "react-icons/fa";
import BinButton from "./custom/BinButton";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useSync } from "@/context/SyncContext";

type NoteType = "canvas" | "notebook";

interface Note {
    id: string;
    title: string;
    type: NoteType;
    createdAt: string;
    updatedAt?: string;
}

const LOCAL_STORAGE_KEY = "noteverse-notes";
const BIN_STORAGE_KEY = "noteverse-bin";

const NoteSelector: React.FC = () => {
    const [notes, setNotes] = usePersistentState<Note[]>(LOCAL_STORAGE_KEY, []);
    const [showNewModal, setShowNewModal] = useState(false);
    const navigate = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState("");
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [showMenuId, setShowMenuId] = useState<string | null>(null);

    const { registerChange } = useSync();

    const handleTitleEdit = (id: string, newTitle: string) => {
        const updatedNotes = notes.map((n) =>
            n.id === id ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n
        );
        setNotes(updatedNotes);
        setEditingId(null);
        setShowMenuId(null);
        registerChange(id);
    };

    const handleDelete = (id: string) => {
        const noteToDelete = notes.find((n) => n.id === id);
        if (!noteToDelete) return;
        setIsDeleting(true);

        const updatedNotes = notes.filter((n) => n.id !== id);
        setNotes(updatedNotes);

        const existingBin = JSON.parse(localStorage.getItem(BIN_STORAGE_KEY) || "[]");
        const updatedBin = [{ ...noteToDelete, isDeleted: true, updatedAt: new Date().toISOString() }, ...existingBin];
        localStorage.setItem(BIN_STORAGE_KEY, JSON.stringify(updatedBin));

        registerChange(id);
        setShowMenuId(null);

        setTimeout(() => {
            setIsDeleting(false);
        }, 100);
    };

    const createNote = (type: NoteType) => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: `Untitled ${notes.length + 1}`,
            type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        setShowNewModal(false);
        registerChange(newNote.id);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return "Today";
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const sortedNotes = [...notes].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
                        <p className="text-gray-600 mt-2">
                            {notes.length === 0 
                                ? "No notes yet. Create your first note!" 
                                : `${notes.length} note${notes.length !== 1 ? 's' : ''} • Last updated recently`}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <BinButton animate={isDeleting} />
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                            <FiPlus className="text-lg" />
                            New Note
                        </button>
                    </div>
                </div>

                {/* Add New Card */}
                <div 
                    onClick={() => setShowNewModal(true)}
                    className="cursor-pointer mb-8 group"
                >
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all duration-300 group-hover:scale-[1.01]">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FiPlus className="text-white text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Create New Note</h3>
                            <p className="text-gray-600 max-w-md">
                                Start with a blank canvas or structured notebook. Choose what fits your creative flow.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notes Grid */}
                {notes.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Notes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedNotes.map((note) => (
                                <div
                                    key={note.id}
                                    className="relative group"
                                >
                                    <div
                                        onClick={() => {
                                            if (editingId !== note.id) {
                                                navigate.push(`/note/${note.id}?mode=${note.type}`);
                                            }
                                        }}
                                        className="cursor-pointer bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group-hover:scale-[1.02] h-full"
                                    >
                                        {/* Note Type Indicator */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                                note.type === 'canvas' 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {note.type === 'canvas' ? (
                                                    <>
                                                        <FaPalette className="text-sm" />
                                                        Canvas
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaBook className="text-sm" />
                                                        Notebook
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Options Menu */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMenuId(showMenuId === note.id ? null : note.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <FiMoreVertical />
                                                </button>
                                                
                                                {showMenuId === note.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingId(note.id);
                                                                setEditedTitle(note.title);
                                                                setShowMenuId(null);
                                                            }}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
                                                        >
                                                            <FiEdit2 className="text-gray-500" />
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(note.id);
                                                            }}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
                                                        >
                                                            <FiTrash2 />
                                                            Move to Bin
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Note Title */}
                                        <div className="mb-4">
                                            {editingId === note.id ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editedTitle}
                                                    onChange={(e) => setEditedTitle(e.target.value)}
                                                    onBlur={() => handleTitleEdit(note.id, editedTitle.trim() || "Untitled")}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleTitleEdit(note.id, editedTitle.trim() || "Untitled");
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingId(null);
                                                        }
                                                    }}
                                                    className="w-full text-lg font-semibold bg-white border-b-2 border-blue-500 focus:outline-none px-1 py-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                                    {note.title}
                                                </h3>
                                            )}
                                        </div>

                                        {/* Note Preview */}
                                        <div className={`h-24 mb-4 rounded-lg flex items-center justify-center ${
                                            note.type === 'canvas' 
                                                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100' 
                                                : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100'
                                        }`}>
                                            {note.type === 'canvas' ? (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                        <FaPalette className="text-white text-xl" />
                                                    </div>
                                                    <span className="text-sm text-blue-700 font-medium">Canvas Note</span>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                        <FaBook className="text-white text-xl" />
                                                    </div>
                                                    <span className="text-sm text-purple-700 font-medium">Notebook</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    Created: {formatDate(note.createdAt)}
                                                </span>
                                                {note.updatedAt && (
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        Updated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover Effect Border */}
                                    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-400 transition-all duration-300 pointer-events-none"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
                            <FaBook className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-3">No notes yet</h3>
                        <p className="text-gray-600 max-w-md mb-8">
                            Create your first note to start capturing ideas, sketches, and thoughts.
                        </p>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                            <FiPlus className="text-lg" />
                            Create Your First Note
                        </button>
                    </div>
                )}

                {/* Stats Footer */}
                {notes.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <FaBook className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-700 font-medium">Total Notes</p>
                                        <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <FaPalette className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-700 font-medium">Canvas Notes</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {notes.filter(n => n.type === 'canvas').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                        <FiFileText className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700 font-medium">Notebooks</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {notes.filter(n => n.type === 'notebook').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* New Note Modal */}
            <ModalWrapper isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
                <NoteOptions
                    onSelectMode={(mode) => {
                        createNote(mode);
                        setShowNewModal(false);
                    }}
                />
            </ModalWrapper>
        </div>
    );
};

export default NoteSelector;