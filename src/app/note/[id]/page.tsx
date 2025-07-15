'use client';

import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
const CanvasBoard = dynamic(() => import("@/components/CanvasBoard"), {ssr: false});
const Notebook = dynamic(() =>  import("@/components/Notebook"), {ssr: false});

export default function NotePage() {
  const params = useParams(); // this is now correct
  const searchParams = useSearchParams();

  const noteId = params?.id as string;
  const mode = searchParams.get("mode"); // canvas or notebook

  if (!noteId) {
    return <div className="p-8 text-red-600">⚠️ Missing note ID.</div>;
  }

  if (!mode) {
    return <div className="p-8 text-red-600">⚠️ Missing mode in URL query (?mode=canvas or notebook).</div>;
  }

  return (
    <div className="p-4">
      {mode === "canvas" ? (
        <CanvasBoard noteId={noteId} />
      ) : mode === "notebook" ? (
        <Notebook noteId={noteId} />
      ) : (
        <div>⚠️ Invalid mode: {mode}</div>
      )}
    </div>
  );
}
