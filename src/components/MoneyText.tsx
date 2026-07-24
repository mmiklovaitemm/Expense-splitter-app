import clsx from "clsx";
import { formatMoney } from "@/lib/money";

export function MoneyText({
  minor,
  currency,
  colorize = false,
  className,
}: {
  minor: number;
  currency: string;
  colorize?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        className,
        colorize && minor > 0 && "text-[var(--positive)]",
        colorize && minor < 0 && "text-[var(--negative)]"
      )}
    >
      {formatMoney(minor, currency)}
    </span>
  );
}
