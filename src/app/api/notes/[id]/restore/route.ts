import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const note = await Note.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { isDeleted: false, updatedAt: new Date() },
      { new: true }
    );

    if (!note)
      return NextResponse.json({ error: "Note not found" }, { status: 404 });

    console.log("RESTORED NOTE:", id);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
