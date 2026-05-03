"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--secondary)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
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
