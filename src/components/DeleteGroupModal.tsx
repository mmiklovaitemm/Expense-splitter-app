"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "./Modal";

export function DeleteGroupModal({
  groupName,
  action,
}: {
  groupName: string;
  action: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.trim() === groupName;

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Delete group"
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--negative)] hover:text-[var(--negative)]"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <Modal title="Delete group" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--muted)]">
              This permanently deletes <span className="font-medium text-white">{groupName}</span>, along with all
              of its expenses, settlements, and members. This cannot be undone.
            </p>
            <p className="text-sm text-[var(--muted)]">
              Type <span className="font-medium text-white">{groupName}</span> to confirm.
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={groupName}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--negative)]"
            />
            {error && <p className="text-sm text-[var(--negative)]">{error}</p>}
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!canDelete || pending}
                className="flex-1 rounded-[var(--radius-md)] bg-[var(--negative)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Delete group"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
