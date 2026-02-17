import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1️⃣ Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, url, title } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text selected" }, { status: 400 });
    }

    // 2️⃣ Find DB user
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3️⃣ Generate CLIENT STYLE ID (IMPORTANT)
    const noteId = Date.now().toString();

    // 4️⃣ Create NOTE METADATA (no content here)
    await Note.create({
      _id: noteId,
      userId: dbUser._id,
      title: title || "Web Clip",
      type: "notebook",
      isDeleted: false,
      updatedAt: new Date(),
      serverUpdatedAt: new Date(),
      createdAt: new Date()
    });

    // 5️⃣ Upload CONTENT using existing system
    await fetch(`${process.env.NEXTAUTH_URL}/api/notes/${noteId}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: dbUser._id,
        type: "notebook",
        data: {
          ops: [
            { insert: `Source: ${url}\n\n` },
            { insert: text }
          ]
        },
        updatedAt: new Date()
      })
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Extension save error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
