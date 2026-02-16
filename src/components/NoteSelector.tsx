'use client'
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import ModalWrapper from "./custom/ModalWrapper";
import { FiEdit2, FiTrash2, FiMoreVertical, FiPlus, FiFileText, FiX, FiArrowRight } from "react-icons/fi";
import { FaPalette, FaBook, FaCheck, FaPen, FaPenNib } from "react-icons/fa";
import { BsBrush } from "react-icons/bs";
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
    const [selectedNoteType, setSelectedNoteType] = useState<NoteType | null>(null);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
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

    const createNote = () => {
        if (!selectedNoteType || !newNoteTitle.trim()) return;
        
        setIsCreating(true);
        
        const newNote: Note = {
            id: Date.now().toString(),
            title: newNoteTitle.trim() || `Untitled ${notes.length + 1}`,
            type: selectedNoteType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        setTimeout(() => {
            const updatedNotes = [newNote, ...notes];
            setNotes(updatedNotes);
            setShowNewModal(false);
            setSelectedNoteType(null);
            setNewNoteTitle("");
            setIsCreating(false);
            registerChange(newNote.id);
            
            // Navigate to the new note after a brief delay
            setTimeout(() => {
                navigate.push(`/note/${newNote.id}?mode=${newNote.type}`);
            }, 300);
        }, 500);
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

    const getNoteTypeIcon = (type: NoteType) => {
        return type === 'canvas' ? <FaPalette className="text-sm" /> : <FaBook className="text-sm" />;
    };

    const getNoteTypeColor = (type: NoteType) => {
        return type === 'canvas' 
            ? { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' }
            : { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' };
    };

    const handleNoteTypeSelect = (type: NoteType) => {
        setSelectedNoteType(type);
        if (!newNoteTitle) {
            setNewNoteTitle(`My ${type === 'canvas' ? 'Canvas' : 'Notebook'}`);
        }
    };

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
                                return (
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
                                                            handleDelete(note.id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Move to Bin"
                                                    >
                                                        <FiTrash2 className="text-sm sm:text-base" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setShowMenuId(showMenuId === note.id ? null : note.id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <FiMoreVertical className="text-sm sm:text-base" />
                                                    </button>
                                                    
                                                    {showMenuId === note.id && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute right-0 top-full mt-1 w-40 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10 animate-in fade-in slide-in-from-top-2 duration-200"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(note.id);
                                                                    setEditedTitle(note.title);
                                                                    setShowMenuId(null);
                                                                }}
                                                                className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors text-sm sm:text-base"
                                                            >
                                                                <FiEdit2 className="text-gray-500 text-sm sm:text-base" />
                                                                Rename
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(note.id);
                                                                }}
                                                                className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-red-600 hover:bg-red-50 rounded-b-lg transition-colors text-sm sm:text-base"
                                                            >
                                                                <FiTrash2 className="text-sm sm:text-base" />
                                                                Move to Bin
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
                                                        onBlur={() => handleTitleEdit(note.id, editedTitle.trim() || "Untitled")}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleTitleEdit(note.id, editedTitle.trim() || "Untitled");
                                                            }
                                                            if (e.key === "Escape") {
                                                                setEditingId(null);
                                                            }
                                                        }}
                                                        className="w-full text-base sm:text-lg font-semibold bg-white border-b-2 border-blue-500 focus:outline-none px-1 py-1 sm:py-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                                                        {note.title}
                                                    </h3>
                                                )}
                                            </div>

                                            {/* Note Preview */}
                                            <div className={`h-20 sm:h-24 mb-3 sm:mb-4 rounded-lg flex items-center justify-center border ${
                                                note.type === 'canvas' 
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
                                                    {note.updatedAt && (
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
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <FaBook className="text-white text-sm sm:text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-blue-700 font-medium">Total Notes</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{notes.length}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <FaPalette className="text-white text-sm sm:text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-purple-700 font-medium">Canvas Notes</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {notes.filter(n => n.type === 'canvas').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg sm:rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                        <FiFileText className="text-white text-sm sm:text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-green-700 font-medium">Notebooks</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {notes.filter(n => n.type === 'notebook').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                    /* Responsive Split Layout for Note Type Selection */
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

                        {/* Split Layout Content - Stack vertically on mobile */}
                        <div className="flex flex-col md:flex-row h-auto md:h-[500px] overflow-y-auto">
                            {/* Canvas Option */}
                            <div className="flex-1 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-b md:border-b-0 md:border-r border-gray-200">
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    {/* Icon with glow effect */}
                                    <div className="relative mb-4 sm:mb-6">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center transition-transform duration-500 shadow-xl mx-auto">
                                            <BsBrush className="text-white text-xl sm:text-2xl md:text-3xl" />
                                        </div>
                                        <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50 transition-opacity duration-500 -z-10 mx-auto left-0 right-0"></div>
                                    </div>
                                    
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Canvas</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 max-w-xs md:max-w-sm">
                                        Unleash your creativity with freehand drawing, sketching, and digital painting
                                    </p>
                                    
                                    <div className="space-y-2 sm:space-y-3 text-left w-full max-w-xs mx-auto mb-4 sm:mb-0">
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 text-xs sm:text-sm">
                                            <FaPen className="text-blue-500 text-sm sm:text-base flex-shrink-0" />
                                            <span>Freehand drawing & sketching</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 text-xs sm:text-sm">
                                            <FaPalette className="text-blue-500 text-sm sm:text-base flex-shrink-0" />
                                            <span>Multiple brush types & colors</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 text-xs sm:text-sm">
                                            <FiArrowRight className="text-blue-500 text-sm sm:text-base flex-shrink-0" />
                                            <span>Perfect for diagrams & visual notes</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleNoteTypeSelect('canvas')}
                                        className="mt-4 sm:mt-6 md:mt-8 w-full md:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                                    >
                                        Choose Canvas
                                        <FiArrowRight className="ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Divider for mobile */}
                            <div className="hidden md:flex items-center justify-center">
                                <div className="h-64 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                            </div>
                            <div className="md:hidden flex items-center justify-center py-2">
                                <div className="text-gray-400 text-xs">OR</div>
                            </div>

                            {/* Notebook Option */}
                            <div className="flex-1 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-purple-50 to-purple-100">
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    {/* Icon with glow effect */}
                                    <div className="relative mb-4 sm:mb-6">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transition-transform duration-500 shadow-xl mx-auto">
                                            <FaBook className="text-white text-xl sm:text-2xl md:text-3xl" />
                                        </div>
                                        <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-50 transition-opacity duration-500 -z-10 mx-auto left-0 right-0"></div>
                                    </div>
                                    
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Notebook</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 max-w-xs md:max-w-sm">
                                        Organize your thoughts with rich text formatting and structured notes
                                    </p>
                                    
                                    <div className="space-y-2 sm:space-y-3 text-left w-full max-w-xs mx-auto mb-4 sm:mb-0">
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 text-xs sm:text-sm">
                                            <FaPenNib className="text-purple-500 text-sm sm:text-base flex-shrink-0" />
                                            <span>Rich text formatting & styling</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 text-xs sm:text-sm">
                                            <FiFileText className="text-purple-500 text-sm sm:text-base flex-shrink-0" />
                                            <span>Organized pages & sections</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 text-xs sm:text-sm">
                                            <FiArrowRight className="text-purple-500 text-sm sm:text-base flex-shrink-0" />
                                            <span>Ideal for writing & documentation</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleNoteTypeSelect('notebook')}
                                        className="mt-4 sm:mt-6 md:mt-8 w-full md:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                                    >
                                        Choose Notebook
                                        <FiArrowRight className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Name Your Note Modal - Mobile Responsive */
                    <div className="bg-white rounded-lg sm:rounded-2xl p-4 sm:p-6 max-w-md mx-auto w-full">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => setSelectedNoteType(null)}
                                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                >
                                    <FiX className="text-gray-500 text-sm sm:text-base" />
                                </button>
                                <div className={`flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm ${getNoteTypeColor(selectedNoteType).bg} ${getNoteTypeColor(selectedNoteType).text}`}>
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
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newNoteTitle.trim()) {
                                            createNote();
                                        }
                                    }}
                                />
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                                    Give your note a descriptive name to easily find it later.
                                </p>
                            </div>

                            <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                                <button
                                    onClick={() => {
                                        setSelectedNoteType(null);
                                        setNewNoteTitle("");
                                    }}
                                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={createNote}
                                    disabled={!newNoteTitle.trim() || isCreating}
                                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
                                        !newNoteTitle.trim() || isCreating
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : `bg-gradient-to-r ${getNoteTypeColor(selectedNoteType).gradient} text-white hover:shadow-lg cursor-pointer`
                                    }`}
                                >
                                    {isCreating ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs sm:text-sm">Creating...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
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
