import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function MilestoneHealthDashboard() {
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: () => base44.entities.Finding.list(),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const overdueMillestones = milestones.filter(m => {
    if (m.status === 'COMPLETED' || !m.due_date) return false;
    const dueDate = new Date(m.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const dueSoonMilestones = milestones.filter(m => {
    if (m.status === 'COMPLETED' || !m.due_date) return false;
    const dueDate = new Date(m.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  });

  const blockedMilestones = milestones.filter(m => m.status === 'BLOCKED');

  const findingsWithOverdueMilestones = findings
    .map(f => {
      const findingMilestones = milestones.filter(m => m.finding_id === f.id);
      const overdueMilestoneCount = findingMilestones.filter(m => {
        if (m.status === 'COMPLETED' || !m.due_date) return false;
        const dueDate = new Date(m.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;
      
      return { finding: f, overdueCount: overdueMilestoneCount };
    })
    .filter(item => item.overdueCount > 0)
    .sort((a, b) => b.overdueCount - a.overdueCount)
    .slice(0, 10);

  const avgDaysOverdue = overdueMillestones.length > 0
    ? Math.round(
        overdueMillestones.reduce((sum, m) => {
          const dueDate = new Date(m.due_date);
          const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          return sum + daysDiff;
        }, 0) / overdueMillestones.length
      )
    : 0;

  if (isLoading) {
    return (
      <div className="text-slate-400 py-8 text-center">Loading milestone health...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/45 border border-red-700/40 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-xs text-slate-400">Overdue Milestones</p>
                <p className="text-2xl font-bold text-slate-200">{overdueMillestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-amber-700/40 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">Due Soon (7 days)</p>
                <p className="text-2xl font-bold text-slate-200">{dueSoonMilestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-red-700/40 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-xs text-slate-400">Blocked Milestones</p>
                <p className="text-2xl font-bold text-slate-200">{blockedMilestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Avg Days Overdue</p>
                <p className="text-2xl font-bold text-slate-200">{avgDaysOverdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Findings with Overdue Milestones */}
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-400" />
            Findings with Overdue Milestones (Top 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {findingsWithOverdueMilestones.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No findings with overdue milestones</p>
          ) : (
            <div className="space-y-3">
              {findingsWithOverdueMilestones.map(({ finding, overdueCount }) => (
                <Link
                  key={finding.id}
                  to={createPageUrl(`FindingDetail?id=${finding.id}`)}
                  className="block bg-slate-800/40 rounded-lg p-4 border border-slate-700/60 hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{finding.finding_number}</p>
                      <p className="text-xs text-slate-400">{finding.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">{overdueCount} overdue</p>
                      <p className="text-xs text-slate-400">{finding.system_name || 'No system'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}