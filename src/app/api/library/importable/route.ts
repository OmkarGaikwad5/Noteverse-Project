import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import LibraryItem from "@/models/LibraryItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all notes from user
    const userNotes = await Note.find({
        userId: session.user.id,
        isDeleted: false
    }).lean();

    // Get already imported note IDs
    const importedItems = await LibraryItem.find({
        userId: session.user.id
    }).lean();

    const importedNoteIds = new Set(importedItems.map(item => item.noteId));

    // Filter notes not yet imported
    const importableNotes = userNotes.filter(note => !importedNoteIds.has(note._id.toString()));

    const formatted = importableNotes.map((note: any) => ({
        id: note._id.toString(),
        title: note.title,
        type: note.type,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
    }));

    return NextResponse.json({ notes: formatted });
}