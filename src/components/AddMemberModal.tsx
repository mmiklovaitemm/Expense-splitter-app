"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "./Modal";

export function AddMemberModal({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
        title="Add member"
      >
        <UserPlus className="h-3.5 w-3.5" />
      </button>

      {open && (
        <Modal title="Add a member" onClose={() => setOpen(false)}>
          <form action={submit} className="flex flex-col gap-3">
            <input
              name="name"
              required
              autoFocus
              placeholder="Name"
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <p className="text-xs text-[var(--muted-2)]">
              They don&apos;t need an account to be added and split expenses.
            </p>
            {error && <p className="text-sm text-[var(--negative)]">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add member"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
