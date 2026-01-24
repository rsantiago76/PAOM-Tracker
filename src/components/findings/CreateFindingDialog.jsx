import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function CreateFindingDialog({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    finding_number: '',
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Open',
    system_id: '',
    assigned_to: '',
    due_date: '',
    control_reference: '',
    source: 'Internal Audit',
    risk_level: 'Moderate',
    remediation_plan: '',
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: () => base44.entities.System.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Get system name if system_id is provided
      let system_name = '';
      if (data.system_id) {
        const system = systems.find(s => s.id === data.system_id);
        system_name = system?.name || '';
      }

      // Get assigned user name
      let assigned_to_name = '';
      if (data.assigned_to) {
        const user = users.find(u => u.email === data.assigned_to);
        assigned_to_name = user?.full_name || '';
      }

      const finding = await base44.entities.Finding.create({
        ...data,
        system_name,
        assigned_to_name,
      });

      // Auto-generate milestones after finding creation
      try {
        await base44.functions.invoke('autoGenerateMilestones', {
          finding_id: finding.id,
          finding_number: finding.finding_number,
          severity: finding.severity,
          due_date: finding.due_date,
        });
      } catch (error) {
        console.error('Failed to auto-generate milestones:', error);
      }

      return finding;
    },
    onSuccess: (newFinding) => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      onClose();
      navigate(createPageUrl(`FindingDetail?id=${newFinding.id}`));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Finding</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Finding Number *</Label>
              <Input
                required
                placeholder="POA&M-2024-001"
                value={formData.finding_number}
                onChange={(e) => handleChange('finding_number', e.target.value)}
              />
            </div>

            <div>
              <Label>Source</Label>
              <select
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="Internal Audit">Internal Audit</option>
                <option value="External Audit">External Audit</option>
                <option value="Vulnerability Scan">Vulnerability Scan</option>
                <option value="Penetration Test">Penetration Test</option>
                <option value="Self-Assessment">Self-Assessment</option>
                <option value="Continuous Monitoring">Continuous Monitoring</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Title *</Label>
            <Input
              required
              placeholder="Brief description of the finding"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={4}
              placeholder="Detailed description of the finding..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Severity *</Label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Informational">Informational</option>
              </select>
            </div>

            <div>
              <Label>Risk Level</Label>
              <select
                value={formData.risk_level}
                onChange={(e) => handleChange('risk_level', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="Very High">Very High</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
                <option value="Very Low">Very Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>System</Label>
              <select
                value={formData.system_id}
                onChange={(e) => handleChange('system_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Select system...</option>
                {systems.map(system => (
                  <option key={system.id} value={system.id}>{system.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Assigned To</Label>
              <select
                value={formData.assigned_to}
                onChange={(e) => handleChange('assigned_to', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Select user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.email}>{user.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Control Reference</Label>
              <Input
                placeholder="e.g., NIST 800-53 AC-2"
                value={formData.control_reference}
                onChange={(e) => handleChange('control_reference', e.target.value)}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Remediation Plan</Label>
            <Textarea
              rows={3}
              placeholder="Describe the planned remediation approach..."
              value={formData.remediation_plan}
              onChange={(e) => handleChange('remediation_plan', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Finding'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}