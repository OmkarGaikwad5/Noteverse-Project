
'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

interface NotebookSyncContextType {
    isSyncing: boolean;
    registerPageChange: (notebookId: string, pageIndex: number, content: any) => void;
}

const NotebookSyncContext = createContext<NotebookSyncContextType>({
    isSyncing: false,
    registerPageChange: () => { }
});

export const useNotebookSync = () => useContext(NotebookSyncContext);

export const NotebookSyncProvider: React.FC<{ children: React.ReactNode, userId: string }> = ({ children, userId }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    // Map of "notebookId-pageIndex" -> content
    const dirtyPagesRef = useRef<Map<string, { notebookId: string, pageIndex: number, content: any }>>(new Map());
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const processQueue = useCallback(async () => {
        if (dirtyPagesRef.current.size === 0 || isSyncing) return;

        setIsSyncing(true);
        const pagesToSync = Array.from(dirtyPagesRef.current.values());
        dirtyPagesRef.current.clear();

        try {
            await Promise.all(pagesToSync.map(async (page) => {
                try {
                    await fetch('/api/v2/pages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId,
                            notebookId: page.notebookId,
                            pageIndex: page.pageIndex,
                            layers: page.content
                        })
                    });
                } catch (err) {
                    console.error(`Failed to sync page ${page.pageIndex}`, err);
                    // Re-queue? simpler to just let next edit trigger it for now, 
                    // or ideally re-add to map if not present.
                }
            }));
        } catch (e) {
            console.error("Sync batch failed", e);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, userId]);

    const registerPageChange = useCallback((notebookId: string, pageIndex: number, content: any) => {
        const key = `${notebookId}-${pageIndex}`;
        dirtyPagesRef.current.set(key, { notebookId, pageIndex, content });

        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            processQueue();
        }, 3000); // 3-second debounce
    }, [processQueue]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, []);

    return (
        <NotebookSyncContext.Provider value={{ isSyncing, registerPageChange }}>
            {children}
        </NotebookSyncContext.Provider>
    );
};
