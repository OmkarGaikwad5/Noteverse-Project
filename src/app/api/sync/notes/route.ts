
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const { userId, notes } = await req.json();

        if (!userId || !Array.isArray(notes)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
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

            // MongoDB query for this:
            const result = await Note.updateOne(
                {
                    _id: noteId,
                    userId: userId,
                    // Only update if current doc is OLDER, or doesn't exist (handled by upsert behaviors slightly differently, need careful query)
                    // Actually, for bulk sync, simple approach:
                    // Try to find. If found and newer => skip. Else => update/insert.
                },
                {
                    $set: {
                        title: note.title,
                        type: note.type,
                        isDeleted: note.isDeleted || false,
                        updatedAt: clientUpdatedAt,
                        serverUpdatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date(note.createdAt || Date.now())
                    }
                },
                { upsert: true }
            );

            // Technically updateOne with upsert will insert if not found. 
            // But how do we enforce "only if newer"?
            // We can add a query condition: updatedAt: { $lt: clientUpdatedAt }
            // BUT if it doesn't exist, that condition won't match, so it won't insert? 
            // No, with upsert, if query doesn't match, it inserts.
            // But if it exists and ensures {updatedAt: {$lt: ...}}, and it FAILS (because server is newer), it DOES NOT Insert.
            // So:
            // Query: { _id: noteId, userId: userId, $or: [ { updatedAt: { $lt: clientUpdatedAt } }, { updatedAt: { $exists: false } } ] }
            // But `upsert` creates a NEW doc if query fails. If doc exists but is NEWER, we don't want to create new doc, we want to DO NOTHING.
            // So upsert is tricky here.

            // Better approach for clarity:
            const existing = await Note.findOne({ _id: noteId, userId });

            if (!existing || new Date(existing.updatedAt) < clientUpdatedAt) {
                await Note.updateOne(
                    { _id: noteId, userId },
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
