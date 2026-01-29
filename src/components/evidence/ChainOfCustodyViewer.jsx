import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Upload, Eye, Download, CheckCircle, AlertTriangle,
  Edit, Trash2, RefreshCw, Calendar, User, Hash, FileText
} from 'lucide-react';

const actionIcons = {
  UPLOADED: Upload,
  VIEWED: Eye,
  DOWNLOADED: Download,
  VERIFIED: CheckCircle,
  HASH_MISMATCH_DETECTED: AlertTriangle,
  METADATA_UPDATED: Edit,
  DELETED: Trash2,
  RESTORED: RefreshCw,
};

const actionColors = {
  UPLOADED: 'bg-blue-900/50 text-blue-200 border-blue-700',
  VIEWED: 'bg-slate-700/50 text-slate-300 border-slate-600',
  DOWNLOADED: 'bg-purple-900/50 text-purple-200 border-purple-700',
  VERIFIED: 'bg-green-900/50 text-green-200 border-green-700',
  HASH_MISMATCH_DETECTED: 'bg-red-900/50 text-red-200 border-red-700',
  METADATA_UPDATED: 'bg-amber-900/50 text-amber-200 border-amber-700',
  DELETED: 'bg-red-900/50 text-red-200 border-red-700',
  RESTORED: 'bg-green-900/50 text-green-200 border-green-700',
};

export default function ChainOfCustodyViewer({ evidenceId, findingId, compact = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: custodyLogs = [], isLoading } = useQuery({
    queryKey: ['evidenceChainOfCustody', evidenceId],
    queryFn: async () => {
      // Use list with filter if supported or filter client side. Schema has evidenceId field.
      const { data } = await client.models.EvidenceChainOfCustody.list();
      return data
        .filter(log => log.evidenceId === evidenceId)
        .map(log => ({
          ...log,
          action_at: log.actionAt,
          actor_name: log.actorName,
          actor_role: log.actorRole,
          hash_snapshot_sha256: log.hashSnapshotSha256,
          // other fields map 1:1 or as needed
        }))
        .sort((a, b) => new Date(b.action_at) - new Date(a.action_at));
    },
    enabled: !!evidenceId,
  });

  const filteredLogs = custodyLogs.filter(log => {
    const matchesSearch =
      log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (isLoading) {
    return <div className="text-slate-400 text-sm">Loading chain of custody...</div>;
  }

  if (compact) {
    return (
      <div className="text-xs text-slate-400">
        {custodyLogs.length} custody event{custodyLogs.length !== 1 ? 's' : ''} logged
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Chain of Custody
        </CardTitle>

        {custodyLogs.length > 5 && (
          <div className="mt-3 flex gap-3">
            <Input
              placeholder="Search by user or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-800/50 border-slate-700 text-slate-200 text-sm"
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-sm text-slate-200"
            >
              <option value="all">All Actions</option>
              <option value="UPLOADED">Uploaded</option>
              <option value="VIEWED">Viewed</option>
              <option value="DOWNLOADED">Downloaded</option>
              <option value="VERIFIED">Verified</option>
              <option value="HASH_MISMATCH_DETECTED">Hash Mismatch</option>
              <option value="METADATA_UPDATED">Metadata Updated</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No custody events recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const Icon = actionIcons[log.action] || FileText;
              const isAlert = log.action === 'HASH_MISMATCH_DETECTED' || log.action === 'DELETED';

              return (
                <div
                  key={log.id}
                  className={`bg-slate-800/40 rounded-lg p-4 border ${isAlert ? 'border-red-700/60' : 'border-slate-700/60'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={actionColors[log.action] || 'bg-slate-700/50 text-slate-300'}>
                        <Icon className="w-3 h-3 mr-1" />
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.action_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-3 h-3" />
                      <span className="font-medium">{log.actor_name || 'Unknown User'}</span>
                      {log.actor_role && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {log.actor_role}
                        </Badge>
                      )}
                    </div>

                    {log.hash_snapshot_sha256 && (
                      <div className="flex items-center gap-2 text-slate-400 font-mono">
                        <Hash className="w-3 h-3" />
                        <span className="text-[10px]">{log.hash_snapshot_sha256.substring(0, 16)}...</span>
                      </div>
                    )}

                    {log.notes && (
                      <div className="mt-2 p-2 bg-slate-900/50 rounded text-slate-300 border-l-2 border-slate-600">
                        {log.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}