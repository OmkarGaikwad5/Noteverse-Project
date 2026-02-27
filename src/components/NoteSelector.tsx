'use client'
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef } from "react";
import ModalWrapper from "./custom/ModalWrapper";
import { FiEdit2, FiTrash2, FiMoreVertical, FiPlus, FiFileText, FiX, FiArrowRight } from "react-icons/fi";
import { FaPalette, FaBook, FaCheck, FaPen, FaPenNib } from "react-icons/fa";
import { BsBrush } from "react-icons/bs";
import BinButton from "./custom/BinButton";
import { useSync } from "@/context/SyncContext";
import { useToast } from "@/hooks/useToast";

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
    const [notes, setNotes] = useState<Note[]>([]);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedNoteType, setSelectedNoteType] = useState<NoteType | null>(null);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState("");
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const toast = useToast();
    const menuRef = useRef<HTMLDivElement>(null);

    const { registerChange } = useSync();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadNotes = async () => {
            try {
                const res = await fetch("/api/notes/list", { cache: "no-store" });
                const data = await res.json();
                setNotes(data.notes || []);
            } catch (err) {
                console.error("Failed to load notes", err);
            }
        };

        loadNotes();
    }, []);

    useEffect(() => {
        const handler = () => {
            fetch("/api/notes/list")
                .then(r => r.json())
                .then(d => setNotes(d.notes));
        };

        window.addEventListener("noteverse-refresh", handler);
        return () => window.removeEventListener("noteverse-refresh", handler);
    }, []);

    const handleTitleEdit = async (id: string, newTitle: string) => {
        if (!newTitle.trim() || actionInProgress) return;
        
        setActionInProgress(id);
        
        try {
            const updatedNotes = notes.map((n) =>
                n.id === id ? { ...n, title: newTitle.trim(), updatedAt: new Date().toISOString() } : n
            );
            setNotes(updatedNotes);
            setEditingId(null);
            setOpenMenuId(null);
            registerChange(id);
            toast.success({ title: "Note renamed", description: "Title updated successfully." });
        } catch (error) {
            console.error("Failed to rename note:", error);
            toast.error({ title: "Rename failed", description: "Could not update note title." });
        } finally {
            setActionInProgress(null);
        }
    };

    const handleDelete = async (id: string) => {
    if (actionInProgress) return;

    setActionInProgress(id);
    setIsDeleting(true);

    try {
        const res = await fetch(`/api/notes/${id}/delete`, {
            method: "DELETE",
        });

        if (!res.ok) {
            throw new Error("Failed to delete");
        }

        // Remove from UI immediately
        setNotes(prev => prev.filter(n => n.id !== id));

        registerChange(id);
        setOpenMenuId(null);

        toast.success({
            title: "Moved to bin",
            description: "You can restore it anytime from Bin."
        });

    } catch (err) {
        console.error("Delete failed:", err);
        toast.error({
            title: "Delete failed",
            description: "Could not move note to bin."
        });
    } finally {
        setIsDeleting(false);
        setActionInProgress(null);
    }
};

    const createNote = async () => {
        if (!selectedNoteType || !newNoteTitle.trim()) {
            toast.info({ title: "Title required", description: "Enter a note title to continue." });
            return;
        }
        
        setIsCreating(true);
        setActionInProgress('creating');

        try {
            const response = await fetch("/api/notes/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newNoteTitle.trim(),
                    type: selectedNoteType
                })
            });

            if (!response.ok) throw new Error('Failed to create note');
            
            const data = await response.json();
            
            // Optimistically add to UI
            const newNote: Note = {
                id: data.noteId,
                title: newNoteTitle.trim(),
                type: selectedNoteType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            setNotes(prev => [newNote, ...prev]);
            
            setShowNewModal(false);
            setSelectedNoteType(null);
            setNewNoteTitle("");
            
            registerChange(newNote.id);
            toast.success({ title: "Note created", description: "Opening your new note." });
            
            // Navigate to the new note after a brief delay
            setTimeout(() => {
                navigate.push(`/note/${newNote.id}?mode=${newNote.type}`);
            }, 300);

        } catch (err) {
            console.error("Failed to create note:", err);
            toast.error({ title: "Creation failed", description: "Could not create note." });
        } finally {
            setIsCreating(false);
            setActionInProgress(null);
        }
    };

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const sortedNotes = [...notes].sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const getNoteTypeIcon = useCallback((type: NoteType) => {
        return type === 'canvas' ? <FaPalette className="text-sm" /> : <FaBook className="text-sm" />;
    }, []);

    const getNoteTypeColor = useCallback((type: NoteType) => {
        return type === 'canvas'
            ? { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' }
            : { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' };
    }, []);

    const handleNoteTypeSelect = useCallback((type: NoteType) => {
        setSelectedNoteType(type);
        if (!newNoteTitle) {
            setNewNoteTitle(`My ${type === 'canvas' ? 'Canvas' : 'Notebook'}`);
        }
    }, [newNoteTitle]);

    // Memoized feature data
    const canvasFeatures = React.useMemo(() => [
        { id: 'canvas-feature-1', icon: <FaPen className="text-blue-500 text-sm sm:text-base flex-shrink-0" />, text: 'Freehand drawing & sketching' },
        { id: 'canvas-feature-2', icon: <FaPalette className="text-blue-500 text-sm sm:text-base flex-shrink-0" />, text: 'Multiple brush types & colors' },
        { id: 'canvas-feature-3', icon: <FiArrowRight className="text-blue-500 text-sm sm:text-base flex-shrink-0" />, text: 'Perfect for diagrams & visual notes' }
    ], []);

    const notebookFeatures = React.useMemo(() => [
        { id: 'notebook-feature-1', icon: <FaPenNib className="text-purple-500 text-sm sm:text-base flex-shrink-0" />, text: 'Rich text formatting & styling' },
        { id: 'notebook-feature-2', icon: <FiFileText className="text-purple-500 text-sm sm:text-base flex-shrink-0" />, text: 'Organized pages & sections' },
        { id: 'notebook-feature-3', icon: <FiArrowRight className="text-purple-500 text-sm sm:text-base flex-shrink-0" />, text: 'Ideal for writing & documentation' }
    ], []);

    const statsData = React.useMemo(() => [
        { id: 'stats-total', bg: 'from-blue-50 to-blue-100', iconBg: 'from-blue-500 to-blue-600', icon: <FaBook className="text-white text-sm sm:text-xl" />, label: 'Total Notes', value: notes.length },
        { id: 'stats-canvas', bg: 'from-purple-50 to-purple-100', iconBg: 'from-purple-500 to-purple-600', icon: <FaPalette className="text-white text-sm sm:text-xl" />, label: 'Canvas Notes', value: notes.filter(n => n.type === 'canvas').length },
        { id: 'stats-notebook', bg: 'from-green-50 to-green-100', iconBg: 'from-green-500 to-green-600', icon: <FiFileText className="text-white text-sm sm:text-xl" />, label: 'Notebooks', value: notes.filter(n => n.type === 'notebook').length }
    ], [notes]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 pt-0 pb-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Notes</h1>
                        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                            {notes.length === 0
                                ? "No notes yet. Create your first note!"
                                : `${notes.length} note${notes.length !== 1 ? 's' : ''} • Last updated recently`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <BinButton animate={isDeleting} />
                    </div>
                </div>

                {/* Add New Card */}
                <div
                    onClick={() => setShowNewModal(true)}
                    className="cursor-pointer mb-6 sm:mb-8 group"
                >
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all duration-300 group-hover:scale-[1.01]">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FiPlus className="text-white text-xl sm:text-2xl" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">Create New Note</h3>
                            <p className="text-gray-600 text-sm sm:text-base max-w-md">
                                Start with a blank canvas or structured notebook. Choose what fits your creative flow.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notes Grid */}
                {notes.length > 0 && (
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Recent Notes</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {sortedNotes.map((note) => {
                                const colors = getNoteTypeColor(note.type);
                                const isMenuOpen = openMenuId === note.id;
                                const isProcessing = actionInProgress === note.id;
                                
                                return (
                                    <div
                                        key={note.id}
                                        className={`relative group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <div
                                            onClick={() => {
                                                if (editingId !== note.id && !isProcessing) {
                                                    navigate.push(`/note/${note.id}?mode=${note.type}`);
                                                }
                                            }}
                                            className="cursor-pointer bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group-hover:scale-[1.02] h-full"
                                        >
                                            {/* Note Type Indicator */}
                                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                <div className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${colors.bg} ${colors.text}`}>
                                                    {getNoteTypeIcon(note.type)}
                                                    <span className="hidden sm:inline">{note.type === 'canvas' ? 'Canvas' : 'Notebook'}</span>
                                                    <span className="sm:hidden">{note.type === 'canvas' ? 'Canvas' : 'Note'}</span>
                                                </div>

                                                {/* Options Menu */}
                                                <div className="relative flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(isMenuOpen ? null : note.id);
                                                        }}
                                                        disabled={isProcessing}
                                                        className={`p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        aria-label="Note options"
                                                    >
                                                        <FiMoreVertical className="text-sm sm:text-base" />
                                                    </button>
                                                    
                                                    {isMenuOpen && (
                                                        <div
                                                            ref={menuRef}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute right-0 top-full mt-1 w-40 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10 animate-in fade-in slide-in-from-top-2 duration-200"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setEditingId(note.id);
                                                                    setEditedTitle(note.title);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                disabled={isProcessing}
                                                                className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors text-sm sm:text-base disabled:opacity-50"
                                                            >
                                                                <FiEdit2 className="text-gray-500 text-sm sm:text-base" />
                                                                Rename
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleDelete(note.id);
                                                                }}
                                                                disabled={isProcessing}
                                                                className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-red-600 hover:bg-red-50 rounded-b-lg transition-colors text-sm sm:text-base disabled:opacity-50"
                                                            >
                                                                <FiTrash2 className="text-sm sm:text-base" />
                                                                {isProcessing ? 'Deleting...' : 'Move to Bin'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Note Title */}
                                            <div className="mb-3 sm:mb-4">
                                                {editingId === note.id ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editedTitle}
                                                        onChange={(e) => setEditedTitle(e.target.value)}
                                                        onBlur={() => handleTitleEdit(note.id, editedTitle)}
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === "Enter") {
                                                                handleTitleEdit(note.id, editedTitle);
                                                            }
                                                            if (e.key === "Escape") {
                                                                setEditingId(null);
                                                                setEditedTitle("");
                                                            }
                                                        }}
                                                        className="w-full text-base sm:text-lg font-semibold bg-white border-b-2 border-blue-500 focus:outline-none px-1 py-1 sm:py-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                        disabled={isProcessing}
                                                    />
                                                ) : (
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                                                        {note.title}
                                                        {isProcessing && (
                                                            <span className="ml-2 inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                                                        )}
                                                    </h3>
                                                )}
                                            </div>

                                            {/* Note Preview */}
                                            <div className={`h-20 sm:h-24 mb-3 sm:mb-4 rounded-lg flex items-center justify-center border ${note.type === 'canvas'
                                                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100'
                                                : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'
                                                }`}>
                                                <div className="text-center">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${colors.gradient} rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2`}>
                                                        {getNoteTypeIcon(note.type)}
                                                    </div>
                                                    <span className={`text-xs sm:text-sm font-medium ${colors.text}`}>
                                                        {note.type === 'canvas' ? 'Canvas Note' : 'Notebook'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="pt-3 sm:pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                                                    <span className="flex items-center gap-1 truncate">
                                                        Created: {formatDate(note.createdAt)}
                                                    </span>
                                                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                                                        <span className="text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                                                            Updated
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Effect Border */}
                                        <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-transparent group-hover:border-blue-400 transition-all duration-300 pointer-events-none"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                            <FaBook className="text-gray-400 text-xl sm:text-3xl" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3">No notes yet</h3>
                        <p className="text-gray-600 text-sm sm:text-base max-w-md mb-6 sm:mb-8">
                            Create your first note to start capturing ideas, sketches, and thoughts.
                        </p>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                        >
                            <FiPlus className="text-sm sm:text-lg" />
                            Create Your First Note
                        </button>
                    </div>
                )}

                {/* Stats Footer */}
                {notes.length > 0 && (
                    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {statsData.map((stat) => (
                                <div key={stat.id} className={`bg-gradient-to-r ${stat.bg} rounded-lg sm:rounded-xl p-4 sm:p-6`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-gray-700">{stat.label}</p>
                                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* New Note Modal - Split Layout */}
            <ModalWrapper isOpen={showNewModal} onClose={() => {
                setShowNewModal(false);
                setSelectedNoteType(null);
                setNewNoteTitle("");
            }}>
                {!selectedNoteType ? (
                    /* Fully Responsive Split Layout for Note Type Selection */
                    <div className="bg-white rounded-lg sm:rounded-2xl overflow-hidden w-full max-w-md md:max-w-4xl mx-auto my-4">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Create New Note</h2>
                                <p className="text-gray-600 mt-1 text-xs sm:text-sm">Choose your canvas to begin your journey</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowNewModal(false);
                                    setSelectedNoteType(null);
                                    setNewNoteTitle("");
                                }}
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="text-gray-500 text-lg sm:text-xl" />
                            </button>
                        </div>

                        {/* Split Layout Content - Fully responsive */}
                        <div className="flex flex-col md:flex-row h-auto max-h-[70vh] md:max-h-[500px] overflow-y-auto">
                            {/* Canvas Option */}
                            <div className="flex-1 p-6 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-b md:border-b-0 md:border-r border-gray-200">
                                <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px] md:min-h-0">
                                    {/* Icon with glow effect */}
                                    <div className="relative mb-4 sm:mb-6">
                                        <div className="w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center transition-transform duration-500 shadow-xl mx-auto">
                                            <BsBrush className="text-white text-2xl sm:text-2xl md:text-3xl" />
                                        </div>
                                        <div className="absolute inset-0 w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50 transition-opacity duration-500 -z-10 mx-auto left-0 right-0"></div>
                                    </div>

                                    <h3 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Canvas</h3>
                                    <p className="text-gray-600 text-sm sm:text-sm md:text-base mb-4 sm:mb-6 max-w-xs">
                                        Unleash your creativity with freehand drawing, sketching, and digital painting
                                    </p>

                                    <div className="space-y-2 sm:space-y-3 text-left w-full max-w-xs mx-auto mb-4 sm:mb-6">
                                        {canvasFeatures.map((feature) => (
                                            <div key={feature.id} className="flex items-center gap-2 sm:gap-3 text-gray-700 text-sm sm:text-sm">
                                                <span className="flex-shrink-0">{feature.icon}</span>
                                                <span className="text-left">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleNoteTypeSelect('canvas')}
                                        className="w-full sm:w-auto px-6 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                                    >
                                        Choose Canvas
                                        <FiArrowRight className="ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:flex items-center justify-center">
                                <div className="h-64 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                            </div>
                            <div className="md:hidden flex items-center justify-center py-3">
                                <div className="text-gray-400 text-sm font-medium">OR</div>
                            </div>

                            {/* Notebook Option */}
                            <div className="flex-1 p-6 sm:p-6 md:p-8 bg-gradient-to-br from-purple-50 to-purple-100">
                                <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px] md:min-h-0">
                                    {/* Icon with glow effect */}
                                    <div className="relative mb-4 sm:mb-6">
                                        <div className="w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transition-transform duration-500 shadow-xl mx-auto">
                                            <FaBook className="text-white text-2xl sm:text-2xl md:text-3xl" />
                                        </div>
                                        <div className="absolute inset-0 w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-50 transition-opacity duration-500 -z-10 mx-auto left-0 right-0"></div>
                                    </div>

                                    <h3 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Notebook</h3>
                                    <p className="text-gray-600 text-sm sm:text-sm md:text-base mb-4 sm:mb-6 max-w-xs">
                                        Organize your thoughts with rich text formatting and structured notes
                                    </p>

                                    <div className="space-y-2 sm:space-y-3 text-left w-full max-w-xs mx-auto mb-4 sm:mb-6">
                                        {notebookFeatures.map((feature) => (
                                            <div key={feature.id} className="flex items-center gap-2 sm:gap-3 text-gray-700 text-sm sm:text-sm">
                                                <span className="flex-shrink-0">{feature.icon}</span>
                                                <span className="text-left">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleNoteTypeSelect('notebook')}
                                        className="w-full sm:w-auto px-6 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                                    >
                                        Choose Notebook
                                        <FiArrowRight className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Name Your Note Modal - Fully Responsive */
                    <div className="bg-white rounded-lg sm:rounded-2xl p-6 sm:p-6 max-w-md mx-auto w-[95%] sm:w-full">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => setSelectedNoteType(null)}
                                    className="p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                >
                                    <FiX className="text-gray-500 text-base sm:text-base" />
                                </button>
                                <div className={`flex items-center gap-2 px-3 sm:px-3 py-1.5 sm:py-1.5 rounded-full text-sm sm:text-sm ${getNoteTypeColor(selectedNoteType).bg} ${getNoteTypeColor(selectedNoteType).text}`}>
                                    {getNoteTypeIcon(selectedNoteType)}
                                    <span className="font-medium">{selectedNoteType === 'canvas' ? 'Canvas' : 'Notebook'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                    Name your note
                                </label>
                                <input
                                    type="text"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    placeholder={`Enter a name for your ${selectedNoteType === 'canvas' ? 'canvas' : 'notebook'}`}
                                    className="w-full px-4 sm:px-4 py-3 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base sm:text-base"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newNoteTitle.trim()) {
                                            createNote();
                                        }
                                    }}
                                />
                                <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-2">
                                    Give your note a descriptive name to easily find it later.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 pt-3 sm:pt-4">
                                <button
                                    onClick={() => {
                                        setSelectedNoteType(null);
                                        setNewNoteTitle("");
                                    }}
                                    className="w-full sm:flex-1 px-4 sm:px-4 py-3 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer text-base sm:text-base order-2 sm:order-1"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={createNote}
                                    disabled={!newNoteTitle.trim() || isCreating}
                                    className={`w-full sm:flex-1 px-4 sm:px-4 py-3 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-base sm:text-base order-1 sm:order-2 ${
                                        !newNoteTitle.trim() || isCreating
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : `bg-gradient-to-r ${getNoteTypeColor(selectedNoteType).gradient} text-white hover:shadow-lg cursor-pointer`
                                    }`}
                                >
                                    {isCreating ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm sm:text-sm">Creating...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 sm:gap-2">
                                            <FaCheck className="text-sm sm:text-base" />
                                            <span>Create Note</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </ModalWrapper>
        </div>
    );
};

export default NoteSelector;