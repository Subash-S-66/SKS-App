"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        className: "!bg-secondary !text-white !border !border-border",
        success: {
          iconTheme: {
            primary: "var(--success)",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--danger)",
            secondary: "white",
          },
        },
      }}
    />
  );
}
