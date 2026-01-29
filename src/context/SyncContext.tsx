
'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { storage } from '@/lib/storage';

interface SyncContextType {
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    registerChange: (noteId: string) => void;
    forceSync: () => Promise<void>;
    userId: string | null;
}

const SyncContext = createContext<SyncContextType>({
    isSyncing: false,
    lastSyncedAt: null,
    registerChange: () => { },
    forceSync: async () => { },
    userId: null
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    // Dirty set: IDs of notes that need syncing
    const dirtyNotesRef = useRef<Set<string>>(new Set());
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Define pullUpdates (Wrapped in useCallback)
    const pullUpdates = useCallback(async (uid: string) => {
        try {
            const since = storage.getLastSync() || new Date(0).toISOString();
            const res = await fetch(`/api/sync/state?userId=${uid}&since=${since}`);
            if (res.ok) {
                const data = await res.json();
                if (data.notes && data.notes.length > 0) {
                    // In a real app, merging logic happens here.
                    // For now, we assume local-first write-wins for conflicts or just logging.
                    console.log('Received updates from server', data.notes.length);
                }
                storage.setLastSync(new Date().toISOString());
                setLastSyncedAt(new Date());
            }
        } catch (e) {
            console.error("Pull sync failed", e);
        }
    }, [setLastSyncedAt]);

    // 2. Define processQueue
    const processQueue = useCallback(async () => {
        const currentUserId = userId || storage.getUserId();
        if (!currentUserId || dirtyNotesRef.current.size === 0 || isSyncing) return;

        setIsSyncing(true);
        const ids = Array.from(dirtyNotesRef.current);
        dirtyNotesRef.current.clear(); // Optimistic clear

        try {
            // A. Sync Metadata (Notes List)
            const allNotes = storage.getNotes();
            const dirtyNoteMetas = allNotes.filter(n => ids.includes(n.id));

            if (dirtyNoteMetas.length > 0) {
                await fetch('/api/sync/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId, notes: dirtyNoteMetas })
                });
            }

            // B. Sync Content for each dirty note
            await Promise.all(ids.map(async (id) => {
                const note = allNotes.find(n => n.id === id);
                if (!note) return; // Deleted?

                const content = storage.getContent(id, note.type);
                if (!content) return;

                await fetch(`/api/notes/${id}/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUserId,
                        type: note.type,
                        data: content,
                        updatedAt: note.updatedAt
                    })
                });
            }));

            storage.setLastSync(new Date().toISOString());
            setLastSyncedAt(new Date());

        } catch (e) {
            console.error("Sync failed, putting back into queue", e);
            // Re-add ids to queue
            ids.forEach(id => dirtyNotesRef.current.add(id));
        } finally {
            setIsSyncing(false);
        }
    }, [userId, isSyncing, setIsSyncing, setLastSyncedAt]);

    // 3. Define registerChange
    const registerChange = useCallback((noteId: string) => {
        dirtyNotesRef.current.add(noteId);

        // Debounce sync
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            // We can't call processQueue directly if we want to be safe with deps, 
            // but via Ref it's okay or just trusting the closure if `processQueue` is stable-ish.
            // Actually, `processQueue` depends on `userId`. 
            // If `userId` changes, `processQueue` changes.
            // But `setTimeout` captures the *current* `processQueue` closure? No. 
            // To trigger it, we should use a ref or just let it execute.
            // Ideally we just call the function.
            processQueue();
        }, 3000);
    }, [processQueue]);

    // 4. Initialize User & Initial Pull
    useEffect(() => {
        const init = async () => {
            let uid = storage.getUserId();

            // 1. Try to get authenticated user
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user?.id) {
                        uid = data.user.id;
                        storage.setUserId(uid!);
                    }
                }
            } catch (e) {
                console.error('Auth check failed', e);
            }

            // 2. If valid UID not found, try guest
            if (!uid) {
                try {
                    const res = await fetch('/api/auth/guest', { method: 'POST' });
                    const data = await res.json();
                    if (data.userId) {
                        uid = data.userId;
                        storage.setUserId(uid!);
                    }
                } catch (e) {
                    console.error('Failed to init guest user', e);
                }
            }
            setUserId(uid);

            const lastSyncParams = storage.getLastSync();
            if (lastSyncParams) setLastSyncedAt(new Date(lastSyncParams));

            if (uid) pullUpdates(uid);
        };
        init();
    }, [pullUpdates, setUserId, setLastSyncedAt]);

    // 5. Setup Intervals & Listeners
    useEffect(() => {
        const interval = setInterval(() => {
            if (dirtyNotesRef.current.size > 0) processQueue();
        }, 30000);

        const handleBlur = () => {
            if (dirtyNotesRef.current.size > 0) processQueue();
        };
        window.addEventListener('blur', handleBlur);

        return () => {
            clearInterval(interval);
            window.removeEventListener('blur', handleBlur);
        };
    }, [processQueue]);

    const forceSync = async () => {
        await processQueue();
        if (userId) await pullUpdates(userId);
    };

    return (
        <SyncContext.Provider value={{ isSyncing, lastSyncedAt, registerChange, forceSync, userId }}>
            {children}
        </SyncContext.Provider>
    );
};
