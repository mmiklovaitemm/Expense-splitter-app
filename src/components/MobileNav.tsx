"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar, type SidebarGroup } from "./Sidebar";

export function MobileNav({
  groups,
  userName,
  isGuest,
}: {
  groups: SidebarGroup[];
  userName: string;
  isGuest: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="relative z-10">
            <Sidebar groups={groups} userName={userName} isGuest={isGuest} />
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-hover)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
