import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function MilestoneStatusBadge({ status }) {
  const configs = {
    'NOT_STARTED': {
      icon: Circle,
      className: 'bg-slate-700/50 text-slate-300 border-slate-600',
      label: 'Not Started'
    },
    'IN_PROGRESS': {
      icon: RefreshCw,
      className: 'bg-blue-900/50 text-blue-200 border-blue-700',
      label: 'In Progress'
    },
    'COMPLETED': {
      icon: CheckCircle,
      className: 'bg-green-900/50 text-green-200 border-green-700',
      label: 'Completed'
    },
    'BLOCKED': {
      icon: AlertCircle,
      className: 'bg-red-900/50 text-red-200 border-red-700',
      label: 'Blocked'
    }
  };

  const config = configs[status] || configs['NOT_STARTED'];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}