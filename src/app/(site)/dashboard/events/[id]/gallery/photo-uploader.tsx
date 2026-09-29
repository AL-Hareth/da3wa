"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import { uploadPhotoAction } from "./actions";

/** Uploads photos one request at a time so each stays within the server's body limit. */
export function PhotoUploader({ eventId, label }: { eventId: string; label: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList) {
    const list = Array.from(files);
    setError(null);
    setProgress({ done: 0, total: list.length });
    for (const [i, file] of list.entries()) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadPhotoAction(eventId, fd);
      if (!res.ok) setError(res.error ?? null);
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label className={buttonClass("primary", "md", progress ? "pointer-events-none opacity-70" : "cursor-pointer")}>
        {progress ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
        {progress ? `${progress.done}/${progress.total}` : label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={!!progress}
          onChange={(e) => {
            if (e.currentTarget.files?.length) void onFiles(e.currentTarget.files);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
