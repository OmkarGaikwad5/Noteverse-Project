
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
import { useToast } from '@/hooks/useToast';

interface NotebookViewerProps {
    notebookId: string;
}

function NotebookViewerContent({ notebookId }: NotebookViewerProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageData, setPageData] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const { registerPageChange, isSyncing } = useNotebookSync();
    const toast = useToast();

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
                toast.error({ title: "Page load failed", description: "Could not fetch page data." });
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [notebookId, pageIndex, toast]);

    const handleAddPage = async () => {
        setPageIndex(prev => prev + 1);
        setPageData(null);
        toast.success({ title: "New page added", description: `Switched to page ${pageIndex + 2}.` });
    };

    const handleSave = (data: PageContent) => {
        registerPageChange(notebookId, pageIndex, data);
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background relative overflow-hidden">
            {/* Top Bar - Glassmorphism */}
            <div className="h-14 absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 bg-surface/80 backdrop-blur-xl border-b border-border/20 shadow-sm">
                <div className="font-semibold text-ink-primary flex items-center gap-2">
                    <span className="text-lg tracking-tight">Notebook</span>
                    {isSyncing && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Syncing
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-background p-1 rounded-lg border border-border">
                        <Button
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(p => p - 1)}
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-md hover:bg-surface hover:shadow-sm"
                        >
                            <FaChevronLeft className="w-3 h-3 text-ink-secondary" />
                        </Button>
                        <span className="text-sm font-medium text-ink-primary px-3 select-none">Page {pageIndex + 1}</span>
                        <Button
                            onClick={() => setPageIndex(p => p + 1)}
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-md hover:bg-surface hover:shadow-sm"
                        >
                            <FaChevronRight className="w-3 h-3 text-ink-secondary" />
                        </Button>
                    </div>
                    <div className="h-4 w-[1px] bg-border mx-1"></div>
                    <Button onClick={handleAddPage} size="sm" className="bg-primary hover:bg-primary-hover text-black shadow-md hover:shadow-lg transition-all active:scale-95 gap-2">
                        <FaPlus className="w-3 h-3" /> Add Page
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative flex justify-center pt-15 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] opacity-100">
                {/* The "Paper" Container */}
                <div className="bg-surface shadow-md rounded-sm duration-300" style={{ flex: '0 0 auto', width: 'auto', height: 'auto' }}>
                    {!loading ? (
                        <CanvasPage
                            key={`${notebookId}-${pageIndex}`}
                            pageId={`${notebookId}-${pageIndex}`}
                            initialData={pageData || undefined}
                            onSave={handleSave}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full w-[800px] bg-surface rounded-sm shadow-sm animate-pulse">
                            <div className="text-ink-muted font-medium">Loading Page...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useSession } from "next-auth/react";

export default function NotebookViewer(props: Omit<NotebookViewerProps, "userId">) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="p-8">Loading...</div>;
    }

    if (!session?.user) {
        return <div className="p-8">Please log in to view this notebook.</div>;
    }

    type SessionUser = { id?: string; email?: string } | undefined;
    const userObj = session.user as SessionUser;
    const userId: string = userObj?.id ?? userObj?.email ?? '';

    return (
        <NotebookSyncProvider userId={userId}>
            <NotebookViewerContent notebookId={props.notebookId} />
        </NotebookSyncProvider>
    );
}

