"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic imports
const CanvasBoard = dynamic(() => import("@/components/CanvasBoard"), { ssr: false });
const Notebook = dynamic(() => import("@/components/Notebook"), { ssr: false });

export default function NotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");

  const noteId = params?.id as string;
  const mode = searchParams.get("mode");

  useEffect(() => {
    // Fetch note info to check permissions
    const fetchNoteInfo = async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/content`);
        const data = await res.json();
        if (data.readOnly) {
          setIsReadOnly(true);
        }
        if (data.isImported) {
          setIsImported(true);
        }
        if (data.note?.title) {
          setNoteTitle(data.note.title);
        }
      } catch (err) {
        console.error("Failed to fetch note info", err);
      }
    };
    if (noteId) {
      fetchNoteInfo();
    }
  }, [noteId]);

  if (!noteId) {
    return <div className="p-8 text-red-600">⚠️ Missing note ID.</div>;
  }

  if (!mode) {
    return (
      <div className="p-8 text-red-600">
        ⚠️ Missing mode in URL query (?mode=canvas or notebook).
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Show banner for imported/read-only notes */}
      {(isReadOnly || isImported) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
          <p className="text-blue-700 text-sm">
            {isImported ? (
              <>
                <span className="font-semibold">📚 Imported Note</span> - You're viewing a note from another user's library. 
                This is a read-only copy. You cannot edit this note.
              </>
            ) : (
              <>
                <span className="font-semibold">👁️ Read-Only Mode</span> - You have view-only access to this note.
              </>
            )}
          </p>
        </div>
      )}

      {/* NOTE CONTENT */}
      <div>
        {mode === "canvas" ? (
          <CanvasBoard noteId={noteId} isReadOnly={isReadOnly || isImported} />
        ) : mode === "notebook" ? (
          <Notebook noteId={noteId} isReadOnly={isReadOnly || isImported} />
        ) : (
          <div>⚠️ Invalid mode: {mode}</div>
        )}
      </div>
    </div>
  );
}