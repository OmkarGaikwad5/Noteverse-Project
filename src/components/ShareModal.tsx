"use client";

import SharingPanel from "./SharingPanel";

export default function ShareModal({
  noteId,
  onClose,
}: {
  noteId: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-[500px] rounded-xl shadow-lg p-5 relative">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-3">
          Share this note
        </h2>

        <SharingPanel noteId={noteId} />

      </div>
    </div>
  );
}