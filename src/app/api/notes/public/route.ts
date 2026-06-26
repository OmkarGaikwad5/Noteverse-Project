import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all public notes from all users (excluding own notes)
    const publicNotes = await Note.find({
        isPublic: true,
        isDeleted: false,
        userId: { $ne: session.user.id } // Exclude current user's own notes
    })
    .sort({ createdAt: -1 })
    .lean();

    // Get user info for each note
    const notesWithAuthor = await Promise.all(
        publicNotes.map(async (note: any) => {
            const user = await User.findById(note.userId).lean();
            return {
                id: note._id.toString(),
                title: note.title,
                type: note.type,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                author: {
                    id: user?._id?.toString(),
                    name: user?.name || 'Unknown User',
                    email: user?.email
                }
            };
        })
    );

    return NextResponse.json({ notes: notesWithAuthor });
}

