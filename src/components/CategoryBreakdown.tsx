"use client";

import { useLayoutEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import gsap from "gsap";
import { formatMoney } from "@/lib/money";

const COLORS = ["#6d5efc", "#34d399", "#fbbf24", "#fb7185", "#38bdf8", "#a78bfa", "#f472b6", "#4ade80"];

export function CategoryBreakdown({
  data,
  currency,
}: {
  data: { name: string; amount: number }[];
  currency: string;
}) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  // Recharts' own JS-driven Pie animation isn't reliable across environments
  // (rAF can be throttled/never fire), so the visible entrance here is a
  // plain GSAP transform on the chart's wrapping element instead — the same
  // mechanism already used for page/modal transitions, which is guaranteed
  // to actually paint.
  useLayoutEffect(() => {
    if (total === 0 || !chartWrapRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set(chartWrapRef.current, { opacity: 0, scale: 0.4, rotate: -90, transformOrigin: "50% 50%" });
      gsap.to(chartWrapRef.current, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: 0.85,
        ease: "back.out(1.6)",
        // A lingering inline `transform` (even at identity values) creates a
        // new CSS containing block, which throws off Recharts' Tooltip
        // positioning. Strip the inline styles once the animation settles.
        clearProps: "transform,opacity,transformOrigin",
      });

      if (legendRef.current) {
        const rows = Array.from(legendRef.current.children);
        gsap.set(rows, { opacity: 0, x: -8 });
        gsap.to(rows, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", stagger: 0.06, delay: 0.35 });
      }
    });
    return () => ctx.revert();
  }, [total]);

  if (total === 0) return null;

  return (
    <div className="card p-5">
      <div className="mb-3 text-sm font-medium">Spending by category</div>
      <div className="flex items-center gap-4">
        <div ref={chartWrapRef} className="h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={data.length > 1 ? 2 : 0}
                isAnimationActive={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(Number(value ?? 0), currency)}
                labelFormatter={() => ""}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div ref={legendRef} className="min-w-0 flex-1 space-y-1.5">
          {data
            .slice()
            .sort((a, b) => b.amount - a.amount)
            .map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: COLORS[data.indexOf(d) % COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-[var(--muted)]">{d.name}</span>
                <span className="font-medium">{formatMoney(d.amount, currency)}</span>
                <span className="w-10 text-right text-[var(--muted-2)]">
                  {((d.amount / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
