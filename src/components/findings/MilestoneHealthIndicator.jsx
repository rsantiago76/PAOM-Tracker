import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MilestoneHealthIndicator({ milestones, compact = false }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let overdueCount = 0;
  let dueSoonCount = 0;

  milestones.forEach(m => {
    if (m.status !== 'COMPLETED' && m.due_date) {
      const dueDate = new Date(m.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        overdueCount++;
      } else if (dueDate <= sevenDaysFromNow) {
        dueSoonCount++;
      }
    }
  });

  if (compact) {
    if (overdueCount > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3" />
          At risk
        </span>
      );
    }
    if (dueSoonCount > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <AlertCircle className="w-3 h-3" />
          Due soon
        </span>
      );
    }
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {overdueCount > 0 && (
        <Badge className="bg-red-900/50 text-red-200 border-red-700 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {overdueCount} Overdue
        </Badge>
      )}
      {dueSoonCount > 0 && (
        <Badge className="bg-amber-900/50 text-amber-200 border-amber-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {dueSoonCount} Due Soon
        </Badge>
      )}
    </div>
  );
}