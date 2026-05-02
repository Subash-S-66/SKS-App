"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/Button";

export function FirstTimeSetupBanner() {
  const [needsChange, setNeedsChange] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(session => {
        if (session?.user?.needsPasswordChange) {
          setNeedsChange(true);
        }
      })
      .catch(console.error);
  }, []);

  if (!needsChange) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-warning px-4 py-2 text-white">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">
          Security Alert: You are using the default password. Please change it immediately.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
        onClick={() => window.location.href = "/settings"}
      >
        Update Password
      </Button>
    </div>
  );
}
