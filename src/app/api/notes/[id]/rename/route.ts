import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const { title } = await req.json();

  await Note.findByIdAndUpdate(params.id, { title, updatedAt: new Date() });

  return NextResponse.json({ ok: true });
}
