import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Shield,
  FileText,
  MessageSquare,
  Milestone as MilestoneIcon,
  Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import EditFindingDialog from '../components/findings/EditFindingDialog';
import MilestonesTab from '../components/findings/MilestonesTab';
import EvidenceTab from '../components/findings/EvidenceTab';
import CommentsTab from '../components/findings/CommentsTab';
import MilestonesList from '../components/findings/MilestonesList';

export default function FindingDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const findingId = urlParams.get('id');

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: finding, isLoading } = useQuery({
    queryKey: ['finding', findingId],
    queryFn: () => base44.entities.Finding.list().then(findings => 
      findings.find(f => f.id === findingId)
    ),
    enabled: !!findingId,
  });

  const { data: custodyLogs = [] } = useQuery({
    queryKey: ['evidenceChainOfCustody', findingId],
    queryFn: async () => {
      const logs = await base44.entities.EvidenceChainOfCustody.filter({ finding_id: findingId });
      return logs;
    },
    enabled: !!findingId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Finding.delete(findingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      navigate(createPageUrl('Findings'));
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this finding?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading finding...</p>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Finding not found</p>
        <Link to={createPageUrl('Findings')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Findings
          </Button>
        </Link>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Low: 'bg-blue-100 text-blue-800 border-blue-200',
      Informational: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-red-50 text-red-700 border-red-200',
      'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
      'Pending Verification': 'bg-purple-50 text-purple-700 border-purple-200',
      Closed: 'bg-green-50 text-green-700 border-green-200',
      'Risk Accepted': 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const isOverdue = !['Closed', 'Risk Accepted'].includes(finding.status) && 
                    finding.due_date && 
                    new Date(finding.due_date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={createPageUrl('Findings')}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-mono text-slate-400">{finding.finding_number}</span>
              <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
              <Badge className={getStatusColor(finding.status)}>{finding.status}</Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{finding.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
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
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Risk Level</p>
                <p className="font-semibold text-slate-200">{finding.risk_level || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-xs text-slate-400">Assigned To</p>
                <p className="font-semibold text-slate-200">{finding.assigned_to_name || 'Unassigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">Due Date</p>
                <p className="font-semibold text-slate-200">
                  {finding.due_date ? new Date(finding.due_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-xs text-slate-400">Source</p>
                <p className="font-semibold text-slate-200">{finding.source}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Custody Summary */}
      {custodyLogs.length > 0 && (
        <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Evidence Audit Trail</p>
                  <p className="font-semibold text-slate-200">{custodyLogs.length} custody event{custodyLogs.length !== 1 ? 's' : ''} logged</p>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                <Shield className="w-3 h-3 mr-1" />
                Audit-Grade
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-200">Finding Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {finding.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
              <p className="text-slate-200 whitespace-pre-wrap">{finding.description}</p>
            </div>
          )}

          {finding.remediation_plan && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Remediation Plan</h4>
              <p className="text-slate-200 whitespace-pre-wrap">{finding.remediation_plan}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/60">
            {finding.system_name && (
              <div>
                <p className="text-xs text-slate-400">System</p>
                <p className="text-sm font-medium text-slate-200">{finding.system_name}</p>
              </div>
            )}
            {finding.control_reference && (
              <div>
                <p className="text-xs text-slate-400">Control Reference</p>
                <p className="text-sm font-medium text-slate-200">{finding.control_reference}</p>
              </div>
            )}
            {finding.vendor_dependency && (
              <div>
                <p className="text-xs text-slate-400">Vendor Dependency</p>
                <Badge variant="outline" className="border-slate-600 text-slate-300">Yes</Badge>
              </div>
            )}
            {finding.false_positive && (
              <div>
                <p className="text-xs text-slate-400">False Positive</p>
                <Badge variant="outline" className="border-slate-600 text-slate-300">Yes</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <MilestonesList findingId={findingId} findingStatus={finding.status} />

      {/* Tabs for Evidence, Comments */}
      <Tabs defaultValue="evidence" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evidence">
            <Upload className="w-4 h-4 mr-2" />
            Evidence
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evidence">
          <EvidenceTab findingId={findingId} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsTab findingId={findingId} />
        </TabsContent>
      </Tabs>

      <EditFindingDialog
        finding={finding}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />
    </div>
  );
}