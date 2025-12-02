"use client";

import { useEffect, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  let panelMaxWidth = "max-w-lg";
  if (size === "sm") panelMaxWidth = "max-w-md";
  if (size === "lg") panelMaxWidth = "max-w-3xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`h-full w-full ${panelMaxWidth} rounded-none bg-white shadow-lg md:h-auto md:rounded-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 py-3 text-xs md:max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
}