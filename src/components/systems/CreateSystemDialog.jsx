import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/lib/auth';
import { client } from '@/api/amplifyClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function CreateSystemDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    environment: '',
    boundary: '',
    owner_user_id: '',
    owner_name: '',
    description: '',
    active_status: 'Active',
  });

  const [errors, setErrors] = useState({});

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const currentUser = await getCurrentUserProfile();
      return currentUser ? [{ id: currentUser.id, full_name: currentUser.full_name, email: currentUser.email }] : [];
    },
    enabled: open,
  });

  // Role-based owners (always available)
  const roleBasedOwners = [
    { id: '69716d40f9e45a5e95e4e857', name: 'System Administrator' },
    { id: 'ISSO', name: 'ISSO' },
    { id: 'ISSE', name: 'ISSE' },
    { id: 'ISSM', name: 'ISSM' }
  ];

  const roleBasedOwnerIds = new Set(roleBasedOwners.map(o => o.id));

  // Combine role-based owners with workspace users, excluding role-based IDs
  const combinedOwners = [
    ...roleBasedOwners,
    ...users
      .filter(u => !roleBasedOwnerIds.has(u.id))
      .map(u => ({ id: u.id, name: u.full_name }))
  ];

  // Deduplicate by normalized name as final safeguard
  const seenNames = new Set();
  const allOwners = combinedOwners.filter(owner => {
    const normalizedName = (owner.name || '').trim().toLowerCase();
    if (seenNames.has(normalizedName)) {
      return false;
    }
    seenNames.add(normalizedName);
    return true;
  });

  const { data: boundaries = [] } = useQuery({
    queryKey: ['boundaries'],
    queryFn: async () => {
      const { data } = await client.models.Boundary.list();
      return data;
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        acronym: data.acronym,
        environment: data.environment,
        boundary: data.boundary,
        ownerUserId: data.owner_user_id,
        ownerName: data.owner_name,
        description: data.description,
        activeStatus: data.active_status,
      };
      return client.models.System.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({
        title: 'Success',
        description: 'System created successfully',
      });
      onClose();
      setFormData({
        name: '',
        acronym: '',
        environment: '',
        boundary: '',
        owner_user_id: '',
        owner_name: '',
        description: '',
        active_status: 'Active',
      });
      setErrors({});
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create system',
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.environment) newErrors.environment = 'Environment is required';
    if (!formData.boundary) newErrors.boundary = 'Boundary is required';
    if (!formData.owner_user_id) newErrors.owner_user_id = 'Owner is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate(formData);
    }
  };

  const handleOwnerChange = (userId) => {
    const owner = allOwners.find(o => o.id === userId);
    setFormData({
      ...formData,
      owner_user_id: userId,
      owner_name: owner ? (owner.name || owner.full_name) : ''
    });
    if (errors.owner_user_id) {
      setErrors({ ...errors, owner_user_id: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add System</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-200">System Name *</Label>
              <Input
                placeholder="e.g., Production API Server"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label className="text-slate-200">Acronym</Label>
              <Input
                placeholder="e.g., PROD-API"
                value={formData.acronym}
                onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-200">Environment *</Label>
              <select
                value={formData.environment}
                onChange={(e) => {
                  setFormData({ ...formData, environment: e.target.value });
                  if (errors.environment) setErrors({ ...errors, environment: '' });
                }}
                className="w-full px-3 py-2 border rounded-md text-sm bg-slate-800 border-slate-700 text-slate-200"
              >
                <option value="">Select environment...</option>
                <option value="DEV">DEV</option>
                <option value="TEST">TEST</option>
                <option value="STAGE">STAGE</option>
                <option value="PROD">PROD</option>
              </select>
              {errors.environment && <p className="text-red-400 text-xs mt-1">{errors.environment}</p>}
            </div>

            <div>
              <Label className="text-slate-200">Boundary *</Label>
              <select
                value={formData.boundary}
                onChange={(e) => {
                  setFormData({ ...formData, boundary: e.target.value });
                  if (errors.boundary) setErrors({ ...errors, boundary: '' });
                }}
                className="w-full px-3 py-2 border rounded-md text-sm bg-slate-800 border-slate-700 text-slate-200"
              >
                <option value="">Select boundary...</option>
                {boundaries.map(boundary => (
                  <option key={boundary.id} value={boundary.name}>{boundary.name}</option>
                ))}
              </select>
              {errors.boundary && <p className="text-red-400 text-xs mt-1">{errors.boundary}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-200">Owner *</Label>
              <select
                value={formData.owner_user_id}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-slate-800 border-slate-700 text-slate-200"
              >
                <option value="">Select owner...</option>
                {allOwners.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name || owner.full_name}</option>
                ))}
              </select>
              {errors.owner_user_id && <p className="text-red-400 text-xs mt-1">{errors.owner_user_id}</p>}
            </div>

            <div>
              <Label className="text-slate-200">Status</Label>
              <select
                value={formData.active_status}
                onChange={(e) => setFormData({ ...formData, active_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm bg-slate-800 border-slate-700 text-slate-200"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Description</Label>
            <Textarea
              rows={3}
              placeholder="Describe the system..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 text-slate-200">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create System'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}