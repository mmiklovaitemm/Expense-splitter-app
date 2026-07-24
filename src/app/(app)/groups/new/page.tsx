import { createGroupAction } from "../[id]/actions";
import { CancelButton } from "@/components/CancelButton";
import { SubmitButton } from "@/components/SubmitButton";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "KRW", "AUD", "CAD", "CHF", "INR"];

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 pt-20 md:pt-16">
      <h1 className="mb-6 text-xl font-semibold">Create a group</h1>
      <form action={createGroupAction} className="card flex flex-col gap-3 p-5">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-2)]">Group name</label>
          <input
            name="name"
            required
            placeholder="e.g. Trip to Lisbon"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-2)]">Default currency</label>
          <select
            name="defaultCurrency"
            defaultValue="USD"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-2)]">Add members (comma separated)</label>
          <input
            name="memberNames"
            placeholder="e.g. Jordan Park, Sam Rivera"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            They don&apos;t need an account &mdash; you can add or invite people any time.
          </p>
        </div>
        <div className="mt-2 flex gap-2">
          <SubmitButton
            pendingText="Creating…"
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            Create group
          </SubmitButton>
          <CancelButton />
        </div>
      </form>
    </div>
  );
}
