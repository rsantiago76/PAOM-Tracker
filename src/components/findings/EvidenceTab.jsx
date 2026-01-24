import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Upload, FileText, X, ExternalLink } from 'lucide-react';

export default function EvidenceTab({ findingId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    evidence_type: 'Document',
    file_url: '',
    file_name: '',
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence', findingId],
    queryFn: () => base44.entities.Evidence.filter({ finding_id: findingId }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create({
      ...data,
      finding_id: findingId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', findingId] });
      setShowForm(false);
      setFormData({ title: '', notes: '', evidence_type: 'Document', file_url: '', file_name: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', findingId] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        file_url: result.file_url,
        file_name: file.name,
      }));
    } catch (error) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Evidence</h3>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Cancel' : 'Add Evidence'}
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
                placeholder="Evidence title"
              />
            </div>

            <div>
              <Label>Evidence Type</Label>
              <select
                value={formData.evidence_type}
                onChange={(e) => setFormData({ ...formData, evidence_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="Screenshot">Screenshot</option>
                <option value="Document">Document</option>
                <option value="Log File">Log File</option>
                <option value="Scan Report">Scan Report</option>
                <option value="Configuration">Configuration</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label>Upload File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <span className="text-sm text-slate-500">Uploading...</span>}
              </div>
              {formData.file_name && (
                <p className="text-xs text-green-600 mt-1">✓ {formData.file_name}</p>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this evidence"
                rows={2}
              />
            </div>

            <Button 
              type="submit" 
              size="sm" 
              disabled={createMutation.isPending || !formData.file_url}
            >
              {createMutation.isPending ? 'Adding...' : 'Add Evidence'}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {evidence.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No evidence uploaded yet.</p>
          ) : (
            evidence.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.evidence_type} • {item.file_name}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-slate-600 mt-2">{item.notes}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Uploaded {new Date(item.created_date).toLocaleDateString()} by {item.created_by}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Delete this evidence?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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