"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/lib/categoryIcons";
import { MoneyText } from "./MoneyText";
import { formatMoney, formatDate, toMajorUnits } from "@/lib/money";
import type { ActivityItem } from "@/lib/data";
import { AddExpenseModal, type ModalMember, type ModalCategory } from "./AddExpenseModal";

const SPLIT_LABEL: Record<string, string> = {
  EXACT: "Exact",
  PERCENT: "Percent",
  SHARES: "Shares",
};

export function ActivityRow({
  item,
  defaultCurrency,
  members,
  categories,
  updateAction,
  deleteAction,
}: {
  item: ActivityItem;
  defaultCurrency: string;
  members: ModalMember[];
  categories: ModalCategory[];
  updateAction: (expenseId: string, formData: FormData) => Promise<void>;
  deleteAction: (expenseId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deletePending, startDelete] = useTransition();

  if (item.kind === "settlement") {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--positive-bg)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--positive)]">
          <ArrowLeftRight className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">
            <span className="font-medium">{item.fromName}</span>{" "}
            <span className="text-[var(--muted)]">paid</span>{" "}
            <span className="font-medium">{item.toName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted-2)]">
            <span className="rounded-full bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
              Settlement
            </span>
            {formatDate(item.date)}
          </div>
        </div>
        <MoneyText minor={item.amount} currency={item.currency} className="text-sm font-semibold text-[var(--positive)]" />
      </div>
    );
  }

  const boundUpdate = updateAction.bind(null, item.id);

  function handleDelete() {
    if (!window.confirm(`Delete "${item.kind === "expense" ? item.description : ""}"? This cannot be undone.`)) return;
    startDelete(async () => {
      await deleteAction(item.id);
    });
  }

  return (
    <div className="rounded-[var(--radius-md)] transition-colors hover:bg-[var(--surface-hover)]">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--muted)]">
          <CategoryIcon icon={item.categoryIcon} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.description}</div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted-2)]">
            <span>{item.paidByName}</span>·
            <span>
              {formatDate(item.date)}
            </span>
            {SPLIT_LABEL[item.splitType] && (
              <span className="rounded-full bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                {SPLIT_LABEL[item.splitType]}
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-sm font-semibold">
          {formatMoney(item.originalAmount, item.originalCurrency)}
          {item.originalCurrency !== defaultCurrency && (
            <div className="text-xs font-normal text-[var(--muted-2)]">
              {formatMoney(item.convertedAmount, defaultCurrency)}
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted-2)] transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="ml-11 mr-3 mb-2 space-y-2">
          <div className="space-y-1 border-l border-[var(--border-subtle)] pl-3">
            {item.splits.map((s) => (
              <div key={s.memberId} className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>{s.memberName}{s.memberId === item.paidByMemberId ? " (paid)" : " owes"}</span>
                <span>{formatMoney(s.amount, defaultCurrency)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pl-3">
            <AddExpenseModal
              members={members}
              categories={categories}
              defaultCurrency={defaultCurrency}
              action={boundUpdate}
              title="Edit expense"
              submitLabel="Save changes"
              initial={{
                description: item.description,
                amountMajor: toMajorUnits(item.originalAmount, item.originalCurrency),
                currency: item.originalCurrency,
                categoryId: item.categoryId,
                paidByMemberId: item.paidByMemberId,
                date: item.date.toISOString().slice(0, 10),
                splitType: item.splitType as "EQUAL" | "EXACT" | "PERCENT" | "SHARES",
                participants: item.splits.map((s) => ({
                  memberId: s.memberId,
                  value:
                    item.splitType === "EXACT"
                      ? toMajorUnits(s.amount, defaultCurrency)
                      : item.splitType === "PERCENT"
                        ? s.percent ?? undefined
                        : item.splitType === "SHARES"
                          ? s.shares ?? undefined
                          : undefined,
                })),
              }}
              trigger={(open) => (
                <button
                  onClick={open}
                  className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            />
            <button
              onClick={handleDelete}
              disabled={deletePending}
              className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--negative)] hover:text-[var(--negative)] disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              {deletePending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
