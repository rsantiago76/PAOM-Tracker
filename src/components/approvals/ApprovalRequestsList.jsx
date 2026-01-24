import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function ApprovalRequestsList() {
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalActionOpen, setApprovalActionOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: approvalRequests = [], isLoading } = useQuery({
    queryKey: ['approvalRequests'],
    queryFn: () => base44.entities.ApprovalRequest.filter({ state: 'PENDING' }, '-created_date'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: () => base44.entities.System.list(),
  });

  const { data: boundaries = [] } = useQuery({
    queryKey: ['boundaries'],
    queryFn: () => base44.entities.Boundary.list(),
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: () => base44.entities.Finding.list(),
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (approval) => {
      const affectedSystemIds = approval.system_id ? [approval.system_id] : approval.system_ids;
      const affectedSystems = systems.filter(s => affectedSystemIds.includes(s.id));

      // Update systems with new boundary
      await Promise.all(
        affectedSystemIds.map(id => base44.entities.System.update(id, { boundary: approval.to_boundary }))
      );

      // Update related findings
      const affectedFindings = findings.filter(f => affectedSystemIds.includes(f.system_id));
      if (affectedFindings.length > 0) {
        await Promise.all(
          affectedFindings.map(f => base44.entities.Finding.update(f.id, { boundary: approval.to_boundary }))
        );
      }

      // Create boundary change log entries for each system
      await Promise.all(
        affectedSystemIds.map(systemId => {
          const system = affectedSystems.find(s => s.id === systemId);
          return base44.entities.BoundaryChangeLog.create({
            system_id: systemId,
            system_name: system?.name,
            changed_by_user_id: currentUser?.id,
            changed_by_name: currentUser?.full_name,
            from_boundary: approval.from_boundary,
            to_boundary: approval.to_boundary,
            system_environment: system?.environment,
            findings_impacted_count: approval.total_findings_impacted,
            change_source: approval.change_source,
            notes: `Approved and applied by ${currentUser?.full_name}`,
          });
        })
      );

      // Update approval request to APPROVED
      return base44.entities.ApprovalRequest.update(approval.id, {
        state: 'APPROVED',
        approved_by_user_id: currentUser?.id,
        approved_by_name: currentUser?.full_name,
        approval_decision_date: new Date().toISOString(),
        approval_notes: approvalNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['boundaryChangeLogs'] });
      toast({ title: 'Approval Submitted', description: 'Boundary changes have been applied.' });
      setApprovalActionOpen(false);
      setSelectedApproval(null);
      setApprovalNotes('');
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (approval) => {
      return base44.entities.ApprovalRequest.update(approval.id, {
        state: 'REJECTED',
        approved_by_user_id: currentUser?.id,
        approved_by_name: currentUser?.full_name,
        approval_decision_date: new Date().toISOString(),
        approval_notes: approvalNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalRequests'] });
      toast({ title: 'Request Rejected', description: 'The approval request has been rejected.' });
      setApprovalActionOpen(false);
      setSelectedApproval(null);
      setApprovalNotes('');
    },
  });

  const handleApprove = () => {
    if (selectedApproval) {
      approveRequestMutation.mutate(selectedApproval);
    }
  };

  const handleReject = () => {
    if (selectedApproval) {
      rejectRequestMutation.mutate(selectedApproval);
    }
  };

  const openApprovalModal = (request, action) => {
    setSelectedApproval(request);
    setApprovalDecision(action);
    setApprovalActionOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
        <CardContent className="py-12 text-center text-slate-400">
          Loading approval requests...
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = approvalRequests.filter(r => r.state === 'PENDING');

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Boundary Change Approvals</h2>
          <p className="text-slate-400">Review and approve pending External → Prod boundary changes</p>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-slate-300 text-lg font-medium">No Pending Approvals</p>
              <p className="text-slate-400 mt-2">All boundary change requests have been reviewed.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        System(s)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Impact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Requested By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {pendingRequests.map((request) => {
                      const affectedSystemIds = request.system_id ? [request.system_id] : request.system_ids;
                      const affectedSystems = systems.filter(s => affectedSystemIds.includes(s.id));

                      return (
                        <tr key={request.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {affectedSystems.map((sys) => (
                                <div key={sys.id}>
                                  <p className="text-sm font-medium text-slate-200">{sys.name}</p>
                                  <p className="text-xs text-slate-400">{sys.environment}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {request.from_boundary}
                              </Badge>
                              <span className="text-slate-400">→</span>
                              <Badge className="bg-blue-900/50 text-blue-200 border-blue-700">
                                {request.to_boundary}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm text-slate-300">
                                {request.total_findings_impacted} total findings
                              </p>
                              <p className="text-xs text-orange-400">
                                {request.open_findings_impacted} open/in progress
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-300">{request.requested_by_name}</p>
                            <p className="text-xs text-slate-400">
                              {request.change_source === 'BULK_EDIT' ? 'Bulk Edit' : 'Single Edit'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {format(new Date(request.created_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600/20 hover:bg-green-600/30 text-green-200 border border-green-700/50"
                                onClick={() => openApprovalModal(request, 'approve')}
                                disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-700/50"
                                onClick={() => openApprovalModal(request, 'reject')}
                                disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={approvalActionOpen} onOpenChange={setApprovalActionOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {approvalDecision === 'approve' ? 'Approve Boundary Change' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {approvalDecision === 'approve'
                ? 'This will apply the boundary change to the selected system(s) and all related findings.'
                : 'This will reject the approval request. No changes will be applied.'}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
                  Request Summary
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Systems ({(selectedApproval.system_id ? 1 : selectedApproval.system_ids?.length) || 0})</p>
                    <p className="text-sm text-slate-200">
                      {selectedApproval.system_id
                        ? systems.find(s => s.id === selectedApproval.system_id)?.name
                        : selectedApproval.system_ids?.map(id => systems.find(s => s.id === id)?.name).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Boundary Change</p>
                    <p className="text-sm text-slate-200">
                      {selectedApproval.from_boundary} → {selectedApproval.to_boundary}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Findings Impacted</p>
                    <p className="text-sm text-slate-200">
                      {selectedApproval.open_findings_impacted} open / {selectedApproval.total_findings_impacted} total
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  {approvalDecision === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalDecision === 'approve'
                      ? 'Add any notes about this approval...'
                      : 'Explain why this request was rejected...'
                  }
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-500"
                  rows="3"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalActionOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={approvalDecision === 'approve' ? handleApprove : handleReject}
              className={
                approvalDecision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
              disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
            >
              {approveRequestMutation.isPending || rejectRequestMutation.isPending
                ? 'Processing...'
                : approvalDecision === 'approve'
                ? 'Approve Change'
                : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}