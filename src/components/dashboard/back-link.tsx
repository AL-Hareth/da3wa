import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
      <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
      {label}
    </Link>
  );
}
