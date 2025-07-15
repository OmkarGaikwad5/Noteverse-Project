// components/ModalWrapper.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ isOpen, onClose, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = "hidden"; // prevent background scroll
    } else {
      document.body.style.overflow = "";
      setTimeout(() => setVisible(false), 200);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          isOpen ? "opacity-50" : "opacity-0"
        }`}
      />
      <div
        className={`z-10 max-h-10/12 overflow-hidden transform bg-white rounded-xl p-6 transition-all duration-200 max-w-11/12 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default ModalWrapper;
