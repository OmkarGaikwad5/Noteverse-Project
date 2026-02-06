
import { useState, useEffect, useRef } from 'react';
import { useSync } from '@/context/SyncContext';

export function usePersistentState<T>(key: string, initialValue: T, noteId?: string) {
    const { registerChange } = useSync();

    

    // Lazy initialization from localStorage
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        try {
            localStorage.setItem(key, JSON.stringify(state));

            // Register change for sync
            if (noteId) {
                registerChange(noteId);
            } else if (key === 'noteverse-notes') {
                // For global notes list, we might want to trigger sync for "metadata"
                // But registerChange expects a noteId. 
                // We might need a special logic for list updates OR just relying on the fact that 
                // list updates usually come with a specific note change.
                // However, deleting a note or adding a note DOES change the list.
                // We can support a "global" flag or pass a dummy ID for list sync if needed,
                // But typically SyncContext `dirtyNotes` tracks individual note content.
                // Metadata sync assumes we sync ALL notes in `dirtyNotes`.
                // Actually, `processQueue` sends `dirtyNoteMetas`. So we need to mark ID as dirty.
                // If I add a new note, I should mark its ID as dirty.
            }
        } catch (error) {
            console.error(error);
        }
    }, [key, state, noteId, registerChange]);

    return [state, setState] as const;
}
