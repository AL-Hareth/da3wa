import type { Event } from "@/lib/db/schema";
import { imageUrls } from "@/lib/images";
import { getTheme } from "@/lib/themes";
import { cn } from "@/lib/cn";

/** Small preview of the invitation card, or the theme swatch for template-based events. */
export function EventThumb({ event, className }: { event: Event; className?: string }) {
  if (event.designMode === "upload" && event.cardImage) {
    const img = imageUrls(event.cardImage);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img.thumb}
        alt=""
        loading="lazy"
        className={cn("aspect-[3/4] rounded-xl border border-line bg-paper object-cover", className)}
        style={{ backgroundImage: `url(${img.blurDataUrl})`, backgroundSize: "cover" }}
      />
    );
  }
  const theme = getTheme(event.themeId);
  return (
    <div
      className={cn("grid aspect-[3/4] place-items-center rounded-xl border", className)}
      style={{ background: theme.colors.bg, borderColor: theme.colors.border, color: theme.colors.accent }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="w-1/2">
        <path fill="currentColor" d="M20 4c1.4 4.4 4.2 7.2 8.6 8.6-4.4 1.4-7.2 4.2-8.6 8.6-1.4-4.4-4.2-7.2-8.6-8.6C15.8 11.2 18.6 8.4 20 4Z" />
        <path fill="none" stroke="currentColor" strokeWidth="1" d="M8 30h24M12 34h16" opacity=".6" />
      </svg>
    </div>
  );
}
