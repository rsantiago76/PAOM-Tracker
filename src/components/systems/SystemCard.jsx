import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import EditSystemDialog from './EditSystemDialog';

export default function SystemCard({ system, findings }) {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.System.delete(system.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
    },
  });

  const handleDelete = () => {
    if (findings.length > 0) {
      alert(`Cannot delete system with ${findings.length} associated findings. Please reassign or delete findings first.`);
      return;
    }
    if (window.confirm(`Delete system "${system.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  const getCriticalityColor = (criticality) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[criticality] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      'In Development': 'bg-blue-100 text-blue-800 border-blue-200',
      Decommissioned: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const openFindings = findings.filter(f => f.status !== 'Closed');
  const criticalFindings = findings.filter(f => f.severity === 'Critical' && f.status !== 'Closed');

  return (
    <>
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Server className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-lg text-slate-200">{system.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getCriticalityColor(system.criticality)}>
                    {system.criticality}
                  </Badge>
                  <Badge className={getStatusColor(system.status)}>
                    {system.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {system.description && (
            <p className="text-sm text-slate-300 mb-4 line-clamp-2">{system.description}</p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Findings:</span>
              <span className="font-semibold text-slate-200">{findings.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Open Findings:</span>
              <span className="font-semibold text-slate-200">{openFindings.length}</span>
            </div>
            {criticalFindings.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Critical:
                </span>
                <span className="font-semibold text-red-400">{criticalFindings.length}</span>
              </div>
            )}
          </div>

          {system.owner_email && (
            <p className="text-xs text-slate-400 mb-4">Owner: {system.owner_email}</p>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditSystemDialog
        system={system}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />
    </>
  );
}