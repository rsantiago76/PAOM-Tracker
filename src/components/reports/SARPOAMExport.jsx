import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/amplifyClient';
import { getCurrentUserProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SARPOAMExport() {
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    boundary: '',
    system: '',
    startDate: '',
    endDate: '',
    status: 'all',
    includeEvidence: true,
  });

  const { toast } = useToast();

  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      const { data } = await client.models.Finding.list();
      return data.map(f => ({ ...f, system_id: f.systemId, created_date: f.createdAt }));
    },
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const { data } = await client.models.System.list();
      return data;
    },
  });

  const { data: boundaries = [] } = useQuery({
    queryKey: ['boundaries'],
    queryFn: async () => {
      const { data } = await client.models.Boundary.list();
      return data;
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: async () => {
      const { data } = await client.models.Milestone.list();
      return data.map(m => ({
        ...m,
        due_date: m.dueDate,
        finding_id: m.findingId,
        owner_name: m.assignedTo, // Mapping assignedTo to owner_name if needed
      }));
    },
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['milestoneEvidence'],
    queryFn: async () => {
      const { data } = await client.models.MilestoneEvidence.list();
      return data.map(e => ({
        ...e,
        milestone_id: e.milestoneId,
        uploaded_by_name: e.uploadedByName,
        created_date: e.createdAt,
        file_sha256: e.fileSha256,
        file_size_bytes: e.fileSizeBytes,
        file_name: e.fileName,
      }));
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUserProfile(),
  });

  const filteredFindings = findings.filter(f => {
    if (filters.boundary && f.system_id) {
      const sys = systems.find(s => s.id === f.system_id);
      if (!sys || sys.boundary !== filters.boundary) return false;
    }
    if (filters.system && f.system_id !== filters.system) return false;
    if (filters.status !== 'all' && f.status !== filters.status) return false;
    if (filters.startDate && f.created_date < filters.startDate) return false;
    if (filters.endDate && f.created_date > filters.endDate) return false;
    return true;
  });

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Cover Page
      doc.setFontSize(24);
      doc.text('Security Assessment Report (SAR)', 105, yPos, { align: 'center' });
      yPos += 10;
      doc.text('Plan of Action & Milestones (POA&M)', 105, yPos, { align: 'center' });
      yPos += 20;

      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: 'center' });
      yPos += 10;
      doc.text(`Prepared by: ${currentUser?.full_name || 'Unknown'}`, 105, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(10);
      doc.text('Scope:', 20, yPos);
      yPos += 7;
      if (filters.boundary) {
        doc.text(`• Boundary: ${filters.boundary}`, 25, yPos);
        yPos += 7;
      }
      if (filters.system) {
        const sys = systems.find(s => s.id === filters.system);
        doc.text(`• System: ${sys?.name || 'Unknown'}`, 25, yPos);
        yPos += 7;
      }
      if (filters.status !== 'all') {
        doc.text(`• Status: ${filters.status}`, 25, yPos);
        yPos += 7;
      }

      // Executive Summary
      doc.addPage();
      yPos = 20;
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      const openFindings = filteredFindings.filter(f => f.status !== 'Closed' && f.status !== 'Risk Accepted');
      const closedFindings = filteredFindings.filter(f => f.status === 'Closed' || f.status === 'Risk Accepted');

      const severityCounts = {
        Critical: filteredFindings.filter(f => f.severity === 'Critical' && f.status !== 'Closed').length,
        High: filteredFindings.filter(f => f.severity === 'High' && f.status !== 'Closed').length,
        Medium: filteredFindings.filter(f => f.severity === 'Medium' && f.status !== 'Closed').length,
        Low: filteredFindings.filter(f => f.severity === 'Low' && f.status !== 'Closed').length,
      };

      doc.text(`Total Findings: ${filteredFindings.length}`, 20, yPos);
      yPos += 7;
      doc.text(`Open: ${openFindings.length} | Closed: ${closedFindings.length}`, 20, yPos);
      yPos += 10;

      doc.text('Open Findings by Severity:', 20, yPos);
      yPos += 7;
      doc.text(`• Critical: ${severityCounts.Critical}`, 25, yPos);
      yPos += 7;
      doc.text(`• High: ${severityCounts.High}`, 25, yPos);
      yPos += 7;
      doc.text(`• Medium: ${severityCounts.Medium}`, 25, yPos);
      yPos += 7;
      doc.text(`• Low: ${severityCounts.Low}`, 25, yPos);
      yPos += 15;

      // Milestone health
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueMilestones = milestones.filter(m => {
        if (m.status === 'COMPLETED' || !m.due_date) return false;
        const dueDate = new Date(m.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      doc.text('Milestone Health:', 20, yPos);
      yPos += 7;
      doc.text(`• Total Milestones: ${milestones.length}`, 25, yPos);
      yPos += 7;
      doc.text(`• Overdue: ${overdueMilestones.length}`, 25, yPos);
      yPos += 7;
      doc.text(`• Completed: ${milestones.filter(m => m.status === 'COMPLETED').length}`, 25, yPos);

      // Findings Detail Section
      if (filteredFindings.length > 0) {
        filteredFindings.forEach((finding, idx) => {
          doc.addPage();
          yPos = 20;

          doc.setFontSize(14);
          doc.text(`Finding ${idx + 1}: ${finding.finding_number}`, 20, yPos);
          yPos += 10;

          doc.setFontSize(10);
          doc.text(`Title: ${finding.title}`, 20, yPos);
          yPos += 7;
          doc.text(`System: ${finding.system_name || 'N/A'}`, 20, yPos);
          yPos += 7;

          const sys = systems.find(s => s.id === finding.system_id);
          doc.text(`Boundary: ${sys?.boundary || 'N/A'}`, 20, yPos);
          yPos += 7;
          doc.text(`Severity: ${finding.severity} | Status: ${finding.status}`, 20, yPos);
          yPos += 7;
          doc.text(`Due Date: ${finding.due_date ? new Date(finding.due_date).toLocaleDateString() : 'N/A'}`, 20, yPos);
          yPos += 7;
          doc.text(`Risk Level: ${finding.risk_level || 'N/A'}`, 20, yPos);
          yPos += 10;

          if (finding.description) {
            doc.text('Description:', 20, yPos);
            yPos += 7;
            const descLines = doc.splitTextToSize(finding.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5 + 5;
          }

          // Milestones table
          const findingMilestones = milestones.filter(m => m.finding_id === finding.id);
          if (findingMilestones.length > 0) {
            yPos += 5;
            doc.setFontSize(12);
            doc.text('Milestones:', 20, yPos);
            yPos += 5;

            const milestoneRows = findingMilestones.map(m => {
              const evidenceCount = evidence.filter(e => e.milestone_id === m.id).length;
              return [
                m.title,
                m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A',
                m.status,
                m.owner_name || 'Unassigned',
                `${evidenceCount} item(s)`
              ];
            });

            doc.autoTable({
              startY: yPos,
              head: [['Milestone', 'Due Date', 'Status', 'Owner', 'Evidence']],
              body: milestoneRows,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [51, 65, 85] },
            });
          }
        });
      } else {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(12);
        doc.text('No findings match the selected filters.', 20, yPos);
      }

      // Evidence Appendix
      if (filters.includeEvidence && filteredFindings.length > 0) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(16);
        doc.text('Evidence Appendix', 20, yPos);
        yPos += 10;

        filteredFindings.forEach((finding) => {
          const findingMilestones = milestones.filter(m => m.finding_id === finding.id);

          findingMilestones.forEach((milestone) => {
            const milestoneEvidence = evidence.filter(e => e.milestone_id === milestone.id);

            if (milestoneEvidence.length > 0) {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }

              doc.setFontSize(11);
              doc.text(`${finding.finding_number} - ${milestone.title}`, 20, yPos);
              yPos += 7;

              milestoneEvidence.forEach((ev) => {
                doc.setFontSize(9);
                doc.text(`• ${ev.title} (${ev.type})`, 25, yPos);
                yPos += 5;
                doc.text(`  Uploaded by: ${ev.uploaded_by_name} on ${new Date(ev.created_date).toLocaleDateString()}`, 25, yPos);
                yPos += 5;
                if (ev.file_sha256) {
                  doc.text(`  SHA-256: ${ev.file_sha256}`, 25, yPos);
                  yPos += 5;
                }
                if (ev.file_name && ev.file_size_bytes) {
                  const sizeMB = (ev.file_size_bytes / (1024 * 1024)).toFixed(2);
                  doc.text(`  File: ${ev.file_name} (${sizeMB} MB)`, 25, yPos);
                  yPos += 5;
                }
                yPos += 3;
              });
              yPos += 5;
            }
          });
        });
      }

      const fileName = `SAR-POAM-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast({ title: 'PDF generated successfully' });
    } catch (error) {
      toast({ title: 'PDF generation failed', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/45 border border-slate-700/60 backdrop-blur shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            SAR / POA&M Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Boundary (Optional)</Label>
              <select
                value={filters.boundary}
                onChange={(e) => setFilters({ ...filters, boundary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200"
              >
                <option value="">All Boundaries</option>
                {boundaries.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">System (Optional)</Label>
              <select
                value={filters.system}
                onChange={(e) => setFilters({ ...filters, system: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200"
              >
                <option value="">All Systems</option>
                {systems.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Start Date (Optional)</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">End Date (Optional)</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Closed">Closed</option>
                <option value="Risk Accepted">Risk Accepted</option>
              </select>
            </div>

            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.includeEvidence}
                  onChange={(e) => setFilters({ ...filters, includeEvidence: e.target.checked })}
                  className="rounded"
                />
                Include Evidence Appendix
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {filteredFindings.length} finding(s) will be included in the report
              </div>
              <Button
                onClick={generatePDF}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}