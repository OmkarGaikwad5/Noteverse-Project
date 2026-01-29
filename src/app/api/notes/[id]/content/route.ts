
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotebookContent from '@/models/NotebookContent';
import CanvasContent from '@/models/CanvasContent';
import Note from '@/models/Note';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params; // Note ID (String)

    try {
        const body = await req.json();
        const { type, data, updatedAt, userId } = body;

        if (!id || !type || !data || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify ownership
        const note = await Note.findOne({ _id: id, userId });
        if (!note) {
            return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
        }

        const clientUpdatedAt = new Date(updatedAt);

        // Save Content based on type
        if (type === 'notebook') {
            // Upsert Notebook Content
            // Check staleness
            const existing = await NotebookContent.findOne({ noteId: id });
            if (existing && new Date(existing.updatedAt) > clientUpdatedAt) {
                return NextResponse.json({ status: 'ignored', reason: 'stale' });
            }

            await NotebookContent.findOneAndUpdate(
                { noteId: id },
                {
                    pages: data.pages || data, // Handle format mismatch if any
                    updatedAt: clientUpdatedAt
                },
                { upsert: true }
            );
        } else if (type === 'canvas') {
            const existing = await CanvasContent.findOne({ noteId: id });
            if (existing && new Date(existing.updatedAt) > clientUpdatedAt) {
                return NextResponse.json({ status: 'ignored', reason: 'stale' });
            }

            await CanvasContent.findOneAndUpdate(
                { noteId: id },
                {
                    data: data, // assumes strict shape match
                    updatedAt: clientUpdatedAt
                },
                { upsert: true }
            );
        }

        return NextResponse.json({ status: 'synced' });

    } catch (error) {
        console.error('Content Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
