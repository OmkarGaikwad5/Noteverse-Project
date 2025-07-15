'use client'
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NoteOptions from "./NoteOptions";
import ModalWrapper from "./custom/ModalWrapper";


type NoteType = "canvas" | "notebook";

interface Note {
    id: string;
    title: string;
    type: NoteType;
    createdAt: string;
}

const LOCAL_STORAGE_KEY = "noteverse-notes";

const NoteSelector: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [showNewModal, setShowNewModal] = useState(false);
    const navigate = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState("");

    const handleTitleEdit = (id: string, newTitle: string) => {
        const updatedNotes = notes.map((n) =>
            n.id === id ? { ...n, title: newTitle } : n
        );
        setNotes(updatedNotes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedNotes));
        setEditingId(null);
    };

    // 🔁 Load notes from localStorage on component mount
    useEffect(() => {
        const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, []);

    const createNote = (type: NoteType) => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: `Untitled ${notes.length + 1}`,
            type,
            createdAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedNotes));
        setShowNewModal(false);
        navigate.push(`/note/${newNote.id}?mode=${type}`);
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Your Notebooks ({notes.length})</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div onClick={() => setShowNewModal(true)} className="cursor-pointer flex items-center justify-center rounded-xl border p-4 shadow hover:shadow-md transition">
                    <span
                        className="text-royal-blue"
                    >
                        + Add New
                    </span>
                </div>
                {notes.map((note) => {

                    return (
                        <div
                            key={note.id}
                            onClick={() => {
                                if (editingId !== note.id) {
                                    navigate.push(`/note/${note.id}?mode=${note.type}`);
                                }
                            }}
                            className="cursor-pointer rounded-xl border p-4 shadow hover:shadow-md transition group"
                        >
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
                                    }}
                                    className="w-full focus:outline-none text-lg font-semibold bg-white rounded px-2 py-1"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <div
                                    className="flex justify-between items-center gap-2"
                                >
                                    <h2
                                        className="text-lg font-semibold flex-1 truncate"
                                    >
                                        {note.title}
                                    </h2>
                                    <button
                                        className="text-sm text-royal-blue hover:underline opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingId(note.id);
                                            setEditedTitle(note.title);
                                        }}
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                            <p className="text-sm text-gray-500 capitalize">{note.type}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(note.createdAt).toLocaleString()}
                            </p>
                        </div>
                    );
                })}
            </div>

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
