'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdDeleteOutline, MdDelete } from "react-icons/md";

const BinButton = ({ animate }: { animate?: boolean }) => {
  const router = useRouter();
  const [showFilled, setShowFilled] = useState(false);

  useEffect(() => {
    if (animate) {
      setShowFilled(true);
      const timeout = setTimeout(() => setShowFilled(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [animate]);

  return (
    <button
      onClick={() => router.push("/note/bin")}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-all duration-300 relative"
    >
      <span
        className={`transition-transform duration-500 ${
          animate ? "scale-125 rotate-12" : ""
        }`}
      >
        {showFilled ? (
          <MdDelete className="text-red-700 animate-wiggle" size={20} />
        ) : (
          <MdDeleteOutline className="text-red-700" size={20} />
        )}
      </span>
      <span className="tracking-wide">Bin</span>
    </button>
  );
};

export default BinButton;