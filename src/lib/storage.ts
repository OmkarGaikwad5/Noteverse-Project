
// Wrapper for localStorage to handle metadata automatically
export const LOCAL_STORAGE_KEYS = {
    NOTES: 'noteverse-notes',
    BIN: 'noteverse-bin',
    USER_ID: 'noteverse-user-id',
    SYNCED_AT: 'noteverse-synced-at' // Last successful sync timestamp
};

export interface LocalNote {
    id: string; // We map this to _id in Mongo
    title: string;
    type: 'canvas' | 'notebook';
    createdAt: string;
    updatedAt: string; // ISO String
    isDeleted?: boolean;
}

export const storage = {
    getUserId: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    },

    setUserId: (id: string) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, id);
    },

    getNotes: (): LocalNote[] => {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES);
        return raw ? JSON.parse(raw) : [];
    },

    saveNotes: (notes: LocalNote[]) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify(notes));
    },

    getLastSync: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(LOCAL_STORAGE_KEYS.SYNCED_AT);
    },

    setLastSync: (isoString: string) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LOCAL_STORAGE_KEYS.SYNCED_AT, isoString);
    },

    // Generic content getter
    getContent: (noteId: string, type: 'canvas' | 'notebook') => {
        if (typeof window === 'undefined') return null;
        const key = type === 'notebook' ? `notebookLines-${noteId}` : `canvasNotes-${noteId}`;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
};
