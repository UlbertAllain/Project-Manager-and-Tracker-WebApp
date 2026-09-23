"use client";

import type { ReactNode } from "react";

interface ConfirmSubmitButtonProps {
  children: ReactNode;
  className?: string;
  message?: string;
}

export function ConfirmSubmitButton({
  children,
  className = "btn btn-danger",
  message = "Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?",
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
