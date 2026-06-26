import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { isPublic } = await req.json();

    if (typeof isPublic !== 'boolean') {
        return NextResponse.json({ error: "Invalid isPublic value" }, { status: 400 });
    }

    const note = await Note.findOne({
        _id: id,
        userId: session.user.id,
        isDeleted: false
    });

    if (!note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    note.isPublic = isPublic;
    note.updatedAt = new Date();
    await note.save();

    return NextResponse.json({ 
        success: true, 
        isPublic: note.isPublic,
        message: isPublic ? "Note is now public" : "Note is now private"
    });
}