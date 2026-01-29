'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Button } from '@/components/custom/button';
import { FaChevronLeft, FaChevronRight, FaPlus, FaList, FaFileAlt } from 'react-icons/fa';

export default function Notebook({ noteId }: { noteId: string }) {
    const storageKey = `notebookLines-${noteId}`;
    const [pageIndex, setPageIndex] = useState(0);

    // Using usePersistentState for auto-sync and persistence
    const [pages, setPages] = usePersistentState<string[][]>(storageKey, [['']], noteId);

    const [mode, setMode] = useState<'line' | 'full'>('line');
    const lineInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

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
    }, [pages, pageIndex, setPages]);

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

    useEffect(() => {
        document.title = "Note - Notebook"
    }, []);

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            {/* Glass Container */}
            <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/40 rounded-3xl overflow-hidden ring-1 ring-black/5 transition-all duration-300">

                {/* Header Section */}
                <div className="border-b border-gray-200/50 p-6 bg-white/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100/50 rounded-xl">
                                <FaFileAlt className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Notebook</h2>
                        </div>

                        {/* Mode Switcher */}
                        <div className="bg-gray-100/80 p-1 rounded-xl flex shadow-inner border border-gray-200/50">
                            <button
                                onClick={() => setMode('line')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'line'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                <FaList className="w-3.5 h-3.5" />
                                Line Mode
                            </button>
                            <button
                                onClick={() => setMode('full')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'full'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                <FaFileAlt className="w-3.5 h-3.5" />
                                Full Page
                            </button>
                        </div>
                    </div>

                    {/* Page Controls Toolbar */}
                    <div className="flex items-center justify-between mt-6 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                        <div className="text-sm font-medium text-gray-500 px-2">
                            Page <span className="text-gray-900">{pageIndex + 1}</span> of <span className="text-gray-900">{pages.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost" size="icon"
                                onClick={prevPage} disabled={pageIndex === 0}
                                className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                            >
                                <FaChevronLeft className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                onClick={nextPage} disabled={pageIndex === pages.length - 1}
                                className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                            >
                                <FaChevronRight className="w-3 h-3" />
                            </Button>
                            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                            <Button
                                size="sm" onClick={addPage}
                                className=" bg-blue-600 hover:bg-blue-700 text-black shadow-md hover:shadow-lg transition-all active:scale-95 h-8 px-3 rounded-lg text-xs gap-2"
                            >
                                <FaPlus className="w-3 h-3" /> Add Page
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] p-8 bg-gradient-to-b from-white to-gray-50/30">
                    {mode === 'line' ? (
                        <div className="max-w-3xl mx-auto">
                            {pages[pageIndex]?.length > 0 ? (
                                <div className="space-y-1">
                                    {pages[pageIndex].map((line, idx) => (
                                        <div
                                            key={idx}
                                            className="group flex items-start gap-4 py-1"
                                        >
                                            <div className="w-8 flex-shrink-0 pt-2.5 text-right">
                                                <span className="text-xs font-mono text-gray-300 group-hover:text-blue-400 transition-colors select-none">
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <textarea
                                                    ref={(el) => { lineInputRefs.current[idx] = el }}
                                                    value={line}
                                                    onChange={(e) => handleLineChange(idx, e.target.value)}
                                                    rows={1}
                                                    className="w-full resize-none bg-transparent border-b border-transparent focus:border-blue-200 transition-colors outline-none py-2 text-base text-gray-700 leading-relaxed placeholder:text-gray-300"
                                                    placeholder="Type something..."
                                                    style={{ minHeight: '40px' }}
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = 'auto';
                                                        target.style.height = target.scrollHeight + 'px';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FaList className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">Empty Page</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-6">Start writing your thoughts properly organized.</p>
                                    <Button onClick={addLine} variant="outline" className="gap-2">
                                        <FaPlus className="w-3 h-3" /> Add First Line
                                    </Button>
                                </div>
                            )}

                            {pages[pageIndex]?.length > 0 && (
                                <div className="pl-12 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:opacity-100">
                                    <button
                                        onClick={addLine}
                                        className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        <FaPlus className="w-3 h-3" /> Add Line
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto h-full relative">
                            <div className="absolute inset-y-0 left-0 w-8 border-r border-dashed border-gray-200" />
                            <textarea
                                value={fullText}
                                onChange={(e) => handleFullTextChange(e.target.value)}
                                className="w-full h-full min-h-[500px] pl-12 pr-4 py-2 bg-transparent resize-none outline-none text-base text-gray-700 leading-relaxed placeholder:text-gray-300"
                                placeholder="Start writing your story..."
                                spellCheck={false}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
