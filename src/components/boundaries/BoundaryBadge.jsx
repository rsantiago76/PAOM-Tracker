import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function BoundaryBadge({ boundary, showCategory = true }) {
  if (!boundary) return null;

  const isExternal = boundary.boundary_category === 'EXTERNAL';

  const categoryColors = {
    PROD: 'bg-red-900/50 text-red-200 border-red-700',
    NON_PROD: 'bg-blue-900/50 text-blue-200 border-blue-700',
    SHARED: 'bg-purple-900/50 text-purple-200 border-purple-700',
    EXTERNAL: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  };

  const categoryLabel = {
    PROD: 'PROD',
    NON_PROD: 'Non-Prod',
    SHARED: 'Shared',
    EXTERNAL: 'EXTERNAL',
  };

  const authStatusColors = {
    AUTHORIZED: 'bg-green-900/50 text-green-200 border-green-700',
    CONDITIONAL: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',
    NOT_AUTHORIZED: 'bg-red-900/50 text-red-200 border-red-700',
  };

  if (isExternal && showCategory) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${categoryColors.EXTERNAL} flex items-center gap-1.5 cursor-help`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold tracking-wider">EXTERNAL</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900/90 border border-slate-700/60 text-slate-100 max-w-xs">
            <p className="font-semibold mb-1">External Dependency</p>
            <p className="text-xs text-slate-300">
              This boundary represents third-party or external services. Moves into PROD may require compliance approval.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showCategory && (
        <Badge className={`${categoryColors[boundary.boundary_category] || categoryColors.SHARED}`}>
          {categoryLabel[boundary.boundary_category] || boundary.boundary_category}
        </Badge>
      )}
      {boundary.authorization_status && (
        <Badge className={`${authStatusColors[boundary.authorization_status] || authStatusColors.NOT_AUTHORIZED} text-xs`}>
          {boundary.authorization_status.replace('_', ' ')}
        </Badge>
      )}
    </div>
  );
}