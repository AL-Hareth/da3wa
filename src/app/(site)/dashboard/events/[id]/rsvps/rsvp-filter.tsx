"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function RsvpFilter({ statuses, placeholder, allLabel }: { statuses: Record<"attending" | "not_attending" | "maybe", string>; placeholder: string; allLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const status = params.get("status") ?? "";

  function update(next: { q?: string; status?: string }) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) update({ q });
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-full border border-line-strong bg-card ps-9 pe-4 text-sm focus:border-gold focus:ring-4 focus:ring-gold/15 focus:outline-none"
        />
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {[["", allLabel] as const, ...Object.entries(statuses)].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => update({ status: value })}
            className={cn("rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap", status === value ? "bg-ink text-white" : "bg-card text-ink-soft ring-1 ring-line hover:bg-gold-soft/60")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
