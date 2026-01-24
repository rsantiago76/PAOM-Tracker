import React from 'react';

export default function MilestoneProgressBar({ completed, total, compact = false }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {completed}/{total}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Progress</span>
        <span className="text-slate-300 font-medium">{completed} of {total} completed</span>
      </div>
      <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}