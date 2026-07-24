import {
  Utensils,
  Train,
  Bed,
  Ticket,
  ShoppingBag,
  Zap,
  Home,
  Gift,
  Tent,
  Plane,
  Receipt,
  Wallet,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  train: Train,
  bed: Bed,
  ticket: Ticket,
  "shopping-bag": ShoppingBag,
  zap: Zap,
  home: Home,
  gift: Gift,
  tent: Tent,
  plane: Plane,
  receipt: Receipt,
  wallet: Wallet,
  settlement: ArrowLeftRight,
};

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && ICONS[icon]) || Receipt;
  return <Icon className={className} />;
}
