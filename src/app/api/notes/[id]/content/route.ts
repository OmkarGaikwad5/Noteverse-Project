import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NotebookContent from "@/models/NotebookContent";
import CanvasContent from "@/models/CanvasContent";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ============================= */
/* GET: LOAD NOTE CONTENT        */
/* ============================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }  // ✅ Next 15
) {
  await dbConnect();

  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (String(note.userId) !== String(dbUser._id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ===== NOTEBOOK ===== */
    if (note.type === "notebook") {
      const content = await NotebookContent.findOne({ noteId: id });

      const text =
        content?.pages?.flat().join("\n") || "\n";

      return NextResponse.json({
        type: "notebook",
        data: {
          ops: [{ insert: text }]
        }
      });
    }

    /* ===== CANVAS ===== */
    if (note.type === "canvas") {
      const content = await CanvasContent.findOne({ noteId: id });

      return NextResponse.json({
        type: "canvas",
        data: content?.data || {}
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Load Content Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ============================= */
/* POST: SYNC NOTE CONTENT       */
/* ============================= */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await context.params;

  try {
    const body = await req.json();
    const { type, data, updatedAt } = body;

    if (!id || !type || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );

    const note = await Note.findById(id);
    if (!note)
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );

    if (String(note.userId) !== String(dbUser._id)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const clientUpdatedAt = new Date(updatedAt || Date.now());

    /* ===== NOTEBOOK ===== */
    if (type === "notebook") {

      // Convert Quill delta to [[String]]
      let text = "";
      data.ops?.forEach((op: any) => {
        if (typeof op.insert === "string") {
          text += op.insert;
        }
      });

      const pages = [
        text.split("\n")
      ];

      await NotebookContent.findOneAndUpdate(
        { noteId: id },
        { pages, updatedAt: clientUpdatedAt },
        { upsert: true, new: true }
      );
    }

    /* ===== CANVAS ===== */
    if (type === "canvas") {
      await CanvasContent.findOneAndUpdate(
        { noteId: id },
        { data, updatedAt: clientUpdatedAt },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ status: "synced" });

  } catch (error) {
    console.error("Content Sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}