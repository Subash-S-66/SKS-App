"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FirstTimeSetupBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("setupBannerDismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("setupBannerDismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
        <p className="text-sm font-medium">
          Welcome to SKS Agency Portal! If you are the default admin, please change your password immediately in Settings.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-amber-950 hover:bg-amber-600 h-8 w-8 shrink-0 ml-4"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}