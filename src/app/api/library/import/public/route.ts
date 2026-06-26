import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LibraryItem from "@/models/LibraryItem";
import Note from "@/models/Note";
import CanvasContent from "@/models/CanvasContent";
import NotebookContent from "@/models/NotebookContent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
        return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    // Check if note exists and is public (and not owned by current user)
    const note = await Note.findOne({
        _id: noteId,
        isPublic: true,
        isDeleted: false,
        userId: { $ne: session.user.id }
    }).lean();

    if (!note) {
        return NextResponse.json({ error: "Note not found or not public" }, { status: 404 });
    }

    // Check if already imported to user's library
    const existing = await LibraryItem.findOne({
        userId: session.user.id,
        noteId: noteId
    });

    if (existing) {
        return NextResponse.json({ error: "Already imported to your library" }, { status: 400 });
    }

    // Fetch the note content based on type
    let content = null;
    if (note.type === 'canvas') {
        const canvasContent = await CanvasContent.findOne({ noteId: noteId }).lean();
        // Store the complete canvas data structure
        content = canvasContent?.data || {
            lines: [[]],
            textBoxes: [[]],
            shapes: [[]],
            stickyNotes: [[]],
            background: '#ffffff'
        };
        console.log("Canvas content fetched:", content);
    } else {
        const notebookContent = await NotebookContent.findOne({ noteId: noteId }).lean();
        content = notebookContent?.pages || null;
        console.log("Notebook content fetched:", content);
    }

    // Create library item with content
    const libraryItem = await LibraryItem.create({
        userId: session.user.id,
        noteId: noteId,
        title: note.title,
        type: note.type === 'notebook' ? 'note' : note.type,
        content: content
    });

    return NextResponse.json({ 
        success: true, 
        libraryItem: {
            _id: libraryItem._id,
            noteId: libraryItem.noteId,
            title: libraryItem.title,
            type: libraryItem.type,
            content: libraryItem.content,
            importedAt: libraryItem.importedAt
        }
    });
}