"use client";

import { useEffect, useState, useTransition } from "react";
import { HandCoins } from "lucide-react";
import { Modal } from "./Modal";
import { toMajorUnits } from "@/lib/money";

export interface ModalMember {
  id: string;
  name: string;
  avatarColor: string;
}

export function SettleUpModal({
  members,
  currency,
  action,
  prefill,
  trigger,
}: {
  members: ModalMember[];
  currency: string;
  action: (formData: FormData) => Promise<void>;
  prefill?: { fromMemberId: string; toMemberId: string; amountMinor: number } | null;
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fromMemberId, setFromMemberId] = useState(prefill?.fromMemberId ?? members[0]?.id ?? "");
  const [toMemberId, setToMemberId] = useState(prefill?.toMemberId ?? members[1]?.id ?? "");
  const [amount, setAmount] = useState(prefill ? toMajorUnits(prefill.amountMinor, currency).toFixed(2) : "");

  useEffect(() => {
    if (prefill) {
      setFromMemberId(prefill.fromMemberId);
      setToMemberId(prefill.toMemberId);
      setAmount(toMajorUnits(prefill.amountMinor, currency).toFixed(2));
    }
  }, [prefill, currency]);

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
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
        >
          <HandCoins className="h-4 w-4" />
          Settle up
        </button>
      )}

      {open && (
        <Modal title="Record a settlement" onClose={() => setOpen(false)}>
          <form action={submit} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <select
                name="fromMemberId"
                value={fromMemberId}
                onChange={(e) => setFromMemberId(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-[var(--muted)]">paid</span>
              <select
                name="toMemberId"
                value={toMemberId}
                onChange={(e) => setToMemberId(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">{currency}</span>
              <input
                name="amount"
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <input
              name="note"
              placeholder="Note (optional)"
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />

            {fromMemberId === toMemberId && (
              <p className="text-xs text-[var(--negative)]">Choose two different people.</p>
            )}
            {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

            <button
              type="submit"
              disabled={pending || fromMemberId === toMemberId}
              className="mt-1 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {pending ? "Recording…" : "Record settlement"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
