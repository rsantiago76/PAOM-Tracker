import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoundaryChangeHistory from '../components/systems/BoundaryChangeHistory';
import BoundaryBadge from '../components/boundaries/BoundaryBadge';

export default function SystemDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const urlParams = new URLSearchParams(window.location.search);
  const systemId = urlParams.get('id');

  const { data: system, isLoading: systemLoading } = useQuery({
    queryKey: ['system', systemId],
    queryFn: async () => {
      const { data } = await client.models.System.get({ id: systemId });
      // Map fields for UI compatibility if needed (camelCase -> snake_case)
      if (data) {
        return {
          ...data,
          owner_name: data.ownerName,
          active_status: data.activeStatus,
        };
      }
      return data;
    },
    enabled: !!systemId,
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', systemId],
    queryFn: async () => {
      const { data } = await client.models.Finding.list();
      return data.map(f => ({
        ...f,
        system_id: f.systemId,
        finding_number: f.findingNumber,
        due_date: f.dueDate,
      }));
    },
    enabled: !!systemId,
  });

  const { data: boundaries = [] } = useQuery({
    queryKey: ['boundaries'],
    queryFn: async () => {
      const { data } = await client.models.Boundary.list();
      return data;
    },
  });

  const systemFindings = findings.filter(f => f.system_id === systemId);
  const openFindings = systemFindings.filter(f => f.status !== 'Closed' && f.status !== 'Risk Accepted');
  const currentBoundary = boundaries.find(b => b.name === system?.boundary);

  if (systemLoading) {
    return <div className="text-slate-400">Loading system...</div>;
  }

  if (!system) {
    return <div className="text-slate-400">System not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Systems')}>
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-100">{system.name}</h1>
          {system.acronym && <p className="text-slate-400 mt-1">{system.acronym}</p>}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="change-history" className="data-[state=active]:bg-slate-700 flex items-center gap-2">
            <History className="w-4 h-4" />
            Change History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={
                  system.environment === 'PROD' ? 'bg-red-900/50 text-red-200 border-red-700' :
                    system.environment === 'STAGE' ? 'bg-yellow-900/50 text-yellow-200 border-yellow-700' :
                      system.environment === 'TEST' ? 'bg-blue-900/50 text-blue-200 border-blue-700' :
                        'bg-green-900/50 text-green-200 border-green-700'
                }>
                  {system.environment}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Boundary</CardTitle>
              </CardHeader>
              <CardContent>
                {currentBoundary ? (
                  <BoundaryBadge boundary={currentBoundary} />
                ) : (
                  <p className="text-slate-300">{system.boundary}</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{system.owner_name || 'Unassigned'}</p>
              </CardContent>
            </Card>
          </div>

          {system.description && (
            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{system.description}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Findings ({openFindings.length} Open)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemFindings.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No findings for this system</p>
              ) : (
                <div className="space-y-3">
                  {systemFindings.map((finding) => (
                    <Link
                      key={finding.id}
                      to={createPageUrl(`FindingDetail?id=${finding.id}`)}
                      className="block p-4 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors border border-slate-700/60"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              finding.severity === 'Critical' ? 'bg-red-900/50 text-red-200 border-red-700' :
                                finding.severity === 'High' ? 'bg-orange-900/50 text-orange-200 border-orange-700' :
                                  finding.severity === 'Medium' ? 'bg-yellow-900/50 text-yellow-200 border-yellow-700' :
                                    'bg-blue-900/50 text-blue-200 border-blue-700'
                            }>
                              {finding.severity}
                            </Badge>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {finding.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-slate-200 mb-1">{finding.title}</h4>
                          <p className="text-xs text-slate-400">{finding.finding_number}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change-history" className="space-y-4">
          <BoundaryChangeHistory systemId={systemId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}