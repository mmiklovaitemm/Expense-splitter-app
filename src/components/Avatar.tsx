function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  color,
  size = 28,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.38,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({
  members,
  max = 4,
}: {
  members: { name: string; avatarColor: string }[];
  max?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <div key={i} className="rounded-full ring-2 ring-[var(--background)]">
          <Avatar name={m.name} color={m.avatarColor} size={26} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-[var(--surface-hover)] text-xs font-medium text-[var(--muted)] ring-2 ring-[var(--background)]"
          style={{ width: 26, height: 26 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
