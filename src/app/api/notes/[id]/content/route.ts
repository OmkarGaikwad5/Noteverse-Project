import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotebookContent from '@/models/NotebookContent';
import CanvasContent from '@/models/CanvasContent';
import Note from '@/models/Note';

/* ---------------- QUILL → NOTEBOOK CONVERTER ---------------- */
function quillToPages(delta: any): string[][] {
    if (!delta) return [[""]];

    if (Array.isArray(delta) && Array.isArray(delta[0])) return delta;
    if (delta.pages) return delta.pages;

    if (delta.ops) {
        let text = "";

        for (const op of delta.ops) {
            if (typeof op.insert === "string") {
                text += op.insert;
            }
        }

        const lines = text
            .replace(/\r/g, "")
            .split("\n")
            .filter(l => l.trim().length > 0);

        if (lines.length === 0) return [[""]];

        return [lines];
    }

    return [[String(delta)]];
}

/* ---------------- NOTEBOOK → QUILL CONVERTER ---------------- */
function pagesToQuill(pages: string[][]) {
    const text = pages.flat().join("\n");

    return {
        ops: [
            { insert: text || "\n" }
        ]
    };
}

/* ========================================================= */
/* ========================  GET  =========================== */
/* ========================================================= */

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  // ✅ MUST await params in NextJS 15
  const { id } = await context.params;

  try {
    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    /* ---------- NOTEBOOK ---------- */
    if (note.type === "notebook") {
      const content = await NotebookContent.findOne({ noteId: id });

      console.log("========== LOAD DEBUG ==========");
      console.log("NOTE ID:", id);
      console.log("DB CONTENT:", JSON.stringify(content, null, 2));
      console.log("================================");

      return NextResponse.json({
        type: "notebook",
        data: content
          ? pagesToQuill(content.pages)
          : { ops: [{ insert: "\n" }] }
      });
    }

    /* ---------- CANVAS ---------- */
    if (note.type === "canvas") {
      const content = await CanvasContent.findOne({ noteId: id });

      return NextResponse.json({
        type: "canvas",
        data: content?.data || {}
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Load Note Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


/* ========================================================= */
/* ========================  POST  ========================== */
/* ========================================================= */

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  // ✅ await params HERE (inside body)
  const { id } = await context.params;

  try {
    const body = await req.json();
    const { type, data, updatedAt, userId } = body;

    if (!id || !type || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
    }

    const clientUpdatedAt = new Date(updatedAt || Date.now());

    /* ---------- NOTEBOOK ---------- */
    if (type === "notebook") {
      const existing = await NotebookContent.findOne({ noteId: id });

      if (existing && new Date(existing.updatedAt) > clientUpdatedAt) {
        return NextResponse.json({ status: "ignored", reason: "stale" });
      }

      const pages = quillToPages(data);

      console.log("========== SAVE DEBUG ==========");
      console.log("NOTE ID:", id);
      console.log("RAW DELTA:", JSON.stringify(data, null, 2));
      console.log("CONVERTED PAGES:", JSON.stringify(pages, null, 2));
      console.log("================================");

      await NotebookContent.findOneAndUpdate(
        { noteId: id },
        { pages, updatedAt: clientUpdatedAt },
        { upsert: true }
      );
    }

    /* ---------- CANVAS ---------- */
    else if (type === "canvas") {
      const existing = await CanvasContent.findOne({ noteId: id });

      if (existing && new Date(existing.updatedAt) > clientUpdatedAt) {
        return NextResponse.json({ status: "ignored", reason: "stale" });
      }

      await CanvasContent.findOneAndUpdate(
        { noteId: id },
        { data, updatedAt: clientUpdatedAt },
        { upsert: true }
      );
    }

    return NextResponse.json({ status: "synced" });

  } catch (error) {
    console.error("Content Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

