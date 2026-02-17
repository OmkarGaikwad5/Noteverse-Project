import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ notes: [] });

  const notes = await Note.find({
    userId: session.user.id,
    isDeleted: false
  })
    .sort({ updatedAt: -1 })
    .lean();

  const formatted = notes.map((n: any) => ({
    id: n._id.toString(),
    title: n.title,
    type: n.type,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  }));

  return NextResponse.json({ notes: formatted });
}
