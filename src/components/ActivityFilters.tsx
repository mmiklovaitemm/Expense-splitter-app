"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export function ActivityFilters({
  categories,
  members,
}: {
  categories: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const category = searchParams.get("category") ?? "";
  const member = searchParams.get("member") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const activeCount = [category, member, from, to].filter(Boolean).length;

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Filters</span>
            <button onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted-2)]">Category</label>
              <select
                value={category}
                onChange={(e) => setParam("category", e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted-2)]">Member</label>
              <select
                value={member}
                onChange={(e) => setParam("member", e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none"
              >
                <option value="">Everyone</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[var(--muted-2)]">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setParam("from", e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[var(--muted-2)]">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setParam("to", e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none"
                />
              </div>
            </div>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-xs text-[var(--muted)] hover:text-white">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
