import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, FileText, Download, X, ExternalLink, Shield, AlertTriangle, Copy, CheckCircle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import ChainOfCustodyViewer from '../evidence/ChainOfCustodyViewer';

export default function MilestoneEvidenceSection({ milestoneId, findingId }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    type: 'OTHER',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedEvidenceForCustody, setSelectedEvidenceForCustody] = useState(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ['milestoneEvidence', milestoneId],
    queryFn: async () => {
      const all = await base44.entities.MilestoneEvidence.list();
      return all.filter(e => e.milestone_id === milestoneId);
    },
    enabled: !!milestoneId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Create chain of custody log
  const logCustodyEvent = async (evidenceId, action, notes = '', hashSnapshot = null) => {
    try {
      await base44.entities.EvidenceChainOfCustody.create({
        evidence_id: evidenceId,
        finding_id: findingId,
        milestone_id: milestoneId,
        actor_user_id: currentUser?.id || 'unknown',
        actor_name: currentUser?.full_name || 'Unknown User',
        actor_role: currentUser?.role || 'unknown',
        action,
        action_at: new Date().toISOString(),
        hash_snapshot_sha256: hashSnapshot,
        notes: notes || undefined,
      });
    } catch (error) {
      console.error('Failed to log custody event:', error);
    }
  };

  const deleteEvidenceMutation = useMutation({
    mutationFn: async ({ evidenceId, reason }) => {
      return base44.entities.MilestoneEvidence.delete(evidenceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestoneEvidence'] });
      toast({ title: 'Evidence deleted' });
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const computeSHA256 = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.title) {
      toast({ title: 'Please select a file and provide a title', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const sha256Hash = await computeSHA256(selectedFile);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const newEvidence = await base44.entities.MilestoneEvidence.create({
        milestone_id: milestoneId,
        finding_id: findingId,
        uploaded_by_user_id: currentUser.id,
        uploaded_by_name: currentUser.full_name,
        title: formData.title,
        notes: formData.notes,
        type: formData.type,
        file_url,
        file_name: selectedFile.name,
        file_sha256: sha256Hash,
        file_size_bytes: selectedFile.size,
        file_mime_type: selectedFile.type || 'application/octet-stream',
        original_filename: selectedFile.name,
        integrity_status: 'VERIFIED',
        verified_at: new Date().toISOString(),
        verified_by_user_id: currentUser.id,
      });

      // Log custody events
      await logCustodyEvent(newEvidence.id, 'UPLOADED', `File: ${selectedFile.name}`, sha256Hash);
      await logCustodyEvent(newEvidence.id, 'VERIFIED', 'Initial upload verification', sha256Hash);

      queryClient.invalidateQueries({ queryKey: ['milestoneEvidence'] });
      toast({ title: 'Evidence uploaded and verified successfully' });
      
      setFormData({ title: '', notes: '', type: 'OTHER' });
      setSelectedFile(null);
      setShowUploadForm(false);
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleDelete = async (ev) => {
    const reason = window.prompt('Please provide a reason for deleting this evidence:');
    if (reason && reason.trim()) {
      await logCustodyEvent(ev.id, 'DELETED', `Deletion reason: ${reason}`, ev.file_sha256);
      deleteEvidenceMutation.mutate({ evidenceId: ev.id, reason });
    } else if (reason !== null) {
      toast({ title: 'Deletion cancelled', description: 'A reason is required to delete evidence', variant: 'destructive' });
    }
  };

  const handleView = async (ev) => {
    await logCustodyEvent(ev.id, 'VIEWED', `Viewed evidence: ${ev.title}`);
    setSelectedEvidenceForCustody(selectedEvidenceForCustody === ev.id ? null : ev.id);
  };

  const handleDownload = async (ev) => {
    await logCustodyEvent(ev.id, 'DOWNLOADED', `Downloaded: ${ev.file_name}`, ev.file_sha256);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const typeColors = {
    SCREENSHOT: 'bg-blue-900/30 text-blue-300 border-blue-700',
    REPORT: 'bg-purple-900/30 text-purple-300 border-purple-700',
    POLICY: 'bg-green-900/30 text-green-300 border-green-700',
    CONFIG: 'bg-amber-900/30 text-amber-300 border-amber-700',
    SCAN_RESULT: 'bg-red-900/30 text-red-300 border-red-700',
    OTHER: 'bg-slate-700/30 text-slate-300 border-slate-600',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">
            Evidence ({evidence.length})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700/50"
        >
          <Upload className="w-3 h-3 mr-1" />
          Attach
        </Button>
      </div>

      {showUploadForm && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/40 space-y-3">
          <div className="space-y-2">
            <Label className="text-slate-300">File</Label>
            <Input
              type="file"
              onChange={handleFileSelect}
              className="bg-slate-900 border-slate-700 text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Evidence title"
              className="bg-slate-900 border-slate-700 text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Type</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
            >
              <option value="SCREENSHOT">Screenshot</option>
              <option value="REPORT">Report</option>
              <option value="POLICY">Policy Document</option>
              <option value="CONFIG">Configuration</option>
              <option value="SCAN_RESULT">Scan Result</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional context..."
              className="bg-slate-900 border-slate-700 text-slate-200"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
                setFormData({ title: '', notes: '', type: 'OTHER' });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {evidence.length > 0 && (
        <div className="space-y-2">
          {evidence.map((ev) => (
            <div
              key={ev.id}
              className="bg-slate-800/20 rounded p-3 border border-slate-700/30 space-y-2"
            >
              {ev.integrity_status === 'MISMATCH' && (
                <div className="bg-red-900/30 border border-red-700/50 rounded p-2 flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-300">Integrity Check Failed</p>
                    <p className="text-xs text-red-200/80">Hash mismatch detected. Do not rely on this artifact.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-200">{ev.title}</span>
                    <Badge className={`${typeColors[ev.type]} text-xs`}>
                      {ev.type.replace('_', ' ')}
                    </Badge>
                    {ev.integrity_status === 'VERIFIED' && ev.file_sha256 && (
                      <Badge className="bg-green-900/50 text-green-200 border-green-700 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                    {ev.integrity_status === 'MISMATCH' && (
                      <Badge className="bg-red-900/50 text-red-200 border-red-700 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Mismatch
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">
                      {ev.original_filename || ev.file_name} 
                      {ev.file_size_bytes && ` • ${formatFileSize(ev.file_size_bytes)}`}
                      {ev.file_mime_type && ` • ${ev.file_mime_type}`}
                    </p>
                    {ev.file_sha256 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">
                          SHA-256: {ev.file_sha256.substring(0, 8)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(ev.file_sha256)}
                          className="text-slate-400 hover:text-slate-200"
                          title="Copy full hash"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-slate-400 mt-1">{ev.notes}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Uploaded by {ev.uploaded_by_name} on {new Date(ev.created_date).toLocaleDateString()}
                    {ev.verified_at && ` • Verified ${new Date(ev.verified_at).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(ev)}
                    className="text-slate-400 hover:text-slate-200 h-6 w-6"
                    title="View chain of custody"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <a
                    href={ev.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDownload(ev)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {currentUser?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ev)}
                      className="text-red-400 hover:text-red-300 h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {selectedEvidenceForCustody === ev.id && (
                <div className="mt-3 pt-3 border-t border-slate-700/40">
                  <ChainOfCustodyViewer 
                    evidenceId={ev.id} 
                    findingId={findingId}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}