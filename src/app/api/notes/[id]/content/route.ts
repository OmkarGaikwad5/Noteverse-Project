
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotebookContent from '@/models/NotebookContent';
import CanvasContent from '@/models/CanvasContent';
import Note from '@/models/Note';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params; // Note ID (String)

    try {
        const body = await req.json();
        const { type, data, updatedAt } = body;

        if (!id || !type || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Authenticate via next-auth session
        const session = await getServerSession(authOptions as any) as Session | null;
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Verify ownership or edit permission for collaborators
        const note = await Note.findOne({ _id: id });
        if (!note) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const isOwner = String(note.userId) === String(dbUser._id);
        const collaborator = (note.sharedWith || []).find((s: any) => String(s.userId) === String(dbUser._id));
        const hasEditPermission = isOwner || (collaborator && collaborator.permission === 'edit');

        if (!hasEditPermission) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
