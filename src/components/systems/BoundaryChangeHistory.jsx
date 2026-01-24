import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRight, AlertCircle, Edit2 } from 'lucide-react';

export default function BoundaryChangeHistory({ systemId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['boundaryChangeLogs', systemId],
    queryFn: () => {
      return base44.entities.BoundaryChangeLog.filter({ system_id: systemId }, '-created_date');
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-900/45 border-slate-700/60">
        <CardContent className="py-8 text-center text-slate-400">
          Loading change history...
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-slate-900/45 border-slate-700/60">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-400">No boundary changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="bg-slate-800/30 border-slate-700/60">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Date & User */}
                <div className="flex items-center gap-3 text-sm">
                  <div>
                    <p className="text-slate-100 font-medium">{log.changed_by_name}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(log.created_date), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      log.change_source === 'SINGLE_EDIT'
                        ? 'border-blue-700/50 text-blue-300 bg-blue-500/10'
                        : 'border-purple-700/50 text-purple-300 bg-purple-500/10'
                    }
                  >
                    {log.change_source === 'SINGLE_EDIT' ? (
                      <Edit2 className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {log.change_source === 'SINGLE_EDIT' ? 'Row Edit' : 'Bulk Edit'}
                  </Badge>
                </div>

                {/* Boundary Change */}
                <div className="flex items-center gap-3 bg-slate-900/40 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Boundary Change</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-200">{log.from_boundary}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-200">{log.to_boundary}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Findings Updated</p>
                    <p className="text-lg font-bold text-blue-400">{log.findings_impacted_count}</p>
                  </div>
                </div>

                {/* Environment */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Environment:</span>
                  <Badge
                    variant="outline"
                    className={
                      log.system_environment === 'PROD'
                        ? 'border-red-700/50 text-red-300 bg-red-500/10'
                        : 'border-slate-600 text-slate-300 bg-slate-500/10'
                    }
                  >
                    {log.system_environment}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}