'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/custom/button';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';

interface LegacyNotesMigrationProps {
    onMigrationComplete?: () => void;
}

export default function LegacyNotesMigration({ onMigrationComplete }: LegacyNotesMigrationProps) {
    const [migrating, setMigrating] = useState(false);
    const [hasLegacyNotes, setHasLegacyNotes] = useState(false);
    const [legacyCount, setLegacyCount] = useState(0);
    const [migratedCount, setMigratedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [checking, setChecking] = useState(true);
    const toast = useToast();
    const { data: session } = useSession();

    // Check for legacy notes on component mount
    const checkForLegacyNotes = async () => {
        setChecking(true);
        try {
            const foundNotes: { key: string; hasContent: boolean; title?: string; type: string }[] = [];
            const keys = Object.keys(localStorage);
            
            // Find all notebook keys (legacy notes)
            const notebookKeys = keys.filter(k => 
                k.startsWith('notebook-advanced-') && 
                !k.includes('page-content') &&
                k !== 'notebook-advanced-undefined'
            );
            
            // Find all canvas keys
            const canvasKeys = keys.filter(k => 
                k.startsWith('canvas-') && 
                k !== 'canvas-undefined' &&
                !k.includes('page-content')
            );
            
            // Process notebook keys
            for (const key of notebookKeys) {
                const rawData = localStorage.getItem(key);
                let hasContent = false;
                let title = '';
                
                if (rawData) {
                    try {
                        const parsedData = JSON.parse(rawData);
                        
                        // Try to extract original title
                        if (parsedData.title) {
                            title = parsedData.title;
                        } else if (parsedData[0]?.title) {
                            title = parsedData[0].title;
                        } else {
                            // Extract from key if no title found
                            const id = key.replace('notebook-advanced-', '');
                            title = `Notebook ${new Date(parseInt(id) || Date.now()).toLocaleDateString()}`;
                        }
                        
                        // Check if has actual content
                        if (Array.isArray(parsedData)) {
                            hasContent = parsedData.some(page => page.lines?.some((line: string) => line.trim()));
                        } else if (parsedData.lines) {
                            hasContent = parsedData.lines.some((line: string) => line.trim());
                        } else if (parsedData.pages) {
                            hasContent = parsedData.pages.some((page: any) => page.lines?.some((line: string) => line.trim()));
                        }
                    } catch (e) {
                        console.error("Failed to parse", e);
                    }
                }
                
                if (hasContent) {
                    foundNotes.push({ key, hasContent: true, title: title || 'Legacy Notebook', type: 'note' });
                }
            }
            
            // Process canvas keys
            for (const key of canvasKeys) {
                const rawData = localStorage.getItem(key);
                let hasContent = false;
                let title = '';
                
                if (rawData) {
                    try {
                        const parsedData = JSON.parse(rawData);
                        
                        // Try to extract original title
                        if (parsedData.title) {
                            title = parsedData.title;
                        } else {
                            // Extract from key if no title found
                            const id = key.replace('canvas-', '');
                            title = `Canvas ${new Date(parseInt(id) || Date.now()).toLocaleDateString()}`;
                        }
                        
                        // Check if has actual drawing content
                        hasContent = (parsedData.lines && parsedData.lines[0]?.length > 0) ||
                                   (parsedData.textBoxes && parsedData.textBoxes[0]?.length > 0) ||
                                   (parsedData.shapes && parsedData.shapes[0]?.length > 0);
                    } catch (e) {
                        console.error("Failed to parse", e);
                    }
                }
                
                if (hasContent) {
                    foundNotes.push({ key, hasContent: true, title: title || 'Legacy Canvas', type: 'canvas' });
                }
            }
            
            if (foundNotes.length > 0) {
                setHasLegacyNotes(true);
                setLegacyCount(foundNotes.length);
            } else {
                setHasLegacyNotes(false);
                setLegacyCount(0);
            }
        } catch (error) {
            console.error("Error checking legacy notes:", error);
            setHasLegacyNotes(false);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        checkForLegacyNotes();
    }, []);

    const extractNotebookContent = (notebookData: any): string => {
        if (!notebookData) return '';
        
        let lines: string[] = [];
        
        if (Array.isArray(notebookData)) {
            for (const page of notebookData) {
                if (page.lines && Array.isArray(page.lines)) {
                    lines.push(...page.lines);
                }
            }
        } else if (notebookData.lines && Array.isArray(notebookData.lines)) {
            lines = notebookData.lines;
        } else if (notebookData.pages && Array.isArray(notebookData.pages)) {
            for (const page of notebookData.pages) {
                if (page.lines && Array.isArray(page.lines)) {
                    lines.push(...page.lines);
                }
            }
        }
        
        const nonEmptyLines = lines.filter(line => line && line.trim());
        return nonEmptyLines.length > 0 ? nonEmptyLines.join('\n') : '';
    };

    const extractCanvasContent = (canvasData: any): any | null => {
        if (!canvasData) return null;
        
        const hasContent = (canvasData.lines && canvasData.lines[0]?.length > 0) ||
                          (canvasData.textBoxes && canvasData.textBoxes[0]?.length > 0) ||
                          (canvasData.shapes && canvasData.shapes[0]?.length > 0);
        
        return hasContent ? canvasData : null;
    };

    const handleMigrate = async () => {
        if (!session?.user?.id) {
            toast.error({ 
                title: "Authentication required", 
                description: "Please login to migrate notes." 
            });
            return;
        }

        if (!confirm(`This will import ${legacyCount} legacy note(s) to your Library. Continue?`)) return;

        setMigrating(true);
        setMigratedCount(0);
        setFailedCount(0);
        
        let migrationToastId: string | null = null;

        try {
            migrationToastId = toast.loading({ 
                title: "Import started", 
                description: `Importing ${legacyCount} note(s) to Library...` 
            });

            let currentMigrated = 0;
            let currentFailed = 0;

            // Get all keys to migrate
            const keys = Object.keys(localStorage);
            const notebookKeys = keys.filter(k => k.startsWith('notebook-advanced-') && !k.includes('page-content'));
            const canvasKeys = keys.filter(k => k.startsWith('canvas-') && !k.includes('page-content'));
            
            const allLegacyKeys = [...notebookKeys, ...canvasKeys];

            for (const key of allLegacyKeys) {
                try {
                    const isCanvas = key.startsWith('canvas-');
                    const rawData = localStorage.getItem(key);
                    
                    if (!rawData) continue;
                    
                    const parsedData = JSON.parse(rawData);
                    
                    // Check if has content
                    let hasContent = false;
                    let title = '';
                    
                    if (isCanvas) {
                        hasContent = (parsedData.lines && parsedData.lines[0]?.length > 0) ||
                                   (parsedData.textBoxes && parsedData.textBoxes[0]?.length > 0) ||
                                   (parsedData.shapes && parsedData.shapes[0]?.length > 0);
                        title = parsedData.title || `Canvas ${new Date(parseInt(key.replace('canvas-', '')) || Date.now()).toLocaleDateString()}`;
                    } else {
                        if (Array.isArray(parsedData)) {
                            hasContent = parsedData.some(page => page.lines?.some((line: string) => line.trim()));
                        } else if (parsedData.lines) {
                            hasContent = parsedData.lines.some((line: string) => line.trim());
                        } else if (parsedData.pages) {
                            hasContent = parsedData.pages.some((page: any) => page.lines?.some((line: string) => line.trim()));
                        }
                        title = parsedData.title || `Notebook ${new Date(parseInt(key.replace('notebook-advanced-', '')) || Date.now()).toLocaleDateString()}`;
                    }
                    
                    if (!hasContent) continue;
                    
                    // Create NOTEBOOK in database (for Library page)
                    const createResponse = await fetch('/api/v2/notebooks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: session.user.id,
                            title: title, // Keep original title
                            description: `Imported from local storage`,
                            coverColor: isCanvas ? '#6366F1' : '#10B981',
                            type: isCanvas ? 'canvas' : 'note'
                        })
                    });

                    if (!createResponse.ok) throw new Error('Failed to create notebook');
                    
                    const { notebook } = await createResponse.json();

                    // Save content to the notebook
                    if (isCanvas) {
                        const content = extractCanvasContent(parsedData);
                        if (content) {
                            await fetch(`/api/notes/${notebook._id}/content`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'canvas',
                                    data: content,
                                    updatedAt: new Date().toISOString()
                                })
                            });
                        }
                    } else {
                        const content = extractNotebookContent(parsedData);
                        if (content) {
                            await fetch(`/api/notes/${notebook._id}/content`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'notebook',
                                    data: {
                                        ops: [{ insert: content }]
                                    },
                                    updatedAt: new Date().toISOString()
                                })
                            });
                        }
                    }

                    // Remove legacy item after successful import
                    localStorage.removeItem(key);
                    currentMigrated++;
                    setMigratedCount(currentMigrated);
                    
                    if (migrationToastId) {
                        toast.update(migrationToastId, "loading", { 
                            title: "Import in progress", 
                            description: `Imported ${currentMigrated} of ${legacyCount} notebook(s)...` 
                        });
                    }
                } catch (err) {
                    console.error(`Failed to import:`, err);
                    currentFailed++;
                    setFailedCount(currentFailed);
                }
            }

            if (migrationToastId) {
                if (currentFailed === 0) {
                    toast.update(migrationToastId, "success", { 
                        title: "Import complete", 
                        description: `Successfully imported ${currentMigrated} notebook(s) to your Library.` 
                    });
                } else {
                    toast.update(migrationToastId, "error", { 
                        title: "Partial import", 
                        description: `Imported ${currentMigrated} notebook(s), ${currentFailed} failed.` 
                    });
                }
            }

            // Hide the import button after migration
            setHasLegacyNotes(false);
            
            // Refresh the library to show imported notebooks
            if (onMigrationComplete) {
                onMigrationComplete();
            }
            
            window.dispatchEvent(new CustomEvent('noteverse-refresh'));

        } catch (e) {
            console.error("Import error:", e);
            if (migrationToastId) {
                toast.update(migrationToastId, "error", { 
                    title: "Import failed", 
                    description: "Please try again." 
                });
            } else {
                toast.error({ title: "Import failed", description: "Please try again." });
            }
        } finally {
            setMigrating(false);
        }
    };

    if (checking) {
        return null;
    }

    if (!hasLegacyNotes) {
        return null;
    }

    return (
        <div className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="font-semibold text-yellow-800 text-lg">Legacy Notes Detected</h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                        We found <span className="font-bold">{legacyCount}</span> legacy note(s) stored locally.
                    </p>
                    <div className="mt-2 text-xs text-yellow-600">
                        <span className="font-medium">Note:</span> Click import to add these notebooks to your Library.
                    </div>
                </div>
                <Button 
                    onClick={handleMigrate} 
                    disabled={migrating} 
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
                >
                    {migrating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Importing ({migratedCount}/{legacyCount})...
                        </>
                    ) : (
                        `Import ${legacyCount} Legacy Note(s)`
                    )}
                </Button>
            </div>
        </div>
    );
}