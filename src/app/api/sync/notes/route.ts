
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';
import User from '@/models/User';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const { userId, notes } = await req.json();

        if (!userId || !Array.isArray(notes)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Resolve userId: allow client to send either a Mongo ObjectId string or an email.
        let resolvedUserId: any = userId;
        // crude email check
        if (typeof userId === 'string' && userId.includes('@')) {
            const dbUser = await User.findOne({ email: userId });
            if (!dbUser) {
                return NextResponse.json({ error: 'User not found for provided identifier' }, { status: 400 });
            }
            resolvedUserId = dbUser._id;
        }

        const updatedIds: string[] = [];

        for (const note of notes) {
            // Optimistic: Client wins if its updatedAt is newer.
            // Or if it doesn't exist.
            // Note: note.id from client maps to _id in DB.

            const noteId = note.id || note._id;
            if (!noteId) continue;

            const clientUpdatedAt = new Date(note.updatedAt || Date.now());

            // Upsert logic
            // We can use findOneAndUpdate with upsert, but we need to check strict timestamp condition if we want "Server Wins" logic ever.
            // For "Client Wins", we just overwrite if newer.
            // However, blindly overwriting might be dangerous if multiple devices sync out of order.
            // Ideally: Update if (db.updatedAt < client.updatedAt) OR (doc not found).

            // Better approach for clarity: find existing by resolved user id
            const existing = await Note.findOne({ _id: noteId, userId: resolvedUserId });

            if (!existing || new Date(existing.updatedAt) < clientUpdatedAt) {
                await Note.updateOne(
                    { _id: noteId, userId: resolvedUserId },
                    {
                        title: note.title,
                        type: note.type,
                        isDeleted: note.isDeleted || false,
                        updatedAt: clientUpdatedAt,
                        serverUpdatedAt: new Date(),
                        createdAt: existing ? existing.createdAt : new Date(note.createdAt || Date.now())
                    },
                    { upsert: true }
                );
                updatedIds.push(noteId);
            }
        }

        return NextResponse.json({ updated: updatedIds });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
