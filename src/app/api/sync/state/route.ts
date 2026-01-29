
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function GET(req: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const since = searchParams.get('since');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const sinceDate = since ? new Date(since) : new Date(0); // Epoch if clean sync

        // Fetch updated Notes metadata
        const notes = await Note.find({
            userId,
            updatedAt: { $gt: sinceDate }
        }).lean();

        return NextResponse.json({
            notes,
            serverTime: new Date()
        });

    } catch (error) {
        console.error('State Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
