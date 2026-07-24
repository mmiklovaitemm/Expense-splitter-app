import Link from "next/link";
import { FolderX } from "lucide-react";

export default function GroupNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--muted)]">
        <FolderX className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold">Group not found</h1>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
        This group may have been deleted, or you don&apos;t have access to it.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        Back to your groups
      </Link>
    </div>
  );
}
