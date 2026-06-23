"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error);
          return;
        }

        // redirect to actual note
       const mode = data.type === "notebook" ? "notebook" : "canvas";
       router.push(`/note/${data.noteId}?mode=${mode}`);

      } catch (err) {
        console.error(err);
      }
    };

    acceptInvite();
  }, [token, router]);

  return <div className="p-8">Accepting invite...</div>;
}