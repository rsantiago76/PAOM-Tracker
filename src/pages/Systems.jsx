import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Server, Search, Filter, Archive, Trash2, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreateSystemDialog from '../components/systems/CreateSystemDialog';
import BoundaryBadge from '../components/boundaries/BoundaryBadge';
import BoundaryChangeWarningBanner from '../components/boundaries/BoundaryChangeWarningBanner';
import { seedDatabase } from '@/lib/seeder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

export default function Systems() {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [filters, setFilters] = useState({
    boundary: 'all',
    environment: 'all',
    owner: 'all',
    active: 'Active',
  });
  // ... (skipping unchanged state lines 39-49 for brevity of match, need to match exactly or use ReplaceChunk carefully)
  // Actually, to avoid context matching issues with state, I will target the imports and the specific header section separately or assume I can match a larger block.
  // Let's use multi_replace for safety.

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [bulkOwnerDialogOpen, setBulkOwnerDialogOpen] = useState(false);
  const [bulkOwner, setBulkOwner] = useState('');
  const [bulkBoundaryDialogOpen, setBulkBoundaryDialogOpen] = useState(false);
  const [bulkBoundary, setBulkBoundary] = useState('');
  const [boundaryChangeConfirmOpen, setBoundaryChangeConfirmOpen] = useState(false);
  const [pendingBoundaryChange, setPendingBoundaryChange] = useState(null);
  const [waitingForBoundaries, setWaitingForBoundaries] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* eslint-disable no-unused-vars */
  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const { data } = await client.models.System.list();
      // Map camelCase to snake_case for UI
      return data.map(s => ({
        ...s,
        owner_user_id: s.ownerUserId,
        owner_name: s.ownerName,
        active_status: s.activeStatus,
        created_date: s.createdAt,
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      const { data } = await client.models.Finding.list();
      return data.map(f => ({
        ...f,
        system_id: f.systemId,
        finding_number: f.findingNumber,
        due_date: f.dueDate,
        // ... existing mapping
      }));
    },
  });

  const { data: boundaries = [], isLoading: boundariesLoading } = useQuery({
    queryKey: ['boundaries'],
    queryFn: async () => {
      const { data } = await client.models.Boundary.list();
      return data.map(b => ({
        ...b,
        boundary_category: b.boundaryCategory,
      }));
    },
  });

  // Auto-trigger pending action once boundaries are loaded
  React.useEffect(() => {
    if (waitingForBoundaries && !boundariesLoading && boundaries.length > 0) {
      setWaitingForBoundaries(false);
      // Boundaries are now loaded, user needs to retry the action
    }
  }, [waitingForBoundaries, boundariesLoading, boundaries]);

  // Use getCurrentUserProfile helper
  const [currentUser, setCurrentUser] = useState(null);
  React.useEffect(() => {
    // We can also use useAuth() hook if I exported it properly from context,
    // but here I'll just use the helper or assume it's passed or fetched similarly.
    // Ideally use useAuth() from context. Assuming AuthContext is available.
    // For now, reuse the helper to keep it local if simple.
    // Actually, let's use the pattern from other files or just the helper.
    // Using helper is safe.
    // But currentUser is used in render, so state is needed.
    import('@/lib/auth').then(m => m.getCurrentUserProfile().then(setCurrentUser));
  }, []);


  const createApprovalRequestMutation = useMutation({
    mutationFn: async (approvalData) => {
      // Map UI fields to Schema
      const payload = {
        type: approvalData.type,
        requestedByUserId: currentUser?.id,
        requestedByName: currentUser?.full_name,
        systemId: approvalData.system_id,
        systemIds: approvalData.system_ids,
        fromBoundary: approvalData.from_boundary,
        toBoundary: approvalData.to_boundary,
        reason: approvalData.reason,
        totalFindingsImpacted: approvalData.total_findings_impacted,
        openFindingsImpacted: approvalData.open_findings_impacted,
        changeSource: approvalData.change_source,
        status: 'PENDING',
      };

      const { data: approval } = await client.models.ApprovalRequest.create(payload);

      // Also create a log entry noting the approval was requested
      const system = systems.find(s => s.id === approvalData.system_id || (approvalData.system_ids && approvalData.system_ids[0]));
      if (system) {
        await client.models.BoundaryChangeLog.create({
          systemId: approvalData.system_id || approvalData.system_ids?.[0],
          systemName: system?.name,
          changedByUserId: currentUser?.id,
          changedByName: currentUser?.full_name,
          fromBoundary: approvalData.from_boundary,
          toBoundary: approvalData.to_boundary,
          systemEnvironment: system?.environment,
          findingsImpactedCount: approvalData.total_findings_impacted,
          changeSource: approvalData.change_source,
          notes: 'Approval requested (External → Prod)',
        });
      }

      return approval;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['boundaryChangeLogs'] });
      toast({
        title: 'Approval Request Submitted',
        description: 'A Compliance Lead must approve this External → Prod boundary change.',
      });
      setPendingBoundaryChange(null);
      setBoundaryChangeConfirmOpen(false);
      setBulkBoundaryDialogOpen(false);
      setSelectedSystems([]);
      setBulkBoundary('');
    },
  });

  const updateEnvironmentMutation = useMutation({
    mutationFn: ({ systemId, environment }) => client.models.System.update({ id: systemId, environment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({ title: 'Environment updated' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (systemId) => client.models.System.update({ id: systemId, activeStatus: 'Inactive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({ title: 'System archived successfully' });
      setArchiveDialogOpen(false);
      setSelectedSystem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (systemId) => client.models.System.delete({ id: systemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({ title: 'System deleted successfully' });
      setDeleteDialogOpen(false);
      setSelectedSystem(null);
    },
  });

  const bulkUpdateOwnerMutation = useMutation({
    mutationFn: async ({ systemIds, ownerId, ownerName }) => {
      return Promise.all(
        systemIds.map(id => client.models.System.update({ id, ownerUserId: ownerId, ownerName: ownerName }))
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({ title: `Updated owner for ${variables.systemIds.length} systems` });
      setBulkOwnerDialogOpen(false);
      setSelectedSystems([]);
      setBulkOwner('');
    },
  });

  const updateBoundaryMutation = useMutation({
    mutationFn: async ({ systemId, boundaryName, fromBoundary, changedByUser, findingCount }) => {
      const findingsForSystem = findings.filter(f => f.system_id === systemId);
      const system = systems.find(s => s.id === systemId);

      await client.models.System.update({ id: systemId, boundary: boundaryName });

      // Update all findings with new boundary
      if (findingsForSystem.length > 0) {
        await Promise.all(
          findingsForSystem.map(f => client.models.Finding.update({ id: f.id, boundary: boundaryName }))
        );
      }

      // Create audit log
      await client.models.BoundaryChangeLog.create({
        systemId: systemId,
        systemName: system?.name,
        changedByUserId: changedByUser.id,
        changedByName: changedByUser.full_name,
        fromBoundary: fromBoundary,
        toBoundary: boundaryName,
        systemEnvironment: system?.environment,
        findingsImpactedCount: findingCount,
        changeSource: 'SINGLE_EDIT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['boundaryChangeLogs'] });
      toast({ title: 'Boundary updated' });
      setPendingBoundaryChange(null);
      setBoundaryChangeConfirmOpen(false);
    },
  });

  const bulkUpdateBoundaryMutation = useMutation({
    mutationFn: async ({ systemIds, boundaryName, changedByUser, findingCounts }) => {
      const affectedFindings = findings.filter(f => systemIds.includes(f.system_id));

      await Promise.all(
        systemIds.map(id => client.models.System.update({ id, boundary: boundaryName }))
      );

      if (affectedFindings.length > 0) {
        await Promise.all(
          affectedFindings.map(f => client.models.Finding.update({ id: f.id, boundary: boundaryName }))
        );
      }

      // Create audit logs for each system
      await Promise.all(
        systemIds.map(systemId => {
          const system = systems.find(s => s.id === systemId);
          return client.models.BoundaryChangeLog.create({
            systemId: systemId,
            systemName: system?.name,
            changedByUserId: changedByUser.id,
            changedByName: changedByUser.full_name,
            fromBoundary: system?.boundary,
            toBoundary: boundaryName,
            systemEnvironment: system?.environment,
            findingsImpactedCount: findingCounts[systemId] || 0,
            changeSource: 'BULK_EDIT',
          });
        })
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['boundaryChangeLogs'] });
      toast({ title: `Boundary updated for ${variables.systemIds.length} systems` });
      setBulkBoundaryDialogOpen(false);
      setSelectedSystems([]);
      setBulkBoundary('');
      setPendingBoundaryChange(null);
      setBoundaryChangeConfirmOpen(false);
    },
  });

  const filteredSystems = systems.filter(system => {
    const matchesSearch = system.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.acronym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBoundary = filters.boundary === 'all' || system.boundary === filters.boundary;
    const matchesEnvironment = filters.environment === 'all' || system.environment === filters.environment;
    const matchesOwner = filters.owner === 'all' || system.owner_user_id === filters.owner;
    const matchesActive = filters.active === 'all' || system.active_status === filters.active;

    return matchesSearch && matchesBoundary && matchesEnvironment && matchesOwner && matchesActive;
  });

  // Role-based owners (always available)
  const roleBasedOwners = [
    { id: '69716d40f9e45a5e95e4e857', name: 'System Administrator' },
    { id: 'ISSO', name: 'ISSO' },
    { id: 'ISSE', name: 'ISSE' },
    { id: 'ISSM', name: 'ISSM' }
  ];

  const roleBasedOwnerIds = new Set(roleBasedOwners.map(o => o.id));
  const uniqueOwners = [...new Set(systems.map(s => s.owner_user_id).filter(Boolean))];

  // Combine role-based owners with additional user owners (excluding role-based)
  const combinedOwners = [
    ...roleBasedOwners,
    ...uniqueOwners
      .filter(ownerId => !roleBasedOwnerIds.has(ownerId))
      .map(ownerId => {
        const system = systems.find(s => s.owner_user_id === ownerId);
        return { id: ownerId, name: system?.owner_name || 'Unknown' };
      })
  ];

  // Deduplicate by normalized name as final safeguard
  const seenNames = new Set();
  const allOwnerOptions = combinedOwners.filter(owner => {
    const normalizedName = (owner.name || '').trim().toLowerCase();
    if (seenNames.has(normalizedName)) {
      return false;
    }
    seenNames.add(normalizedName);
    return true;
  });

  // Helper functions for delete eligibility
  const canUserDeleteSystem = (userRole, totalFindingsCount) => {
    // If findings are still loading, block delete (safe default)
    if (totalFindingsCount === null) return false;
    return userRole === 'admin' && totalFindingsCount === 0;
  };

  const getDeleteDisabledReason = (userRole, totalFindingsCount) => {
    // If findings are loading, show loading state
    if (totalFindingsCount === null) return 'LOADING';
    if (userRole !== 'admin') return 'INSUFFICIENT_PERMISSIONS';
    if (totalFindingsCount > 0) return 'HAS_FINDINGS';
    return null;
  };

  const handleArchive = (system, e) => {
    e.stopPropagation();
    setSelectedSystem(system);
    setArchiveDialogOpen(true);
  };

  const handleDelete = (system, e) => {
    e.stopPropagation();

    const isAdmin = currentUser?.role === 'admin';
    if (!isAdmin) {
      toast({
        title: 'Permission denied',
        description: 'Only workspace admins can delete systems.',
        variant: 'destructive',
      });
      return;
    }

    const totalFindingsCount = findings.filter(f => f.system_id === system.id).length;
    if (totalFindingsCount > 0) {
      toast({
        title: 'Cannot delete system',
        description: 'This system has findings. Archive it or reassign findings to another system first.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedSystem(system);
    setDeleteDialogOpen(true);
  };

  const confirmArchive = () => {
    if (selectedSystem) {
      archiveMutation.mutate(selectedSystem.id);
    }
  };

  const confirmDelete = () => {
    if (selectedSystem) {
      deleteMutation.mutate(selectedSystem.id);
    }
  };

  const handleEnvironmentChange = (system, newEnvironment, e) => {
    e.stopPropagation();
    if (currentUser?.role !== 'admin') {
      toast({
        title: 'Permission denied',
        description: 'Only workspace admins can change system environment.',
        variant: 'destructive',
      });
      return;
    }
    updateEnvironmentMutation.mutate({ systemId: system.id, environment: newEnvironment });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSystems(filteredSystems.map(s => s.id));
    } else {
      setSelectedSystems([]);
    }
  };

  const handleSelectSystem = (systemId, checked) => {
    if (checked) {
      setSelectedSystems([...selectedSystems, systemId]);
    } else {
      setSelectedSystems(selectedSystems.filter(id => id !== systemId));
    }
  };

  const handleBulkOwnerSubmit = () => {
    if (!bulkOwner || selectedSystems.length === 0) return;

    const selectedOwner = allOwnerOptions.find(o => o.id === bulkOwner);
    if (!selectedOwner) return;

    bulkUpdateOwnerMutation.mutate({
      systemIds: selectedSystems,
      ownerId: selectedOwner.id,
      ownerName: selectedOwner.name,
    });
  };

  const canEditBoundary = currentUser?.role === 'admin';
  const isComplianceLead = currentUser?.role === 'admin' && currentUser?.compliance_lead === true;
  const isWorkspaceAdmin = currentUser?.role === 'admin';

  const checkExternalToProdApproval = (fromBoundary, toBoundary) => {
    const fromBoundaryObj = boundaries.find(b => b.name === fromBoundary);
    const toBoundaryObj = boundaries.find(b => b.name === toBoundary);

    return (
      fromBoundaryObj?.boundary_category === 'EXTERNAL' &&
      toBoundaryObj?.boundary_category === 'PROD'
    );
  };

  const handleBoundaryChange = (system, boundaryName, e) => {
    if (e) e.stopPropagation();
    if (!canEditBoundary) {
      toast({
        title: 'Permission denied',
        description: 'Only admins can change system boundaries.',
        variant: 'destructive',
      });
      return;
    }

    // Wait for boundaries to load if necessary
    if (boundariesLoading) {
      setWaitingForBoundaries(true);
      return;
    }

    // Check PROD→Non-Prod restriction
    const targetBoundary = boundaries.find(b => b.name === boundaryName);
    if (system.environment === 'PROD' && targetBoundary?.boundary_category === 'NON_PROD') {
      toast({
        title: 'Blocked',
        description: 'PROD systems cannot be moved into a Non-Prod boundary.',
        variant: 'destructive',
      });
      return;
    }

    const relatedFindings = findings.filter(f => f.system_id === system.id);
    const openFindings = relatedFindings.filter(f => f.status === 'Open' || f.status === 'In Progress');

    const needsApproval = checkExternalToProdApproval(system.boundary, boundaryName);
    const fromBoundary = boundaries.find(b => b.name === system.boundary);

    setPendingBoundaryChange({
      type: 'single',
      systemId: system.id,
      systemName: system.name,
      from_boundary_id: fromBoundary?.id,
      to_boundary_id: targetBoundary?.id,
      totalFindingsCount: relatedFindings.length,
      openFindingsCount: openFindings.length,
      systems: [system],
      needsApproval,
    });

    setBoundaryChangeConfirmOpen(true);
  };

  const handleBulkBoundarySubmit = () => {
    if (!bulkBoundary || selectedSystems.length === 0) return;

    // Wait for boundaries to load if necessary
    if (boundariesLoading) {
      setWaitingForBoundaries(true);
      return;
    }

    const targetBoundary = boundaries.find(b => b.name === bulkBoundary);
    const selectedSystemsData = filteredSystems.filter(s => selectedSystems.includes(s.id));

    // Check for PROD→Non-Prod violations
    const prodSystemsToNonProd = selectedSystemsData.filter(
      s => s.environment === 'PROD' && targetBoundary?.boundary_category === 'NON_PROD'
    );

    if (prodSystemsToNonProd.length > 0) {
      toast({
        title: 'Blocked',
        description: `Cannot move PROD systems to Non-Prod boundary. Affected: ${prodSystemsToNonProd.map(s => s.name).join(', ')}. Choose a PROD boundary instead.`,
        variant: 'destructive',
      });
      return;
    }

    // Check for External→Prod that require approval
    const systemsNeedingApproval = selectedSystemsData.filter(
      s => checkExternalToProdApproval(s.boundary, bulkBoundary)
    );

    const relatedFindings = findings.filter(f => selectedSystems.includes(f.system_id));
    const openFindings = relatedFindings.filter(f => f.status === 'Open' || f.status === 'In Progress');

    const needsApproval = systemsNeedingApproval.length > 0;
    const fromBoundary = boundaries.find(b => b.name === selectedSystemsData[0]?.boundary);

    setPendingBoundaryChange({
      type: 'bulk',
      systemIds: selectedSystems,
      from_boundary_id: fromBoundary?.id,
      to_boundary_id: targetBoundary?.id,
      totalFindingsCount: relatedFindings.length,
      openFindingsCount: openFindings.length,
      systems: selectedSystemsData,
      needsApproval,
      systemsNeedingApproval,
    });

    setBoundaryChangeConfirmOpen(true);
  };

  const confirmBoundaryChange = () => {
    if (!pendingBoundaryChange) return;

    const toBoundary = boundaries.find(b => b.id === pendingBoundaryChange.to_boundary_id);
    if (!toBoundary) {
      toast({
        title: 'Error',
        description: 'Target boundary could not be resolved.',
        variant: 'destructive',
      });
      return;
    }

    // Handle External→Prod approval flow
    if (pendingBoundaryChange.needsApproval) {
      if (isComplianceLead) {
        // Compliance lead can proceed directly
        if (pendingBoundaryChange.type === 'single') {
          updateBoundaryMutation.mutate({
            systemId: pendingBoundaryChange.systemId,
            boundaryName: toBoundary.name,
          });
        } else {
          bulkUpdateBoundaryMutation.mutate({
            systemIds: pendingBoundaryChange.systemIds,
            boundaryName: toBoundary.name,
          });
        }
      } else if (isWorkspaceAdmin) {
        // Non-compliance admin must request approval
        const affectedSystems = pendingBoundaryChange.systemsNeedingApproval || [pendingBoundaryChange.systems?.[0]];

        createApprovalRequestMutation.mutate({
          type: 'BOUNDARY_CHANGE',
          requested_by_user_id: currentUser?.id,
          requested_by_name: currentUser?.full_name,
          system_id: pendingBoundaryChange.systemId,
          system_ids: pendingBoundaryChange.systemIds,
          from_boundary: affectedSystems[0]?.boundary,
          to_boundary: toBoundary.name,
          reason: 'External → Prod requires compliance approval',
          total_findings_impacted: pendingBoundaryChange.totalFindingsCount,
          open_findings_impacted: pendingBoundaryChange.openFindingsCount,
          change_source: pendingBoundaryChange.type === 'single' ? 'SINGLE_EDIT' : 'BULK_EDIT',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'External → Prod boundary moves require Compliance Lead approval.',
          variant: 'destructive',
        });
      }
    } else {
      // No approval needed, proceed normally
      if (pendingBoundaryChange.type === 'single') {
        updateBoundaryMutation.mutate({
          systemId: pendingBoundaryChange.systemId,
          boundaryName: toBoundary.name,
        });
      } else {
        bulkUpdateBoundaryMutation.mutate({
          systemIds: pendingBoundaryChange.systemIds,
          boundaryName: toBoundary.name,
        });
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      toast({ title: 'Starting database seed...', description: 'This may take a few seconds.' });
      const result = await seedDatabase();
      if (result.success) {
        toast({ title: 'Seed Complete', description: 'Systems and boundaries have been populated.' });
        queryClient.invalidateQueries({ queryKey: ['systems'] });
        queryClient.invalidateQueries({ queryKey: ['boundaries'] });
        queryClient.invalidateQueries({ queryKey: ['findings'] });
      } else {
        toast({
          title: 'Seed Failed',
          description: result.error?.message || 'Check console for details',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Unexpected error during seeding', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <style>{`
      .systems-page-wrapper {
        position: relative;
        overflow: hidden;
      }
      
      .systems-page-wrapper::before {
        content: '';
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 800px;
        height: 600px;
        background: radial-gradient(
          ellipse at center,
          rgba(59, 130, 246, 0.08) 0%,
          rgba(217, 119, 6, 0.04) 40%,
          transparent 70%
        );
        pointer-events: none;
        z-index: 0;
      }
      
      .systems-page-wrapper::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 400px;
        background-image: 
          linear-gradient(0deg, rgba(2, 132, 199, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(2, 132, 199, 0.02) 1px, transparent 1px);
        background-size: 60px 60px;
        pointer-events: none;
        z-index: 0;
      }
      
      .systems-page-content {
        position: relative;
        z-index: 1;
      }
    `}</style>
      <div className="systems-page-wrapper">
        <div className="systems-page-content space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Systems</h1>
              <p className="text-slate-300 mt-1">Manage systems and applications</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSeed}
                disabled={isSeeding}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
              >
                <Database className={`w-4 h-4 mr-2 ${isSeeding ? 'animate-pulse' : ''}`} />
                {isSeeding ? 'Seeding...' : 'Seed Data'}
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add System
              </Button>
            </div>
          </div>

          <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search systems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filters.boundary}
                    onChange={(e) => setFilters({ ...filters, boundary: e.target.value })}
                    className="px-3 py-1.5 text-sm rounded-md bg-slate-800 border-slate-700 text-slate-200"
                  >
                    <option value="all">All Boundaries</option>
                    {boundaries.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={filters.environment}
                  onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-800 border-slate-700 text-slate-200"
                >
                  <option value="all">All Environments</option>
                  <option value="DEV">DEV</option>
                  <option value="TEST">TEST</option>
                  <option value="STAGE">STAGE</option>
                  <option value="PROD">PROD</option>
                </select>

                <select
                  value={filters.owner}
                  onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-800 border-slate-700 text-slate-200"
                >
                  <option value="all">All Owners</option>
                  {allOwnerOptions.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.active}
                  onChange={(e) => setFilters({ ...filters, active: e.target.value })}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-800 border-slate-700 text-slate-200"
                >
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Archived Only</option>
                  <option value="all">All Systems</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardContent className="py-12 text-center text-slate-400">
                Loading systems...
              </CardContent>
            </Card>
          ) : filteredSystems.length === 0 ? (
            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardContent className="py-12 text-center">
                <Server className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-300 text-lg font-medium mb-2">No systems found</p>
                <p className="text-slate-400 mb-4">
                  {systems.length === 0
                    ? 'Create your first system to get started.'
                    : 'Try adjusting your filters or search term.'}
                </p>
                {systems.length === 0 && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add System
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
              <CardContent className="p-0">
                {selectedSystems.length > 0 && (
                  <div className="px-6 py-3 bg-slate-800/70 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-300">{selectedSystems.length} systems selected</span>
                    <div className="flex items-center gap-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value === 'set_owner') {
                            setBulkOwnerDialogOpen(true);
                          } else if (e.target.value === 'set_boundary') {
                            setBulkBoundaryDialogOpen(true);
                          }
                          e.target.value = '';
                        }}
                        className="px-3 py-1.5 text-sm rounded-md bg-slate-700 border-slate-600 text-slate-200"
                        defaultValue=""
                        disabled={!canEditBoundary}
                      >
                        <option value="" disabled>Bulk Actions</option>
                        <option value="set_owner">Set Owner...</option>
                        <option value="set_boundary">Change Boundary...</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSystems([])}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={filteredSystems.length > 0 && selectedSystems.length === filteredSystems.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Acronym</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Boundary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Env</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Open Findings</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredSystems.map((system) => {
                        // Compute stable finding counts (null if loading, otherwise actual count)
                        const totalFindingsCount = findingsLoading
                          ? null
                          : findings.filter(f => f.system_id === system.id).length;
                        const openFindingsCount = findingsLoading
                          ? null
                          : findings.filter(f => f.system_id === system.id && (f.status === 'Open' || f.status === 'In Progress')).length;

                        const userRole = currentUser?.role;
                        const canDelete = canUserDeleteSystem(userRole, totalFindingsCount);
                        const deleteReason = getDeleteDisabledReason(userRole, totalFindingsCount);

                        return (
                          <tr
                            key={system.id}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-6 py-4 w-12">
                              <input
                                type="checkbox"
                                checked={selectedSystems.includes(system.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectSystem(system.id, e.target.checked);
                                }}
                                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td
                              className="px-6 py-4 cursor-pointer"
                              onClick={() => window.location.href = createPageUrl(`SystemDetail?id=${system.id}`)}
                            >
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div tabIndex={0} className="outline-none focus:ring-2 focus:ring-blue-500/50 rounded">
                                      <div className="text-sm font-medium text-slate-200">{system.name}</div>
                                      {system.description && (
                                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">{system.description}</div>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    align="start"
                                    className="bg-slate-900/90 border border-slate-700/60 text-slate-100 max-w-md p-4"
                                  >
                                    <div className="space-y-3">
                                      <div>
                                        <p className="font-semibold text-sm">{system.name}</p>
                                        <p className="text-sm text-slate-300 leading-relaxed max-h-32 overflow-y-auto mt-1">
                                          {system.description || 'No description provided.'}
                                        </p>
                                      </div>
                                      <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-slate-500">Acronym:</span>
                                          <span className="ml-1 text-slate-300">{system.acronym || '-'}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Environment:</span>
                                          <span className="ml-1 text-slate-300">{system.environment}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Boundary:</span>
                                          <span className="ml-1 text-slate-300">{system.boundary}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Owner:</span>
                                          <span className="ml-1 text-slate-300">{system.owner_name || 'Unassigned'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-slate-300 cursor-pointer"
                              onClick={() => window.location.href = createPageUrl(`SystemDetail?id=${system.id}`)}
                            >
                              {system.acronym || '-'}
                            </td>
                            <td
                              className="px-6 py-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {canEditBoundary ? (
                                <select
                                  value={system.boundary || ''}
                                  onChange={(e) => handleBoundaryChange(system, e.target.value, e)}
                                  disabled={boundariesLoading}
                                  className="px-2 py-1 text-sm rounded-md bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="" disabled>Select boundary...</option>
                                  {boundaries.map(b => (
                                    <option key={b.id} value={b.name}>
                                      {b.name} {b.boundary_category === 'EXTERNAL' ? '[EXTERNAL]' : `[${b.boundary_category}]`}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <BoundaryBadge boundary={boundaries.find(b => b.name === system.boundary)} />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900/90 border border-slate-700/60 text-slate-100">
                                      <p className="text-xs">Only admins can change system boundaries</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex gap-1">
                                      {['DEV', 'TEST', 'STAGE', 'PROD'].map((env) => (
                                        <button
                                          key={env}
                                          onClick={(e) => handleEnvironmentChange(system, env, e)}
                                          disabled={userRole !== 'admin'}
                                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${system.environment === env
                                            ? env === 'PROD' ? 'bg-red-900/70 text-red-100 border border-red-700' :
                                              env === 'STAGE' ? 'bg-yellow-900/70 text-yellow-100 border border-yellow-700' :
                                                env === 'TEST' ? 'bg-blue-900/70 text-blue-100 border border-blue-700' :
                                                  'bg-green-900/70 text-green-100 border border-green-700'
                                            : 'bg-slate-800/30 text-slate-400 border border-slate-700/40 hover:bg-slate-800/50 hover:text-slate-300'
                                            } ${userRole !== 'admin' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                            }`}
                                        >
                                          {env}
                                        </button>
                                      ))}
                                    </div>
                                  </TooltipTrigger>
                                  {userRole !== 'admin' && (
                                    <TooltipContent className="bg-slate-900/90 border border-slate-700/60 text-slate-100">
                                      <p className="text-xs">Only admins can change environment</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-slate-300 cursor-pointer"
                              onClick={() => window.location.href = createPageUrl(`SystemDetail?id=${system.id}`)}
                            >
                              {system.owner_name || 'Unassigned'}
                            </td>
                            <td
                              className="px-6 py-4 cursor-pointer"
                              onClick={() => window.location.href = createPageUrl(`SystemDetail?id=${system.id}`)}
                            >
                              <Badge className={
                                system.active_status === 'Active'
                                  ? 'bg-green-900/50 text-green-200 border-green-700'
                                  : 'bg-slate-700/50 text-slate-300 border-slate-600'
                              }>
                                {system.active_status}
                              </Badge>
                            </td>
                            <td
                              className="px-6 py-4 cursor-pointer"
                              onClick={() => window.location.href = createPageUrl(`SystemDetail?id=${system.id}`)}
                            >
                              {openFindingsCount === null ? (
                                <span className="text-sm text-slate-400">Loading...</span>
                              ) : (
                                <span className="text-sm text-slate-200">
                                  {openFindingsCount} of {totalFindingsCount}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <TooltipProvider>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {system.active_status === 'Active' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={(e) => handleArchive(system, e)}
                                            disabled={userRole !== 'admin'}
                                            aria-label="Archive system"
                                            className="h-8 w-8 bg-slate-900/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <Archive className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900/90 border border-slate-700/60 text-slate-100 max-w-xs">
                                          <p className="font-semibold mb-1">Archive System</p>
                                          <p className="text-xs text-slate-300 mb-2">
                                            Marks the system as inactive. Archived systems are hidden from default views but findings and audit history are preserved.
                                          </p>
                                          <p className="text-xs text-slate-400 italic">
                                            {userRole === 'admin'
                                              ? 'You can archive any system in this workspace.'
                                              : 'Only admins can archive systems.'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={(e) => handleDelete(system, e)}
                                          disabled={!canDelete}
                                          aria-label="Delete system"
                                          className="h-8 w-8 bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/15 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-slate-900/90 border border-slate-700/60 text-slate-100 max-w-xs">
                                        <p className="font-semibold mb-1">Delete System</p>
                                        <p className="text-xs text-slate-300 mb-2">
                                          Permanently removes the system. Deletion is blocked if the system has findings.
                                        </p>
                                        <p className="text-xs text-slate-400 italic">
                                          {userRole === 'admin'
                                            ? 'You can delete systems only when they have 0 findings.'
                                            : 'Only admins can delete systems.'}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="min-h-[16px]">
                                    {deleteReason === 'LOADING' && (
                                      <p className="text-xs text-slate-400">
                                        Loading...
                                      </p>
                                    )}
                                    {deleteReason === 'INSUFFICIENT_PERMISSIONS' && (
                                      <p className="text-xs text-slate-400">
                                        Delete disabled: insufficient permissions.
                                      </p>
                                    )}
                                    {deleteReason === 'HAS_FINDINGS' && (
                                      <p className="text-xs text-slate-400">
                                        Delete blocked: system has findings. Archive or reassign findings first.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TooltipProvider>
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

          <CreateSystemDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
          />

          <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle>Archive System</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Are you sure you want to archive "{selectedSystem?.name}"? The system will be hidden from the active list but all findings and history will be preserved.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setArchiveDialogOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmArchive}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Archive System
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle>Delete System</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Are you sure you want to permanently delete "{selectedSystem?.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete System
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkOwnerDialogOpen} onOpenChange={setBulkOwnerDialogOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle>Set Owner for {selectedSystems.length} Systems</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select the new owner for all selected systems.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <select
                  value={bulkOwner}
                  onChange={(e) => setBulkOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border-slate-700 text-slate-200"
                >
                  <option value="">Select owner...</option>
                  {allOwnerOptions.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkOwnerDialogOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkOwnerSubmit}
                  disabled={!bulkOwner || selectedSystems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkBoundaryDialogOpen} onOpenChange={setBulkBoundaryDialogOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle>Change Boundary for {selectedSystems.length} Systems</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select the new boundary for all selected systems.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <select
                  value={bulkBoundary}
                  onChange={(e) => setBulkBoundary(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border-slate-700 text-slate-200"
                >
                  <option value="">Select boundary...</option>
                  {boundaries.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name} {b.boundary_category === 'EXTERNAL' ? '[EXTERNAL]' : `[${b.boundary_category}]`}
                    </option>
                  ))}
                </select>
                {bulkBoundary && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Target Boundary</p>
                    <BoundaryBadge boundary={boundaries.find(b => b.name === bulkBoundary)} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkBoundaryDialogOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkBoundarySubmit}
                  disabled={!bulkBoundary || selectedSystems.length === 0 || boundariesLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {boundariesLoading ? 'Loading...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={boundaryChangeConfirmOpen} onOpenChange={setBoundaryChangeConfirmOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {pendingBoundaryChange?.needsApproval
                    ? 'External → Prod: Approval Required'
                    : 'Boundary Change Impact Preview'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {pendingBoundaryChange?.needsApproval
                    ? isComplianceLead
                      ? 'As Compliance Lead, you can approve this External → Prod change.'
                      : 'This change requires Compliance Lead approval. Submit for review.'
                    : 'Review the impact before confirming this change.'}
                </DialogDescription>
              </DialogHeader>

              {pendingBoundaryChange && (() => {
                const fromBoundary = boundaries.find(b => b.id === pendingBoundaryChange.from_boundary_id);
                const toBoundary = boundaries.find(b => b.id === pendingBoundaryChange.to_boundary_id);

                return (
                  <div className="space-y-4 py-4">
                    {/* Warning Banner */}
                    <BoundaryChangeWarningBanner
                      system={pendingBoundaryChange.type === 'single' ? pendingBoundaryChange.systems?.[0] : null}
                      systems={pendingBoundaryChange.type === 'bulk' ? pendingBoundaryChange.systems : null}
                      fromBoundary={fromBoundary}
                      toBoundary={toBoundary}
                    />

                    {/* Target Boundary */}
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target Boundary</p>
                      <div className="flex items-center gap-3">
                        {boundariesLoading ? (
                          <p className="text-lg text-slate-400">Loading boundary...</p>
                        ) : !toBoundary ? (
                          <p className="text-lg text-yellow-400">
                            Unknown Boundary (ID: {pendingBoundaryChange.to_boundary_id})
                            {console.warn(`Boundary resolution failed: Could not find boundary with ID "${pendingBoundaryChange.to_boundary_id}"`, { availableBoundaries: boundaries.map(b => ({ id: b.id, name: b.name })) }) || ''}
                          </p>
                        ) : (
                          <>
                            <p className="text-lg font-semibold text-slate-100">{toBoundary.name}</p>
                            <BoundaryBadge boundary={toBoundary} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Systems Selected */}
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        Systems ({pendingBoundaryChange.systems?.length || 1})
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {pendingBoundaryChange.systems?.map((sys) => (
                          <div key={sys.id} className="flex items-start justify-between text-sm">
                            <div>
                              <p className="text-slate-100 font-medium">{sys.name}</p>
                              <p className="text-xs text-slate-400">{sys.environment} • {sys.boundary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Impact Summary */}
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Findings Impact</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Total Findings</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {pendingBoundaryChange.totalFindingsCount || 0}
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Open/In Progress</p>
                          <p className="text-2xl font-bold text-orange-400">
                            {pendingBoundaryChange.openFindingsCount || 0}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 pt-2 border-t border-slate-700">
                        This change will update <span className="font-semibold text-blue-300">{pendingBoundaryChange.totalFindingsCount || 0}</span> findings across <span className="font-semibold text-blue-300">{pendingBoundaryChange.systems?.length || 1}</span> system{(pendingBoundaryChange.systems?.length || 1) !== 1 ? 's' : ''} (<span className="font-semibold text-orange-300">{pendingBoundaryChange.openFindingsCount || 0} open</span>).
                      </p>

                      {pendingBoundaryChange.needsApproval && !isComplianceLead && (
                        <div className="bg-amber-900/30 border border-amber-700/50 rounded p-3 mt-4">
                          <p className="text-xs text-amber-200">
                            ⚠️ <strong>Approval Required:</strong> External → Prod boundary changes must be approved by a Compliance Lead. Your request will be submitted for review.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBoundaryChangeConfirmOpen(false);
                    setPendingBoundaryChange(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  disabled={updateBoundaryMutation.isPending || bulkUpdateBoundaryMutation.isPending || createApprovalRequestMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmBoundaryChange}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={(() => {
                    if (updateBoundaryMutation.isPending ||
                      bulkUpdateBoundaryMutation.isPending ||
                      createApprovalRequestMutation.isPending ||
                      findingsLoading) {
                      return true;
                    }

                    const toBoundary = boundaries.find(b => b.id === pendingBoundaryChange?.to_boundary_id);
                    if (!toBoundary) return true;

                    // Disable if PROD → NON-PROD detected
                    return pendingBoundaryChange?.systems?.some(s =>
                      s.environment === 'PROD' &&
                      toBoundary?.boundary_category === 'NON_PROD'
                    );
                  })()}
                >
                  {updateBoundaryMutation.isPending || bulkUpdateBoundaryMutation.isPending
                    ? 'Updating...'
                    : createApprovalRequestMutation.isPending
                      ? 'Submitting...'
                      : pendingBoundaryChange?.needsApproval && !isComplianceLead
                        ? 'Submit for Approval'
                        : 'Confirm Change'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}