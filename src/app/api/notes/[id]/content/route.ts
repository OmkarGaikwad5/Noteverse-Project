import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NotebookContent from "@/models/NotebookContent";
import CanvasContent from "@/models/CanvasContent";
import LibraryItem from "@/models/LibraryItem";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ============================= */
/* HELPER: CHECK ACCESS          */
/* ============================= */
function getUserPermission(note: any, userId: string) {
  const isOwner = String(note.userId) === String(userId);

  if (isOwner) {
    return { allowed: true, permission: "owner" };
  }

  const shared = (note.sharedWith || []).find(
    (s: any) => String(s.userId) === String(userId)
  );

  if (shared) {
    return { allowed: true, permission: shared.permission };
  }

  return { allowed: false };
}

/* ============================= */
/* GET: LOAD NOTE CONTENT        */
/* ============================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
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

    // If note exists, check permission
    if (note) {
      const access = getUserPermission(note, dbUser._id);

      if (!access.allowed) {
        // Check if note is public - allow read-only access
        if (note.isPublic === true) {
          // Public note - allow read-only access
          if (note.type === "notebook") {
            const content = await NotebookContent.findOne({ noteId: id });
            const text = content?.pages?.flat().join("\n") || "\n";
            return NextResponse.json({
              type: "notebook",
              permission: "view",
              readOnly: true,
              isPublic: true,
              note: { title: note.title },
              data: {
                ops: [{ insert: text }]
              }
            });
          }
          if (note.type === "canvas") {
            const content = await CanvasContent.findOne({ noteId: id });
            // Ensure we return proper default structure if content doesn't exist
            const defaultData = {
              lines: [[]],
              textBoxes: [[]],
              shapes: [[]],
              stickyNotes: [[]],
              background: '#ffffff'
            };
            return NextResponse.json({
              type: "canvas",
              permission: "view",
              readOnly: true,
              isPublic: true,
              note: { title: note.title },
              data: content?.data || defaultData
            });
          }
        }
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      /* ===== NOTEBOOK ===== */
      if (note.type === "notebook") {
        const content = await NotebookContent.findOne({ noteId: id });
        const text = content?.pages?.flat().join("\n") || "\n";
        return NextResponse.json({
          type: "notebook",
          permission: access.permission,
          note: { title: note.title },
          data: {
            ops: [{ insert: text }]
          }
        });
      }

      /* ===== CANVAS ===== */
      if (note.type === "canvas") {
        const content = await CanvasContent.findOne({ noteId: id });
        // Ensure we return proper default structure if content doesn't exist
        const defaultData = {
          lines: [[]],
          textBoxes: [[]],
          shapes: [[]],
          stickyNotes: [[]],
          background: '#ffffff'
        };
        return NextResponse.json({
          type: "canvas",
          permission: access.permission,
          note: { title: note.title },
          data: content?.data || defaultData
        });
      }
    }

    // If note doesn't exist, check if user has imported this note to library
    const libraryItem = await LibraryItem.findOne({
      noteId: id,
      userId: dbUser._id
    }).lean();

    if (libraryItem) {
      console.log("Found library item:", libraryItem);
      
      // Return content from library item
      if (libraryItem.type === "canvas") {
        // For canvas notes, return the stored canvas data
        const defaultData = {
          lines: [[]],
          textBoxes: [[]],
          shapes: [[]],
          stickyNotes: [[]],
          background: '#ffffff'
        };
        return NextResponse.json({
          type: "canvas",
          permission: "view",
          readOnly: true,
          isImported: true,
          note: { title: libraryItem.title || 'Imported Note' },
          data: libraryItem.content || defaultData
        });
      } else {
        // For notebook/note type
        const content = libraryItem.content;
        let text = "";
        if (Array.isArray(content)) {
          text = content.flat().join("\n");
        } else if (content?.pages) {
          text = content.pages.flat().join("\n");
        } else if (typeof content === 'string') {
          text = content;
        } else {
          text = content || "\n";
        }
        return NextResponse.json({
          type: "notebook",
          permission: "view",
          readOnly: true,
          isImported: true,
          note: { title: libraryItem.title || 'Imported Note' },
          data: {
            ops: [{ insert: text }]
          }
        });
      }
    }

    return NextResponse.json({ error: "Note not found" }, { status: 404 });

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

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const note = await Note.findById(id);

    if (!note) {
      // Check if this is an imported note (library item)
      const libraryItem = await LibraryItem.findOne({
        noteId: id,
        userId: dbUser._id
      });

      if (libraryItem) {
        // Imported notes are read-only, cannot edit
        return NextResponse.json(
          { error: "Imported notes are read-only" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    const access = getUserPermission(note, dbUser._id);

    if (!access.allowed) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    /* VIEW users cannot edit */
    if (access.permission === "view") {
      return NextResponse.json(
        { error: "View only permission" },
        { status: 403 }
      );
    }

    const clientUpdatedAt = new Date(updatedAt || Date.now());

    /* ===== NOTEBOOK ===== */
    if (type === "notebook") {
      let text = "";
      data.ops?.forEach((op: any) => {
        if (typeof op.insert === "string") {
          text += op.insert;
        }
      });
      const pages = [text.split("\n")];
      await NotebookContent.findOneAndUpdate(
        { noteId: id },
        { pages, updatedAt: clientUpdatedAt },
        { upsert: true, new: true }
      );
    }

    /* ===== CANVAS ===== */
    if (type === "canvas") {
      // Ensure all required fields exist in the data
      const canvasData = {
        lines: data.lines || [[]],
        textBoxes: data.textBoxes || [[]],
        shapes: data.shapes || [[]],
        stickyNotes: data.stickyNotes || [[]],
        background: data.background || '#ffffff'
      };

      await CanvasContent.findOneAndUpdate(
        { noteId: id },
        { 
          data: canvasData, 
          updatedAt: clientUpdatedAt 
        },
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