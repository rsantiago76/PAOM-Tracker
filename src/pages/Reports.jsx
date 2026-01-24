import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, TrendingDown, AlertCircle, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MilestoneHealthDashboard from '../components/reports/MilestoneHealthDashboard';
import BlockedFindingsReport from '../components/reports/BlockedFindingsReport';
import SARPOAMExport from '../components/reports/SARPOAMExport';

export default function Reports() {
  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: () => base44.entities.Finding.list(),
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: () => base44.entities.System.list(),
  });

  // Calculate metrics
  const openFindings = findings.filter(f => f.status !== 'Closed' && f.status !== 'Risk Accepted');
  
  const severityData = [
    { name: 'Critical', count: findings.filter(f => f.severity === 'Critical' && f.status !== 'Closed').length, color: '#dc2626' },
    { name: 'High', count: findings.filter(f => f.severity === 'High' && f.status !== 'Closed').length, color: '#f59e0b' },
    { name: 'Medium', count: findings.filter(f => f.severity === 'Medium' && f.status !== 'Closed').length, color: '#eab308' },
    { name: 'Low', count: findings.filter(f => f.severity === 'Low' && f.status !== 'Closed').length, color: '#3b82f6' },
  ];

  const statusData = [
    { name: 'Open', count: findings.filter(f => f.status === 'Open').length },
    { name: 'In Progress', count: findings.filter(f => f.status === 'In Progress').length },
    { name: 'Pending', count: findings.filter(f => f.status === 'Pending Verification').length },
    { name: 'Closed', count: findings.filter(f => f.status === 'Closed').length },
  ];

  // Calculate risk score based on severity
  const getRiskScore = (severity) => {
    const scores = { 'Critical': 10, 'High': 7, 'Medium': 4, 'Low': 2, 'Informational': 1 };
    return scores[severity] || 0;
  };

  // Systems with most open findings (including "In Progress")
  const systemsWithFindings = systems
    .map(sys => {
      const openFindings = findings.filter(f => 
        f.system_id === sys.id && 
        (f.status === 'Open' || f.status === 'In Progress')
      );
      
      return {
        id: sys.id,
        name: sys.name,
        displayName: sys.name.length > 25 ? sys.name.substring(0, 25) + '...' : sys.name,
        open_findings_count: openFindings.length,
        total_risk_score: openFindings.reduce((sum, f) => sum + getRiskScore(f.severity), 0),
      };
    })
    .filter(sys => sys.open_findings_count > 0) // Only systems with open findings
    .sort((a, b) => {
      // Sort by open findings count DESC, then by total risk score DESC
      if (b.open_findings_count !== a.open_findings_count) {
        return b.open_findings_count - a.open_findings_count;
      }
      return b.total_risk_score - a.total_risk_score;
    })
    .slice(0, 5);

  const overdue = findings.filter(f => {
    if (f.status === 'Closed' || f.status === 'Risk Accepted') return false;
    if (!f.due_date) return false;
    return new Date(f.due_date) < new Date();
  });

  const exportReport = () => {
    const csvContent = [
      ['Finding Number', 'Title', 'Severity', 'Status', 'System', 'Due Date', 'Assigned To'].join(','),
      ...findings.map(f => [
        f.finding_number,
        `"${f.title}"`,
        f.severity,
        f.status,
        f.system_name || '',
        f.due_date || '',
        f.assigned_to_name || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poam-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Reports & Analytics</h1>
          <p className="text-slate-300 mt-1">Compliance and risk overview</p>
        </div>
        <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="summary" className="data-[state=active]:bg-slate-700">
            Summary
          </TabsTrigger>
          <TabsTrigger value="milestone-health" className="data-[state=active]:bg-slate-700">
            Milestone Health
          </TabsTrigger>
          <TabsTrigger value="blocked-findings" className="data-[state=active]:bg-slate-700">
            Blocked Findings
          </TabsTrigger>
          <TabsTrigger value="sar-poam" className="data-[state=active]:bg-slate-700">
            SAR / POA&M Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Total Findings</p>
              <p className="text-4xl font-bold text-slate-100">{findings.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Open</p>
              <p className="text-4xl font-bold text-blue-400">{openFindings.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Overdue</p>
              <p className="text-4xl font-bold text-red-400">{overdue.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Closure Rate</p>
              <p className="text-4xl font-bold text-green-400">
                {findings.length > 0 ? Math.round((findings.filter(f => f.status === 'Closed').length / findings.length) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-200">Open Findings by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-200">Findings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Systems */}
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-200">Systems with Most Open Findings</CardTitle>
        </CardHeader>
        <CardContent>
          {systemsWithFindings.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No systems with open findings</p>
              <div className="flex gap-3 justify-center">
                <Link to={createPageUrl('Findings')}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Finding
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {systemsWithFindings.map((system) => (
                <Link
                  key={system.id}
                  to={createPageUrl(`Findings`)}
                  className="block p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-100">{system.name}</h4>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Open Findings:</span>
                          <Badge className="bg-red-500/20 text-red-200 border-red-500/30">
                            {system.open_findings_count}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Risk Score:</span>
                          <Badge className="bg-orange-500/20 text-orange-200 border-orange-500/30">
                            {system.total_risk_score}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Findings */}
      {overdue.length > 0 && (
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" />
              Overdue Findings ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdue.map(finding => (
                <div key={finding.id} className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg border border-red-700/40">
                  <div>
                    <p className="font-medium text-slate-200">{finding.finding_number}</p>
                    <p className="text-sm text-slate-300">{finding.title}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-900/40 text-red-300 border-red-700/50">{finding.severity}</Badge>
                    <p className="text-xs text-slate-400 mt-1">
                      Due: {new Date(finding.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="milestone-health" className="space-y-6 mt-6">
          <MilestoneHealthDashboard />
        </TabsContent>

        <TabsContent value="blocked-findings" className="space-y-6 mt-6">
          <BlockedFindingsReport />
        </TabsContent>

        <TabsContent value="sar-poam" className="space-y-6 mt-6">
          <SARPOAMExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}