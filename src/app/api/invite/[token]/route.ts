import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invite from '@/models/Invite';
import User from '@/models/User';
import Note from '@/models/Note';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  await dbConnect();
  const { token } = await params;
  try {
    const invite = await Invite.findOne({ token });
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    return NextResponse.json({ invite });
  } catch (e) {
    console.error('Invite get error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  await dbConnect();
  const { token } = await params;
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const invite = await Invite.findOne({ token });
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    if (invite.accepted) return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
    if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });

    // Add to note.sharedWith
    const note = await Note.findOne({ _id: invite.noteId });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const exists = (note.sharedWith || []).some((s: any) => String(s.userId) === String(dbUser._id));
    if (!exists) {
      note.sharedWith = note.sharedWith || [];
      note.sharedWith.push({ userId: dbUser._id, permission: invite.permission, sharedAt: new Date() });
      await note.save();
    }

    invite.accepted = true;
    invite.acceptedBy = dbUser._id;
    await invite.save();

    await AuditLog.create({ noteId: note._id, action: 'invite_accepted', userId: dbUser._id, details: { inviterId: invite.inviterId } });

    return NextResponse.json({ status: 'accepted' });
  } catch (e) {
    console.error('Invite accept error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
