import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        // Only owner can share
        const session = await getServerSession(authOptions as any) as Session | null;
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { email, permission } = await req.json();
        if (!email || !permission) return NextResponse.json({ error: 'Missing email or permission' }, { status: 400 });

        const note = await Note.findOne({ _id: id });
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

        if (String(note.userId) !== String(dbUser._id)) {
            return NextResponse.json({ error: 'Only owner can share' }, { status: 403 });
        }

        const userToShare = await User.findOne({ email });
        if (!userToShare) return NextResponse.json({ error: 'User to share not found' }, { status: 404 });

        // Avoid duplicates
        const exists = (note.sharedWith || []).some((s: any) => String(s.userId) === String(userToShare._id));
        if (!exists) {
            note.sharedWith = note.sharedWith || [];
            note.sharedWith.push({ userId: userToShare._id, permission, sharedAt: new Date() });
            await note.save();
        } else {
            // update permission
            note.sharedWith = (note.sharedWith || []).map((s: any) => String(s.userId) === String(userToShare._id) ? { ...s.toObject ? s.toObject() : s, permission } : s);
            await note.save();
        }

        await AuditLog.create({ noteId: note._id, action: 'shared', userId: dbUser._id, details: { sharedWith: userToShare._id, permission } });

        return NextResponse.json({ status: 'shared' });

    } catch (e) {
        console.error('Share error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        // Allow owner or shared users to view sharing list
        const session = await getServerSession(authOptions as any) as Session | null;
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const note = await Note.findOne({ _id: id }).populate('sharedWith.userId', 'email name');
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

        const isOwner = String(note.userId) === String(dbUser._id);
        const isShared = (note.sharedWith || []).some((s: any) => String(s.userId) === String(dbUser._id));
        if (!isOwner && !isShared) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        return NextResponse.json({ sharedWith: note.sharedWith || [] });
    } catch (e) {
        console.error('Share list error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        // Only owner can unshare
        const session = await getServerSession(authOptions as any) as Session | null;
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

        const note = await Note.findOne({ _id: id });
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

        if (String(note.userId) !== String(dbUser._id)) {
            return NextResponse.json({ error: 'Only owner can unshare' }, { status: 403 });
        }

        const userToRemove = await User.findOne({ email });
        if (!userToRemove) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        note.sharedWith = (note.sharedWith || []).filter((s: any) => String(s.userId) !== String(userToRemove._id));
        await note.save();

        await AuditLog.create({ noteId: note._id, action: 'unshared', userId: dbUser._id, details: { removed: userToRemove._id } });

        return NextResponse.json({ status: 'unshared' });
    } catch (e) {
        console.error('Unshare error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
