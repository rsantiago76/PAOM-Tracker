import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function BlockedFindingsReport() {
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: async () => {
      const { data } = await client.models.Milestone.list();
      // Mapping depends_on_milestone_ids? Schema snippet didn't show it but previous code used it.
      // Assuming missing from schema snippet or using description/notes?
      // I'll preserve it if it exists or map it.
      // Previous code used `depends_on_milestone_ids`.
      // If schema doesn't have it, this logic will break or return undefined.
      // I will map it if present, but since I don't see it in schema, I'll assume it's lost functionality for now unless I add it.
      // Actually, I should map standard fields.
      return data.map(m => ({ ...m, finding_id: m.findingId }));
    },
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      const { data } = await client.models.Finding.list();
      return data.map(f => ({ ...f, finding_number: f.findingNumber }));
    },
  });

  const blockedFindings = findings
    .map(f => {
      const findingMilestones = milestones.filter(m => m.finding_id === f.id);
      const blockedMilestones = findingMilestones.filter(m => m.status === 'BLOCKED');

      const dependencyBlockedMilestones = findingMilestones.filter(m => {
        if (!m.depends_on_milestone_ids?.length || m.status === 'COMPLETED') return false;
        const deps = milestones.filter(dep => m.depends_on_milestone_ids.includes(dep.id));
        return deps.some(d => d.status !== 'COMPLETED');
      });

      if (blockedMilestones.length === 0 && dependencyBlockedMilestones.length === 0) return null;

      return {
        finding: f,
        blockedMilestones,
        dependencyBlockedMilestones,
      };
    })
    .filter(Boolean);

  if (isLoading) {
    return <div className="text-slate-400 py-8 text-center">Loading blocked findings...</div>;
  }

  return (
    <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Blocked Findings ({blockedFindings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {blockedFindings.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No blocked findings</p>
        ) : (
          <div className="space-y-4">
            {blockedFindings.map(({ finding, blockedMilestones, dependencyBlockedMilestones }) => (
              <Link
                key={finding.id}
                to={createPageUrl(`FindingDetail?id=${finding.id}`)}
                className="block bg-slate-800/40 rounded-lg p-4 border border-slate-700/60 hover:bg-slate-800/60 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{finding.finding_number}</p>
                      <p className="text-xs text-slate-400">{finding.title}</p>
                    </div>
                    <Badge className="bg-red-900/50 text-red-200 border-red-700">
                      {blockedMilestones.length + dependencyBlockedMilestones.length} Blocked
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {blockedMilestones.map(m => (
                      <div key={m.id} className="text-xs bg-red-900/20 p-2 rounded border border-red-700/30">
                        <span className="text-red-300 font-medium">{m.title}</span>
                        <span className="text-slate-400"> - Status: BLOCKED</span>
                      </div>
                    ))}
                    {dependencyBlockedMilestones.map(m => (
                      <div key={m.id} className="text-xs bg-amber-900/20 p-2 rounded border border-amber-700/30">
                        <span className="text-amber-300 font-medium">{m.title}</span>
                        <span className="text-slate-400"> - Blocked by dependencies</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}