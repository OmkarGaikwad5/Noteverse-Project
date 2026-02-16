import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invite from '@/models/Invite';
import User from '@/models/User';
import Note from '@/models/Note';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { email, permission, message, createLink } = await req.json();
    if (!email || !permission) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const note = await Note.findOne({ _id: id });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    if (String(note.userId) !== String(dbUser._id)) return NextResponse.json({ error: 'Only owner can invite' }, { status: 403 });

    const token = crypto.randomBytes(20).toString('hex');
    const invite = await Invite.create({ token, noteId: id, inviterId: dbUser._id, email: email.toLowerCase(), permission, message });

    // Create share link
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
    const link = `${base}/api/invite/${token}`;

    // Send email (placeholder)
    await sendMail(email, `${dbUser?.email} invited you to a note`, `You were invited to ${note.title}. Accept: ${link}\n\nMessage: ${message || ''}`);

    await AuditLog.create({ noteId: id, action: 'invite_created', userId: dbUser._id, details: { email, permission } });

    return NextResponse.json({ invite: { token: invite.token, link }, status: 'ok' });
  } catch (e) {
    console.error('Invite error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    const invites = await Invite.find({ noteId: id }).sort({ createdAt: -1 });
    return NextResponse.json({ invites });
  } catch (e) {
    console.error('Invite list error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
