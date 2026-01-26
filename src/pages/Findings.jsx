import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Calendar, AlertTriangle, Loader2, AlertCircle, RefreshCw, FileUp } from 'lucide-react';
import CreateFindingDialog from '../components/findings/CreateFindingDialog';
import SeverityBadge from '../components/findings/SeverityBadge';
import StatusBadge from '../components/findings/StatusBadge';
import MilestoneProgressBar from '../components/findings/MilestoneProgressBar';
import MilestoneHealthIndicator from '../components/findings/MilestoneHealthIndicator';

export default function Findings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: findings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      // Fetch findings with proper sorting: severity desc, due_date asc, updated_date desc
      const severityOrder = { 'Critical': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Informational': 1 };
      const allFindings = await base44.entities.Finding.list('-updated_date', 50);

      return allFindings.sort((a, b) => {
        // 1. Sort by severity (desc)
        const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        if (severityDiff !== 0) return severityDiff;

        // 2. Sort by due_date (asc) - nulls last
        if (a.due_date && b.due_date) {
          const dateDiff = new Date(a.due_date) - new Date(b.due_date);
          if (dateDiff !== 0) return dateDiff;
        } else if (a.due_date) return -1;
        else if (b.due_date) return 1;

        // 3. Sort by updated_date (desc)
        return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
      });
    },
    retry: 1,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  const glassPanel = "bg-slate-900/45 border border-slate-700/60 rounded-2xl shadow-md backdrop-blur";
  const glassTableShell = "bg-slate-900/35 border border-slate-700/60 rounded-2xl shadow-md overflow-hidden backdrop-blur";
  const glassThead = "bg-slate-900/55 border-b border-slate-700/60";
  const glassRow = "border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors";
  const cellText = "text-slate-200";
  const cellMuted = "text-slate-400";

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = finding.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.finding_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || finding.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || finding.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Findings</h1>
          <p className="text-slate-300 mt-1">Manage your POA&M items and track remediation</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Finding
        </Button>
      </div>

      {/* Filters */}
      <div className={glassPanel}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Closed">Closed</option>
              <option value="Risk Accepted">Risk Accepted</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      {isLoading ? (
        <div className={glassPanel}>
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading findings...</p>
          </div>
        </div>
      ) : error ? (
        <div className={glassPanel}>
          <div className="py-16 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-300 text-lg font-semibold mb-2">Failed to load findings</p>
            <p className="text-slate-400 text-sm mb-6 max-w-md text-center">{error.message || 'An error occurred while fetching findings'}</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : findings.length === 0 ? (
        <div className={glassPanel}>
          <div className="py-16 flex flex-col items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-slate-500 mb-4" />
            <p className="text-slate-300 text-lg font-semibold mb-2">No findings yet</p>
            <p className="text-slate-400 text-sm mb-6">Get started by creating your first finding or importing data</p>
            <div className="flex gap-3">
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Finding
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800/50">
                <FileUp className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className={glassPanel}>
          <div className="py-12 text-center">
            <p className="text-slate-400 mb-4">No findings match your filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSeverityFilter('all');
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className={glassTableShell}>
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Findings</h2>
            <div className="text-xs text-slate-400">Showing 1–{filteredFindings.length}</div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className={glassThead}>
                <tr>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">ID</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">Title</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">System</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">Severity</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">Status</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">Milestones</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">Assigned</th>
                  <th className="text-left font-semibold text-slate-200 px-4 py-3">Due Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredFindings.map((finding) => {
                  const findingMilestones = milestones.filter(m => m.finding_id === finding.id);
                  const completedMilestones = findingMilestones.filter(m => m.status === 'COMPLETED').length;

                  // Calculate milestone health for this finding
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const sevenDaysFromNow = new Date(today);
                  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

                  const hasOverdue = findingMilestones.some(m => {
                    if (m.status === 'COMPLETED' || !m.due_date) return false;
                    const dueDate = new Date(m.due_date);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate < today;
                  });

                  const hasDueSoon = !hasOverdue && findingMilestones.some(m => {
                    if (m.status === 'COMPLETED' || !m.due_date) return false;
                    const dueDate = new Date(m.due_date);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate >= today && dueDate <= sevenDaysFromNow;
                  });

                  return (
                    <tr
                      key={finding.id}
                      className={glassRow}
                      onClick={() => window.location.href = createPageUrl(`FindingDetail?id=${finding.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`px-4 py-3 ${cellMuted} font-mono text-xs`}>
                        {finding.finding_number}
                      </td>
                      <td className={`px-4 py-3 ${cellText} font-medium`}>
                        {finding.title}
                        {finding.due_date && new Date(finding.due_date) < new Date() && finding.status !== 'Closed' && (
                          <AlertTriangle className="inline w-3 h-3 ml-2 text-red-400" />
                        )}
                      </td>
                      <td className={`px-4 py-3 ${cellMuted}`}>
                        {finding.system_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={finding.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={finding.status} />
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">
                        {findingMilestones.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-300">
                                {completedMilestones} of {findingMilestones.length} completed
                              </span>
                              {hasOverdue && (
                                <Badge className="bg-red-900/50 text-red-200 border-red-700 text-[10px] px-1.5 py-0">
                                  At Risk
                                </Badge>
                              )}
                              {hasDueSoon && (
                                <Badge className="bg-amber-900/50 text-amber-200 border-amber-700 text-[10px] px-1.5 py-0">
                                  Due Soon
                                </Badge>
                              )}
                            </div>
                            <MilestoneProgressBar
                              completed={completedMilestones}
                              total={findingMilestones.length}
                              compact
                            />
                          </div>
                        ) : (
                          <span className={cellMuted}>—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${cellMuted}`}>
                        {finding.assigned_to_name || 'Unassigned'}
                      </td>
                      <td className={`px-4 py-3 ${cellMuted}`}>
                        {finding.due_date ? new Date(finding.due_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateFindingDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
