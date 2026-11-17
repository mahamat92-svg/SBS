"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ModalDialog({
  open,
  onClose,
  title,
  children,
}: ModalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        if (ref.current) ref.current.returnValue = "";
        onClose();
      }}
      onClick={(e) => {
        const dialog = ref.current;
        if (!dialog) return;
        const r = dialog.getBoundingClientRect();
        const outside =
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom;
        if (outside) onClose();
      }}
      className="w-full"
    >
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-green-900 px-5 py-4 text-white">
        <h2 id={titleId} className="text-base font-bold sm:text-lg">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[75dvh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
