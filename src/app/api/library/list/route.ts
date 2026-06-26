import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LibraryItem from "@/models/LibraryItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const libraryItems = await LibraryItem.find({
        userId: session.user.id
    }).sort({ importedAt: -1 }).lean();

    const formatted = libraryItems.map((item: any) => ({
        _id: item._id.toString(),
        noteId: item.noteId,
        title: item.title,
        type: item.type,
        content: item.content,
        importedAt: item.importedAt
    }));

    return NextResponse.json({ library: formatted });
}