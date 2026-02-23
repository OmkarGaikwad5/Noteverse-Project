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
    isDeleted: true
  })
    .sort({ deletedAt: -1 })
    .lean();

  return NextResponse.json({ notes });
}
