import type { Viewport } from "next";
import { inviteFontVars } from "../fonts";
import "../globals.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={inviteFontVars}>
      <body>{children}</body>
    </html>
  );
}
