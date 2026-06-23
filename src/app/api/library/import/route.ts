import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LibraryItem from "@/models/LibraryItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteIds } = await req.json();

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
        return NextResponse.json({ error: "No notes selected" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const noteId of noteIds) {
        try {
            // Check if already exists
            const existing = await LibraryItem.findOne({
                userId: session.user.id,
                noteId: noteId
            });

            if (existing) {
                errors.push({ noteId, error: "Already imported" });
                continue;
            }

            // Get note to get title and type
            const { default: Note } = await import("@/models/Note");
            const note = await Note.findById(noteId).lean();

            if (!note) {
                errors.push({ noteId, error: "Note not found" });
                continue;
            }

            // Create library item
            const libraryItem = await LibraryItem.create({
                userId: session.user.id,
                noteId: noteId,
                title: note.title,
                type: note.type
            });

            results.push(libraryItem);
        } catch (error) {
            errors.push({ noteId, error: String(error) });
        }
    }

    return NextResponse.json({ 
        success: results.length,
        failed: errors.length,
        results,
        errors 
    });
}