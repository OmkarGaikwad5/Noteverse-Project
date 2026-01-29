
'use client';
import React, { useState, useEffect } from 'react';
import type { PageContent } from './CanvasPage';
import dynamic from 'next/dynamic';

const CanvasPage = dynamic(() => import('./CanvasPage'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading Canvas...</div>
});
import { Button } from '@/components/custom/button';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { NotebookSyncProvider, useNotebookSync } from '@/context/NotebookSyncContext';

interface NotebookViewerProps {
    notebookId: string;
    userId: string;
}

function NotebookViewerContent({ notebookId, userId }: NotebookViewerProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageData, setPageData] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const { registerPageChange, isSyncing } = useNotebookSync();

    // Fetch Page Data
    useEffect(() => {
        setLoading(true);
        const fetchPage = async () => {
            try {
                const res = await fetch(`/api/v2/pages?notebookId=${notebookId}&pageIndex=${pageIndex}`);
                if (res.ok) {
                    const data = await res.json();
                    setPageData(data.page?.layers || null);
                } else {
                    setPageData(null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [notebookId, pageIndex]);

    const handleAddPage = async () => {
        setPageIndex(prev => prev + 1);
        setPageData(null);
    };

    const handleSave = (data: PageContent) => {
        registerPageChange(notebookId, pageIndex, data);
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-50/50 relative overflow-hidden">
            {/* Top Bar - Glassmorphism */}
            <div className="h-14 absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-lg tracking-tight">Notebook</span>
                    {isSyncing && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Syncing
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
                        <Button
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(p => p - 1)}
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm"
                        >
                            <FaChevronLeft className="w-3 h-3 text-gray-600" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600 px-3 select-none">Page {pageIndex + 1}</span>
                        <Button
                            onClick={() => setPageIndex(p => p + 1)}
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm"
                        >
                            <FaChevronRight className="w-3 h-3 text-gray-600" />
                        </Button>
                    </div>
                    <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
                    <Button onClick={handleAddPage} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 gap-2">
                        <FaPlus className="w-3 h-3" /> Add Page
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative flex justify-center pt-15 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-100">
                {/* The "Paper" Container */}
                <div className="bg-white shadow-md rounded-sm duration-300" style={{ flex: '0 0 auto', width: 'auto', height: 'auto' }}>
                    {!loading ? (
                        <CanvasPage
                            key={`${notebookId}-${pageIndex}`}
                            pageId={`${notebookId}-${pageIndex}`}
                            initialData={pageData || undefined}
                            onSave={handleSave}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full w-[800px] bg-white rounded-sm shadow-sm animate-pulse">
                            <div className="text-gray-400 font-medium">Loading Page...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default function NotebookViewer(props: NotebookViewerProps) {
    if (!props.userId) return <div className="p-8">Please log in to view this notebook.</div>;

    return (
        <NotebookSyncProvider userId={props.userId}>
            <NotebookViewerContent {...props} />
        </NotebookSyncProvider>
    );
}
