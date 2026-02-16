import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AuditLog from '@/models/AuditLog';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    const logs = await AuditLog.find({ noteId: id }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json({ logs });
  } catch (e) {
    console.error('Audit list error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
