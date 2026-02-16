
import React from 'react';
import NotebookViewer from '@/components/PageCanvas/NotebookViewer';
import NoteViewer from '@/components/Notebook';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';

export default async function Page({ params }: { params: Promise<{ notebookId: string }> }) {
    const { notebookId } = await params;

    // Get User ID from Token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let userId = '';

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId?: string } | string;
            const decodedUserId = typeof decoded === 'object' && decoded && 'userId' in decoded ? decoded.userId : undefined;
            if (decodedUserId) userId = decodedUserId;
        } catch (e) {
            console.error("Token verification failed", e);
        }
    }

    await dbConnect();
    const notebook = await Notebook.findById(notebookId).lean();

    if (!notebook) {
        return <div className="p-8 text-red-500">Notebook not found</div>;
    }

    if (notebook.type === 'note') {
        return <NoteViewer noteId={notebookId} />;
    }

    // Default to 'canvas' — NotebookViewer derives user from session on client
    return <NotebookViewer notebookId={notebookId} />;
}
