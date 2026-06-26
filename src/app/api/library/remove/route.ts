import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LibraryItem from "@/models/LibraryItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const libraryItem = await LibraryItem.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!libraryItem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await libraryItem.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete library item error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}