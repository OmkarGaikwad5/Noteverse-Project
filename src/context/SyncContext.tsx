'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from './AuthContext';

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
    registerChange: () => {},
    forceSync: async () => {},
    userId: null
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const { user, loading } = useAuth();   // 🔥 SINGLE SOURCE OF TRUTH
    const userId = user?.id ?? null;

    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    const dirtyNotesRef = useRef<Set<string>>(new Set());
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /* ------------------ PULL FROM SERVER ------------------ */
    const pullUpdates = useCallback(async () => {
        if (!userId) return;

        try {
            const since = storage.getLastSync() || new Date(0).toISOString();
            const res = await fetch(`/api/sync/state?userId=${userId}&since=${since}`);

            if (!res.ok) return;

            const data = await res.json();
            if (data.notes?.length) {
                console.log('Received updates', data.notes.length);
            }

            storage.setLastSync(new Date().toISOString());
            setLastSyncedAt(new Date());

        } catch (e) {
            console.error("Pull sync failed", e);
        }
    }, [userId]);

    /* ------------------ PUSH TO SERVER ------------------ */
    const processQueue = useCallback(async () => {

        if (!userId || dirtyNotesRef.current.size === 0 || isSyncing) return;

        setIsSyncing(true);
        const ids = Array.from(dirtyNotesRef.current);
        dirtyNotesRef.current.clear();

        try {

            const allNotes = storage.getNotes();
            const dirtyMetas = allNotes.filter(n => ids.includes(n.id));

            if (dirtyMetas.length) {
                await fetch('/api/sync/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, notes: dirtyMetas })
                });
            }

            await Promise.all(ids.map(async (id) => {
                const note = allNotes.find(n => n.id === id);
                if (!note) return;

                const content = storage.getContent(id, note.type);
                if (!content) return;

                await fetch(`/api/notes/${id}/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        type: note.type,
                        data: content,
                        updatedAt: note.updatedAt
                    })
                });
            }));

            storage.setLastSync(new Date().toISOString());
            setLastSyncedAt(new Date());

        } catch (e) {
            console.error("Sync failed, restoring queue", e);
            ids.forEach(id => dirtyNotesRef.current.add(id));
        } finally {
            setIsSyncing(false);
        }

    }, [userId, isSyncing]);

    /* ------------------ REGISTER CHANGE ------------------ */
    const registerChange = useCallback((noteId: string) => {

        if (!userId) return; // 🔥 NO USER → NO SYNC

        dirtyNotesRef.current.add(noteId);

        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(() => {
            processQueue();
        }, 2000);

    }, [processQueue, userId]);

    /* ------------------ INITIAL SYNC ------------------ */
    useEffect(() => {
        if (loading) return;
        if (!userId) return;

        const last = storage.getLastSync();
        if (last) setLastSyncedAt(new Date(last));

        pullUpdates();
    }, [userId, loading, pullUpdates]);

    /* ------------------ BACKGROUND SYNC ------------------ */
    useEffect(() => {

        if (!userId) return;

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

    }, [processQueue, userId]);

    const forceSync = async () => {
        await processQueue();
        await pullUpdates();
    };

    return (
        <SyncContext.Provider value={{ isSyncing, lastSyncedAt, registerChange, forceSync, userId }}>
            {children}
        </SyncContext.Provider>
    );
};
