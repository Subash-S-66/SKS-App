import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
