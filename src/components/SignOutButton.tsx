"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      title="Sign out"
      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
