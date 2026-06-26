import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import NotebookContent from "@/models/NotebookContent";
import CanvasContent from "@/models/CanvasContent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const note = await Note.findOne({ _id: id, userId: session.user.id });

    if (!note)
      return NextResponse.json({ error: "Note not found" }, { status: 404 });

    /* delete content first */
    await NotebookContent.deleteOne({ noteId: id });
    await CanvasContent.deleteOne({ noteId: id });

    /* delete note */
    await Note.deleteOne({ _id: id });

    console.log("PERMANENTLY DELETED NOTE:", id);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Permanent delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
