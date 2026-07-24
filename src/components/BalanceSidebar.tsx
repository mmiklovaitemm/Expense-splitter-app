"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Avatar } from "./Avatar";
import { MoneyText } from "./MoneyText";
import { formatMoney } from "@/lib/money";
import { SettleUpModal, type ModalMember } from "./SettleUpModal";

export interface SuggestedPaymentVM {
  fromMemberId: string;
  fromName: string;
  fromColor: string;
  toMemberId: string;
  toName: string;
  toColor: string;
  amount: number;
}

export function BalanceSidebar({
  members,
  myMemberId,
  myNet,
  myPaid,
  myShare,
  currency,
  suggestedPayments,
  netByMember,
  settleAction,
}: {
  members: ModalMember[];
  myMemberId?: string;
  myNet: number;
  myPaid: number;
  myShare: number;
  currency: string;
  suggestedPayments: SuggestedPaymentVM[];
  netByMember: { memberId: string; name: string; avatarColor: string; net: number }[];
  settleAction: (formData: FormData) => Promise<void>;
}) {
  const owed = myNet > 0;
  const settled = myNet === 0;

  return (
    <div className="w-full shrink-0 space-y-4 lg:w-80">
      {myMemberId && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                settled ? "bg-[var(--surface-hover)] text-[var(--muted)]" : owed ? "bg-[var(--positive-bg)] text-[var(--positive)]" : "bg-[var(--negative-bg)] text-[var(--negative)]"
              }`}
            >
              {owed ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <span className="text-sm text-[var(--muted)]">
              {settled ? "You're all settled up" : owed ? "You are owed" : "You owe"}
            </span>
          </div>
          <div className="text-3xl font-semibold">
            <MoneyText minor={Math.abs(myNet)} currency={currency} />
          </div>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            {settled ? "in this group" : owed ? "others owe you across this group" : "you owe others in this group"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 text-sm">
            <div>
              <div className="text-xs text-[var(--muted-2)]">You paid</div>
              <div className="font-medium">{formatMoney(myPaid, currency)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted-2)]">Your share</div>
              <div className="font-medium">{formatMoney(myShare, currency)}</div>
            </div>
          </div>
        </div>
      )}

      {suggestedPayments.length > 0 && (
        <div className="card p-5">
          <div className="mb-1 text-sm font-medium">Suggested settlements</div>
          <p className="mb-3 text-xs text-[var(--muted-2)]">A minimal set of payments to square everyone up.</p>
          <div className="space-y-3">
            {suggestedPayments.map((p, i) => {
              const isMe = p.fromMemberId === myMemberId || p.toMemberId === myMemberId;
              const iAmOwed = p.toMemberId === myMemberId;
              return (
                <div key={i} className="flex items-center gap-2">
                  <Avatar name={isMe && !iAmOwed ? p.toName : p.fromName} color={isMe && !iAmOwed ? p.toColor : p.fromColor} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {isMe ? (
                        iAmOwed ? (
                          <>
                            <span className="font-medium">{p.fromName}</span> owes you
                          </>
                        ) : (
                          <>
                            You owe <span className="font-medium">{p.toName}</span>
                          </>
                        )
                      ) : (
                        <>
                          <span className="font-medium">{p.fromName}</span>{" "}
                          <span className="text-[var(--muted)]">owes</span>{" "}
                          <span className="font-medium">{p.toName}</span>
                        </>
                      )}
                    </div>
                    <MoneyText
                      minor={p.amount}
                      currency={currency}
                      colorize={isMe}
                      className={`text-xs font-semibold ${!isMe ? "text-[var(--muted)]" : ""}`}
                    />
                  </div>
                  <SettleUpModal
                    members={members}
                    currency={currency}
                    action={settleAction}
                    prefill={{ fromMemberId: p.fromMemberId, toMemberId: p.toMemberId, amountMinor: p.amount }}
                    trigger={(open) => (
                      <button
                        onClick={open}
                        className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        Record
                      </button>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="mb-3 text-sm font-medium">Member balances</div>
        <div className="space-y-2.5">
          {netByMember.map((m) => (
            <div key={m.memberId} className="flex items-center gap-2">
              <Avatar name={m.name} color={m.avatarColor} size={26} />
              <span className="flex-1 truncate text-sm">{m.name}</span>
              <MoneyText minor={m.net} currency={currency} colorize className="text-sm font-medium" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
