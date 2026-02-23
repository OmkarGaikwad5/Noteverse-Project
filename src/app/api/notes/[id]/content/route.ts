import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotebookContent from '@/models/NotebookContent';
import CanvasContent from '@/models/CanvasContent';
import Note from '@/models/Note';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/* ============================= */
/* QUILL DELTA → PAGES CONVERTER */
/* ============================= */
function quillToPages(delta: any): any[] {
    if (!delta || !delta.ops) return [];

    try {
        if (Array.isArray(delta)) return delta;

        let text = '';

        delta.ops.forEach((op: any) => {
            if (typeof op.insert === 'string') text += op.insert;
        });

        const lines = text.split('\n');

        const createPage = (line: string) => ({
            lines: [line || ''],
            format: [{
                bold: false,
                italic: false,
                underline: false,
                strikethrough: false,
                fontSize: 16,
                fontFamily: 'Inter, sans-serif',
                color: '#000000',
                highlight: '#ffffff',
                align: 'left',
                listType: 'none',
                headingLevel: 0
            }],
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        const pages = lines.filter(l => l.trim() !== '').map(createPage);

        if (pages.length === 0) pages.push(createPage(''));

        return pages;

    } catch (err) {
        console.error("Quill conversion failed:", err);
        return [];
    }
}


/* ============================= */
/* POST: SYNC NOTE CONTENT       */
/* ============================= */
export async function POST(
    req: Request,
    context: { params: { id: string } }   // ✅ FIXED (NOT Promise)
) {
    await dbConnect();

    const id = context.params.id;   // ✅ DO NOT AWAIT

    try {
        const body = await req.json();
        const { type, data, updatedAt } = body;

        if (!id || !type || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        /* ===== AUTH ===== */
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        /* ===== NOTE ACCESS ===== */
        const note = await Note.findById(id);
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

        const isOwner = String(note.userId) === String(dbUser._id);

        const collaborator = (note.sharedWith || []).find(
            (s: any) => String(s.userId) === String(dbUser._id)
        );

        const hasEditPermission =
            isOwner || (collaborator && collaborator.permission === 'edit');

        if (!hasEditPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const clientUpdatedAt = new Date(updatedAt || Date.now());

        /* ================= NOTEBOOK ================= */
        if (type === "notebook") {

            const existing = await NotebookContent.findOne({ noteId: id });

            if (existing && new Date(existing.updatedAt) > clientUpdatedAt) {
                return NextResponse.json({ status: "ignored", reason: "stale" });
            }

            const pages = quillToPages(data);

            await NotebookContent.findOneAndUpdate(
                { noteId: id },
                { pages, updatedAt: clientUpdatedAt },
                { upsert: true, new: true }
            );
        }

        /* ================= CANVAS ================= */
        else if (type === "canvas") {

            const existing = await CanvasContent.findOne({ noteId: id });

            if (existing && new Date(existing.updatedAt) > clientUpdatedAt) {
                return NextResponse.json({ status: "ignored", reason: "stale" });
            }

            await CanvasContent.findOneAndUpdate(
                { noteId: id },
                { data, updatedAt: clientUpdatedAt },
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ status: "synced" });

    } catch (error) {
        console.error("Content Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
