'use client';
import { motion } from 'motion/react';

export function BudgetGauge({
  percent = 41,
  small = false,
}: {
  percent?: number;
  small?: boolean;
}) {
  const bars = 42;
  return (
    <svg
      className={`budget-gauge ${small ? 'small' : ''}`}
      viewBox="0 0 240 140"
      aria-hidden="true"
    >
      {Array.from({ length: bars }, (_, i) => {
        const angle = ((195 + (i * 150) / (bars - 1)) * Math.PI) / 180;
        const x1 = 120 + 82 * Math.cos(angle),
          y1 = 118 + 82 * Math.sin(angle);
        const x2 = 120 + 104 * Math.cos(angle),
          y2 = 118 + 104 * Math.sin(angle);
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={
              (i / bars) * 100 < percent
                ? 'var(--gauge-active, #75864c)'
                : 'var(--gauge-rest, #dcdfce)'
            }
            strokeWidth="4.5"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.014, duration: 0.3 }}
          />
        );
      })}
      <circle cx="120" cy="116" r="4" fill="var(--gauge-active, #75864c)" />
    </svg>
  );
}
