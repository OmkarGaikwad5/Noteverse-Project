'use client'
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import NoteOptions from "./NoteOptions";
import ModalWrapper from "./custom/ModalWrapper";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import BinButton from "./custom/BinButton";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useSync } from "@/context/SyncContext";

type NoteType = "canvas" | "notebook";

interface Note {
    id: string;
    title: string;
    type: NoteType;
    createdAt: string;
    updatedAt?: string; // Added for sync
}

const LOCAL_STORAGE_KEY = "noteverse-notes";
const BIN_STORAGE_KEY = "noteverse-bin";

const NoteSelector: React.FC = () => {
    // using usePersistentState handling localStorage sync automatically
    const [notes, setNotes] = usePersistentState<Note[]>(LOCAL_STORAGE_KEY, []);
    const [showNewModal, setShowNewModal] = useState(false);
    const navigate = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState("");
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const { registerChange } = useSync();

    const handleTitleEdit = (id: string, newTitle: string) => {
        const updatedNotes = notes.map((n) =>
            n.id === id ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n
        );
        setNotes(updatedNotes);
        setEditingId(null);
        registerChange(id);
    };

    const handleDelete = (id: string) => {
        const noteToDelete = notes.find((n) => n.id === id);
        if (!noteToDelete) return;
        setIsDeleting(true);

        // Remove from Notes
        const updatedNotes = notes.filter((n) => n.id !== id);
        setNotes(updatedNotes); // syncs to LOCAL_STORAGE_KEY

        // Add to Bin (Manual localStorage for Bin for now, or use another hook? 
        // Bin should also be synced! But for now let's keep it manual or simple)
        // ideally Bin should use usePersistentState too but it's another key.
        // We can just do manual update for Bin since it's "deleted"
        // But crucially, we must registerChange(id) so the deletion status is synced to server.
        // The server needs to know it's deleted. 
        // Our Note schema has isDeleted. 
        // Logic: Note exists in DB but isDeleted=true.
        // So we should Update the note metadata to set isDeleted=true.
        // But here we REMOVE it from `notes` array.
        // If we remove it from `notes` array locally, the next sync of "notes list" might NOT contain it.
        // BUT `registerChange(id)` will try to find the note in `storage.getNotes()`.
        // If it's gone from `noteverse-notes`, `processQueue` won't find it to sync!

        // FIX: The Local-First Sync strategy for Deletion.
        // 1. Mark as isDeleted=true in `notes` list?
        // 2. OR Move to `bin` list.
        // If we move to `bin`, `processQueue` needs to look in `bin` too?
        // OR `processQueue` only syncs "active" notes?
        // The server handles soft delete.

        // Correct approach: 
        // When deleting, we should probably keep it in a "global" index or ensure the API call happens.
        // Simple hack: We soft-delete locally too if we want to sync it easily.
        // But the UI expects it removed.

        // Let's stick to existing UI behavior: Move to Bin.
        // But for SYNC, we need to send the update `isDeleted: true`.
        // If I call registerChange(id) but the note is not in `notes` list, `processQueue` logic below:
        // `const allNotes = storage.getNotes(); const dirtyNoteMetas = allNotes.filter...`
        // It won't find it!

        // So I must manually update Bin AND maybe handle the sync payload explicitly?
        // Or updated `processQueue` to check Bin too.
        // Use `storage.getNotes()` AND `storage.getBinNotes()`.

        // For this refactor, I will just do the manual bin move and rely on "Deleted" status being synced 
        // if I add it to the Bin list which I should ALSO use `usePersistentState` for?
        // Let's keep manual Bin management but register change.
        // I need to update `processQueue` to read from Bin too? 
        // Or I can update `NoteSelector` to send an API request for deletion directly? 
        // Violates "Local-First" if blocking.
        // Better: Update `storage.getNotes()` to return both? No.

        // Let's just handle Bin update manually here.
        const existingBin = JSON.parse(localStorage.getItem(BIN_STORAGE_KEY) || "[]");
        const updatedBin = [{ ...noteToDelete, isDeleted: true, updatedAt: new Date().toISOString() }, ...existingBin];
        localStorage.setItem(BIN_STORAGE_KEY, JSON.stringify(updatedBin));

        registerChange(id); // This queues it. 
        // I need to ensure `processQueue` can find it. 
        // I will assume `processQueue` in `SyncContext` needs to be updated to look in BIN as well.
        // I will do that in a follow up step or assume it for now.
        // Actually, I can't assume. I must fix `SyncContext` later.

        setTimeout(() => {
            setIsDeleting(false);
        }, 100)
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
        // navigate.push(`/note/${newNote.id}?mode=${type}`);
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Your Notebooks ({notes.length})</h1>
                <BinButton animate={isDeleting} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div onClick={() => setShowNewModal(true)} className="cursor-pointer flex items-center justify-center rounded-xl border p-4 shadow hover:shadow-md transition">
                    <span className="text-royal-blue">
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
                                        className="text-sm text-royal-blue flex flex-col items-center justify-center cursor-pointer hover:underline opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingId(note.id);
                                            setEditedTitle(note.title);
                                        }}
                                    >
                                        <FiEdit2 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        className="text-sm text-red-500 flex flex-col items-center justify-center cursor-pointer hover:underline opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(note.id);
                                        }}
                                    >
                                        <FiTrash2 size={16} />
                                        Delete
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
