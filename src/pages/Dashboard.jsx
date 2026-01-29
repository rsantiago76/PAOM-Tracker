import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Server,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Dashboard() {
  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      const { data } = await client.models.Finding.list();
      return data.map(f => ({
        ...f,
        finding_number: f.findingNumber,
        due_date: f.dueDate,
        actual_closure_date: f.actualClosureDate,
        system_name: f.systemName,
        // Ensure status/severity are correct casing if needed, but schema matches typical UI usage
      }));
    },
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const { data } = await client.models.System.list();
      return data.map(s => ({
        ...s,
        // Dashboard uses s.status in line 190. Systems.jsx used s.active_status.
        // We'll map activeStatus to both to be safe.
        status: s.activeStatus,
        active_status: s.activeStatus,
        created_date: s.createdAt,
      }));
    },
  });

  // Calculate metrics
  const openFindings = findings.filter(f => f.status === 'Open' || f.status === 'In Progress');
  const criticalFindings = findings.filter(f => f.severity === 'Critical' && f.status !== 'Closed');
  const overdue = findings.filter(f => {
    if (f.status === 'Closed') return false;
    if (!f.due_date) return false;
    return new Date(f.due_date) < new Date();
  });
  const closedThisMonth = findings.filter(f => {
    if (!f.actual_closure_date) return false;
    const closureDate = new Date(f.actual_closure_date);
    const now = new Date();
    return closureDate.getMonth() === now.getMonth() &&
      closureDate.getFullYear() === now.getFullYear();
  });

  // Severity breakdown
  const severityBreakdown = {
    Critical: findings.filter(f => f.severity === 'Critical' && f.status !== 'Closed').length,
    High: findings.filter(f => f.severity === 'High' && f.status !== 'Closed').length,
    Medium: findings.filter(f => f.severity === 'Medium' && f.status !== 'Closed').length,
    Low: findings.filter(f => f.severity === 'Low' && f.status !== 'Closed').length,
  };

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <div className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Open Findings
            </CardTitle>
            <AlertTriangle className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{openFindings.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              {findings.length} total findings
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Critical/High
            </CardTitle>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{criticalFindings.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Overdue
            </CardTitle>
            <Clock className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{overdue.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              Past target closure date
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Closed This Month
            </CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{closedThisMonth.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Remediation progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-200">
              <AlertTriangle className="w-5 h-5 mr-2 text-slate-300" />
              Open Findings by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(severityBreakdown).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getSeverityColor(severity)}>
                    {severity}
                  </Badge>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2 w-32">
                    <div
                      className={`h-2 rounded-full ${severity === 'Critical' ? 'bg-red-500' :
                        severity === 'High' ? 'bg-orange-500' :
                          severity === 'Medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                        }`}
                      style={{
                        width: `${openFindings.length > 0 ? (count / openFindings.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-200">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Systems Overview */}
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-200">
              <Server className="w-5 h-5 mr-2 text-slate-300" />
              Systems Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Systems</span>
                <span className="text-2xl font-bold text-slate-100">{systems.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Active Systems</span>
                <span className="text-xl font-semibold text-slate-100">
                  {systems.filter(s => s.status === 'Active').length}
                </span>
              </div>
              <Link
                to={createPageUrl('Systems')}
                className="block text-center mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm"
              >
                View All Systems →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent High Priority Findings */}
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-200">
            <span className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-300" />
              Recent High Priority Findings
            </span>
            <Link
              to={createPageUrl('Findings')}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              View All →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {findings
              .filter(f => ['Critical', 'High'].includes(f.severity) && f.status !== 'Closed')
              .slice(0, 5)
              .map((finding) => (
                <Link
                  key={finding.id}
                  to={createPageUrl(`FindingDetail?id=${finding.id}`)}
                  className="block p-4 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors border border-slate-700/60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getSeverityColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">{finding.status}</Badge>
                        <span className="text-xs text-slate-400">{finding.finding_number}</span>
                      </div>
                      <h4 className="font-semibold text-slate-200 mb-1">{finding.title}</h4>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        {finding.system_name && (
                          <span className="flex items-center">
                            <Server className="w-3 h-3 mr-1" />
                            {finding.system_name}
                          </span>
                        )}
                        {finding.due_date && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due: {new Date(finding.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            {findings.filter(f => ['Critical', 'High'].includes(f.severity) && f.status !== 'Closed').length === 0 && (
              <p className="text-center text-slate-400 py-8">No high priority findings</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}