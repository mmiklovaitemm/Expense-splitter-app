"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Split } from "lucide-react";
import { MoneyText } from "./MoneyText";
import { ThemeToggle } from "./ThemeToggle";
import { SignOutButton } from "./SignOutButton";

export interface SidebarGroup {
  id: string;
  name: string;
  myNet: number;
  defaultCurrency: string;
}

export function Sidebar({
  groups,
  userName,
  isGuest,
}: {
  groups: SidebarGroup[];
  userName: string;
  isGuest: boolean;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-6 flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
          <Split className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold">Expense Splitter</span>
      </div>

      <div className="mb-2 px-2 text-xs font-medium tracking-wide text-[var(--muted-2)]">GROUPS</div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/groups/${g.id}`}
            className={`flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors ${
              pathname === `/groups/${g.id}`
                ? "bg-[var(--surface-active)] font-medium text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-white"
            }`}
          >
            <span className="truncate">{g.name}</span>
            {g.myNet !== 0 && (
              <MoneyText
                minor={g.myNet}
                currency={g.defaultCurrency}
                colorize
                className="ml-2 shrink-0 text-xs font-semibold"
              />
            )}
            {g.myNet === 0 && (
              <span className="ml-2 shrink-0 text-xs text-[var(--muted-2)]">$0.00</span>
            )}
          </Link>
        ))}
      </nav>

      <Link
        href="/groups/new"
        className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
      >
        <Plus className="h-4 w-4" />
        New group
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{userName}</div>
          {isGuest && <div className="text-xs text-[var(--muted-2)]">Guest session</div>}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
