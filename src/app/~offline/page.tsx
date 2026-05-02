"use client";

import { AlertTriangle } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-warning mb-4" />
      <h1 className="text-3xl font-bold mb-2">You are offline</h1>
      <p className="text-muted-foreground mb-6">
        It seems you've lost your internet connection. Please check your network and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  );
}
