"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
import { computeSplits, toMinorUnits, toMajorUnits, validateSplitInputs, type SplitType } from "@/lib/money";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "KRW", "AUD", "CAD", "CHF", "INR"];

export interface ModalMember {
  id: string;
  name: string;
  avatarColor: string;
}
export interface ModalCategory {
  id: string;
  name: string;
  icon: string;
}

export function AddExpenseModal({
  groupId,
  members,
  categories,
  defaultCurrency,
  action,
}: {
  groupId: string;
  members: ModalMember[];
  categories: ModalCategory[];
  defaultCurrency: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [paidByMemberId, setPaidByMemberId] = useState(members[0]?.id ?? "");
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map((m) => m.id)));
  const [values, setValues] = useState<Record<string, string>>({});

  const totalMinor = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) ? toMinorUnits(n, currency) : 0;
  }, [amount, currency]);

  const participants = members.filter((m) => selected.has(m.id));

  const preview = useMemo(() => {
    if (totalMinor <= 0 || participants.length === 0) return null;
    const inputs = participants.map((m) => ({
      memberId: m.id,
      value:
        splitType === "EXACT"
          ? toMinorUnits(parseFloat(values[m.id] ?? "0") || 0, currency)
          : parseFloat(values[m.id] ?? (splitType === "SHARES" ? "1" : "0")) || 0,
    }));
    const validation = validateSplitInputs(splitType, totalMinor, inputs);
    const splits = validation.valid ? computeSplits(splitType, totalMinor, inputs) : [];
    return { validation, splits };
  }, [participants, splitType, totalMinor, values, currency]);

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(formData: FormData) {
    setError(null);
    if (preview && !preview.validation.valid) {
      setError(preview.validation.error ?? "Invalid split");
      return;
    }
    startTransition(async () => {
      try {
        await action(formData);
        setOpen(false);
        setDescription("");
        setAmount("");
        setValues({});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        <Plus className="h-4 w-4" />
        Add expense
      </button>

      {open && (
        <Modal title="Add expense" onClose={() => setOpen(false)} width="max-w-lg">
          <form action={submit} className="flex flex-col gap-3">
            <input type="hidden" name="splitType" value={splitType} />
            <input
              name="description"
              required
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />

            <div className="flex gap-2">
              <input
                name="amount"
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {currency !== defaultCurrency && (
              <p className="text-xs text-[var(--muted-2)]">
                Will be converted to {defaultCurrency} using live exchange rates when saved.
              </p>
            )}

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--muted)]">Paid by</label>
              <select
                name="paidByMemberId"
                value={paidByMemberId}
                onChange={(e) => setPaidByMemberId(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="button"
              onClick={() => setAdvanced((a) => !a)}
              className="flex items-center gap-1 self-start text-xs font-medium text-[var(--muted)] hover:text-white"
            >
              {advanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {advanced ? "Split equally" : "Split unequally"}
            </button>

            {advanced && (
              <div className="flex gap-1 rounded-[var(--radius-sm)] bg-[var(--background)] p-1 text-xs">
                {(["EQUAL", "EXACT", "PERCENT", "SHARES"] as SplitType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSplitType(t)}
                    className={`flex-1 rounded-[6px] py-1.5 font-medium transition-colors ${
                      splitType === t ? "bg-[var(--surface-hover)] text-white" : "text-[var(--muted)]"
                    }`}
                  >
                    {t === "EQUAL" ? "Equal" : t === "EXACT" ? "Exact" : t === "PERCENT" ? "Percent" : "Shares"}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] p-2">
              {members.map((m) => {
                const isSelected = selected.has(m.id);
                const split = preview?.splits.find((s) => s.memberId === m.id);
                return (
                  <div key={m.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      name="participantId"
                      value={m.id}
                      checked={isSelected}
                      onChange={() => toggleMember(m.id)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <Avatar name={m.name} color={m.avatarColor} size={24} />
                    <span className="flex-1 truncate text-sm">{m.name}</span>
                    {isSelected && advanced && splitType !== "EQUAL" ? (
                      <input
                        name="participantValue"
                        type="number"
                        step={splitType === "SHARES" ? "1" : "0.01"}
                        placeholder={splitType === "PERCENT" ? "%" : splitType === "SHARES" ? "shares" : "0.00"}
                        value={values[m.id] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value }))}
                        className="w-20 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-right text-sm outline-none focus:border-[var(--accent)]"
                      />
                    ) : (
                      isSelected && (
                        <>
                          <input type="hidden" name="participantValue" value="" />
                          <span className="w-20 text-right text-xs text-[var(--muted)]">
                            {split ? toMajorUnits(split.amount, currency).toFixed(2) : ""}
                          </span>
                        </>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {preview && !preview.validation.valid && (
              <p className="text-xs text-[var(--negative)]">{preview.validation.error}</p>
            )}
            {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save expense"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
