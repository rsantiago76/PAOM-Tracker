import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle2, Circle, Clock, X } from 'lucide-react';

export default function MilestonesTab({ findingId, findingNumber }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', findingId],
    queryFn: async () => {
      const { data } = await client.models.Milestone.list({
        filter: { findingId: { eq: findingId } }
      });
      // Map to snake_case for UI compatibility
      return data.map(m => ({
        ...m,
        finding_id: m.findingId,
        finding_number: m.findingNumber, // if exists
        sequence_number: 0,
        completion_date: m.completedAt, // UI expects snake_case
        due_date: m.dueDate,
      })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await client.models.User.list();
      // Map fullName to full_name for UI
      return data.map(u => ({ ...u, full_name: u.fullName }));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => client.models.Milestone.create({
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      assignedTo: data.assigned_to, // Assuming assignedTo uses email/id as string
      findingId: findingId,
      status: 'NOT_STARTED',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', findingId] });
      setShowForm(false);
      setFormData({ title: '', description: '', due_date: '', assigned_to: '' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      const updateData = { id, status };
      // Map status strings if needed. UI uses 'In Progress' / 'Complete'
      // Schema likely uses CONSTANT_CASE e.g. IN_PROGRESS, COMPLETED
      // But let's assume UI values are used or we need to map.
      // The previous list code used 'IN_PROGRESS' in UI. 
      // This file uses 'In Progress'. I should standardize.
      // Schema defined Enums are usually uppercase.
      // 'Not Started' -> 'NOT_STARTED'
      // 'In Progress' -> 'IN_PROGRESS'
      // 'Complete' -> 'COMPLETED'
      let statusEnum = status;
      if (status === 'Not Started') statusEnum = 'NOT_STARTED';
      if (status === 'In Progress') statusEnum = 'IN_PROGRESS';
      if (status === 'Complete') statusEnum = 'COMPLETED';
      if (status === 'Blocked') statusEnum = 'BLOCKED';

      updateData.status = statusEnum;

      if (statusEnum === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString().split('T')[0]; // or full ISO
      }
      return client.models.Milestone.update(updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', findingId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.models.Milestone.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', findingId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusIcon = (status) => {
    if (status === 'Complete') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === 'In Progress') return <Clock className="w-5 h-5 text-blue-600" />;
    return <Circle className="w-5 h-5 text-slate-400" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-slate-100 text-slate-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'Complete': 'bg-green-100 text-green-700',
      'Blocked': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Milestones</h3>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Cancel' : 'Add Milestone'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-3">
            <div>
              <Label>Title *</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Milestone title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Milestone description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Assign To</Label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.email}>{user.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Milestone'}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {milestones.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No milestones yet. Add one to get started.</p>
          ) : (
            milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-500">#{index + 1}</span>
                  {getStatusIcon(milestone.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this milestone?')) {
                          deleteMutation.mutate(milestone.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>
                    {milestone.due_date && (
                      <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                    )}
                    {milestone.completion_date && (
                      <span>Completed: {new Date(milestone.completion_date).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <select
                      value={milestone.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: milestone.id, status: e.target.value })}
                      className="text-xs px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Complete">Complete</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}