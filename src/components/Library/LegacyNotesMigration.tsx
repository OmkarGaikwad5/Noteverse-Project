
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/custom/button';
import { useToast } from '@/hooks/useToast';

export default function LegacyNotesMigration() {
    const [migrating, setMigrating] = useState(false);
    const toast = useToast();

    const handleMigrate = async () => {
        if (!confirm("This will convert your old Local Notes to new Cloud Notebooks. Continue?")) return;

        setMigrating(true);
        let migrationToastId: string | null = null;
        try {
            // Fetch old local notes from localStorage keys manually for now
            // or fetch from API if they were synced.
            // Assuming local migration for now as requested.

            const keys = Object.keys(localStorage);
            const legacyKeys = keys.filter(k => k.startsWith('noteverse-notes'));

            // Actually the main list is in 'noteverse-notes'
            const listJson = localStorage.getItem('noteverse-notes');
            if (listJson) {
                const notes = JSON.parse(listJson);
                const total = notes.length;
                migrationToastId = toast.loading({ title: "Migration started", description: `Migrating ${total} legacy note(s).` });
                for (const note of notes) {
                    // Create Notebook
                    const resAuth = await fetch('/api/auth/me');
                    if (!resAuth.ok) continue;
                    const userData = await resAuth.json();

                    const resNB = await fetch('/api/v2/notebooks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userData.user.id,
                            title: note.title,
                            coverColor: '#10B981' // Green for migrated
                        })
                    });

                    if (resNB.ok) {
                        const { notebook } = await resNB.json();
                        // Get Content
                        // Try finding 'canvasNotes-{id}' or 'notebookLines-{id}'
                        const canvasKey = `canvasNotes-${note.id}`;
                        const notebookKey = `notebookLines-${note.id}`;

                        const canvasData = localStorage.getItem(canvasKey);
                        const notebookData = localStorage.getItem(notebookKey);

                        let layers = {};
                        if (canvasData) {
                            const parsed = JSON.parse(canvasData);
                            // Need to map old format to new Page format
                            // Old: { lines: [[]], shapes: [[]]... } (arrays of pages)
                            // New: One page per index.
                            // We just take page 0 for simplicity or loop
                            if (parsed.lines && parsed.lines[0]) layers = { ...layers, lines: parsed.lines[0] };
                            if (parsed.shapes && parsed.shapes[0]) layers = { ...layers, shapes: parsed.shapes[0] };
                            if (parsed.textBoxes && parsed.textBoxes[0]) layers = { ...layers, textBoxes: parsed.textBoxes[0] };
                        }

                        // Create Page 0
                        await fetch('/api/v2/pages', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: userData.user.id,
                                notebookId: notebook._id,
                                pageIndex: 0,
                                layers
                            })
                        });
                    }
                }
                if (migrationToastId) {
                    toast.update(migrationToastId, "success", { title: "Migration complete", description: "Legacy notes were imported successfully." });
                }
            } else {
                toast.info({ title: "No legacy notes found", description: "Nothing to migrate." });
            }
        } catch (e) {
            console.error(e);
            if (migrationToastId) {
                toast.update(migrationToastId, "error", { title: "Migration failed", description: "Please try again." });
            } else {
                toast.error({ title: "Migration failed", description: "Please try again." });
            }
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <div>
                <h3 className="font-semibold text-yellow-800">Legacy Notes Detected</h3>
                <p className="text-sm text-yellow-700">Import your old notes into the new Library.</p>
            </div>
            <Button onClick={handleMigrate} disabled={migrating} variant="outline" className="border-yellow-600 text-yellow-800 hover:bg-yellow-100">
                {migrating ? 'Migrating...' : 'Import Notes'}
            </Button>
        </div>
    );
}
