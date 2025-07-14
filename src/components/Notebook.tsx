'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function Notebook() {
    const [pageIndex, setPageIndex] = useState(0);
    const [pages, setPages] = useState<string[][]>([[]]);
    const [mode, setMode] = useState<'line' | 'full'>('line');
    const lineInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('notebookLines');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPages(parsed);
            } catch (e) {
                console.error("Failed to load notebook from local storage", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('notebookLines', JSON.stringify(pages));
    }, [pages]);

    const handleLineChange = (lineIndex: number, text: string) => {
        const updated = [...pages];
        updated[pageIndex][lineIndex] = text;
        setPages(updated);
    };

    const handleFullTextChange = (text: string) => {
        const lines = text.split('\n');
        const updated = [...pages];
        updated[pageIndex] = lines;
        setPages(updated);
    };

    const addLine = () => {
        const updated = [...pages];
        updated[pageIndex] = [...(updated[pageIndex] || []), ''];
        setPages(updated);

        setTimeout(() => {
            const lastRef = lineInputRefs.current[updated[pageIndex].length - 1];
            if (lastRef) lastRef.focus();
        }, 100);
    };

    const ensurePage = useCallback(() => {
        if (!pages[pageIndex]) {
            const updated = [...pages];
            updated[pageIndex] = [];
            setPages(updated);
        }
    }, [pages, pageIndex]);

    useEffect(() => {
        ensurePage();
    }, [pageIndex, ensurePage]);

    const fullText = (pages[pageIndex] || []).join('\n');

    const addPage = () => {
        setPages([...pages, []]);
        setPageIndex(pages.length);
    };

    const prevPage = () => {
        if (pageIndex > 0) setPageIndex(pageIndex - 1);
    };

    const nextPage = () => {
        if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto text-foreground">
            {/* Header and Mode Switch */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold tracking-tight text-royal-blue dark:text-royal-blue">
                    Notebook
                </h2>
                <div
                    role="group"
                    className="inline-flex border border-border rounded-md overflow-hidden shadow-sm"
                >
                    <button
                        type="button"
                        onClick={() => setMode('line')}
                        className={`px-4 py-1 text-sm font-semibold transition ${mode === 'line'
                                ? 'bg-royal-blue text-white'
                                : 'bg-card text-foreground hover:bg-muted'
                            }`}
                    >
                        Line Mode
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('full')}
                        className={`px-4 py-1 text-sm font-semibold transition ${mode === 'full'
                                ? 'bg-royal-blue text-white'
                                : 'bg-card text-foreground hover:bg-muted'
                            }`}
                    >
                        Full Page
                    </button>
                </div>
            </div>

            {/* Page Controls */}
            <div className="mb-5 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                    Page {pageIndex + 1} of {pages.length}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={prevPage}
                        disabled={pageIndex === 0}
                        className="px-3 py-1 text-sm rounded bg-muted text-foreground hover:bg-muted-foreground/10 disabled:opacity-50 transition"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={nextPage}
                        disabled={pageIndex === pages.length - 1}
                        className="px-3 py-1 text-sm rounded bg-muted text-foreground hover:bg-muted-foreground/10 disabled:opacity-50 transition"
                    >
                        Next →
                    </button>
                    <button
                        onClick={addPage}
                        className="px-3 py-1 text-sm bg-royal-blue text-white rounded hover:bg-royal-blue/90 transition font-medium"
                    >
                        + Add Page
                    </button>
                </div>
            </div>

            {/* Notebook Body */}
            {mode === 'line' ? (
                <>
                    {pages[pageIndex]?.length > 0 ? (
                        <div className="space-y-3">
                            {pages[pageIndex].map((line, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start border-b border-border py-1"
                                >
                                    <div className="w-10 text-right pr-2 text-sm text-muted-foreground pt-2">
                                        {idx + 1}
                                    </div>
                                    <textarea
                                        ref={(el) => { lineInputRefs.current[idx] = el }}
                                        value={line}
                                        onChange={(e) => handleLineChange(idx, e.target.value)}
                                        rows={1}
                                        className="flex-1 resize-none border-none outline-none bg-transparent py-2 text-sm text-foreground"
                                        placeholder="Type here..."
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-12">
                            This page is empty. Start adding your lines below.
                        </div>
                    )}
                    <button
                        onClick={addLine}
                        className="mt-6 text-royal-blue hover:underline text-sm font-medium"
                    >
                        + Add Line
                    </button>
                </>
            ) : (
                <textarea
                    value={fullText}
                    onChange={(e) => handleFullTextChange(e.target.value)}
                    rows={24}
                    className="w-full border border-border bg-card text-foreground rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-royal-blue"
                    placeholder="Start typing your full-page notes here..."
                />
            )}
        </div>
    );
}
