import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import NotebookContent from "@/models/NotebookContent";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { html, url, title } = await req.json();
    if (!html) {
      return NextResponse.json({ error: "No content selected" }, { status: 400 });
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    /* ================= CREATE NOTE ================= */

    const noteId = Date.now().toString();

    await Note.create({
      _id: noteId,
      userId: dbUser._id,
      title: title || "Web Clip",
      type: "notebook",
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      serverUpdatedAt: new Date(),
    });

    /* ================= CONVERT HTML TO LINES ================= */

    // Replace block tags with newline markers
    let formatted = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n");

    // Remove remaining HTML tags
    formatted = formatted.replace(/<[^>]+>/g, "");

    const textLines = formatted
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const lines = [
      `Source: ${url}`,
      "",
      ...textLines
    ];

    const pages = [lines]; // matches string[][]

    await NotebookContent.create({
      noteId,
      pages,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Extension save error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}