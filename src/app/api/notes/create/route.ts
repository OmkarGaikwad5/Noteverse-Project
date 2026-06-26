import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  await dbConnect();

  /* ---------- GET SESSION ---------- */
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, type } = await req.json();

  /* ---------- CREATE NOTE ---------- */
  const noteId = Date.now().toString();

  await Note.create({
    _id: noteId,
    userId: session.user.id, // MongoDB ObjectId (correct now)
    title: title || "Untitled",
    type,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  return NextResponse.json({ noteId });
}
