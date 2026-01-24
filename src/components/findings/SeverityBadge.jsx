import React from 'react';

export default function SeverityBadge({ severity }) {
  const s = (severity || "").toUpperCase();

  const styles = {
    CRITICAL: "border-red-300 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30",
    HIGH: "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30",
    MEDIUM: "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
    LOW: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30",
    INFORMATIONAL: "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30",
    DEFAULT: "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30",
  };

  const cls = styles[s] || styles.DEFAULT;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {s || "UNKNOWN"}
    </span>
  );
}