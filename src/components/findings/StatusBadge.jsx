import React from 'react';

export default function StatusBadge({ status }) {
  const s = status || "";

  const styles = {
    "Open": "border-red-300 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30",
    "In Progress": "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30",
    "Pending Verification": "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200 dark:border-purple-500/30",
    "Closed": "border-green-300 bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-200 dark:border-green-500/30",
    "Risk Accepted": "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30",
  };

  const cls = styles[s] || "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {s || "UNKNOWN"}
    </span>
  );
}