import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { finding_id, severity, due_date, finding_number } = await req.json();

    if (!finding_id || !severity) {
      return Response.json({ error: 'finding_id and severity are required' }, { status: 400 });
    }

    // Define milestone templates based on severity
    let milestoneTemplates = [];
    
    if (severity === 'Critical' || severity === 'High') {
      milestoneTemplates = [
        { title: 'Triage & Root Cause Analysis', description: 'Investigate the finding and determine root cause' },
        { title: 'Remediation Plan Approved', description: 'Document and approve the remediation strategy' },
        { title: 'Fix Implemented', description: 'Deploy and configure the remediation' },
        { title: 'Validation / Retest', description: 'Verify the fix resolves the issue' },
        { title: 'Closure Documentation & Evidence', description: 'Collect evidence and finalize documentation' }
      ];
    } else if (severity === 'Medium') {
      milestoneTemplates = [
        { title: 'Triage & Assessment', description: 'Review finding and plan response' },
        { title: 'Fix Implemented', description: 'Deploy remediation' },
        { title: 'Validation / Retest', description: 'Verify fix effectiveness' },
        { title: 'Closure Documentation', description: 'Document resolution' }
      ];
    } else {
      milestoneTemplates = [
        { title: 'Planned Remediation', description: 'Schedule and plan fix' },
        { title: 'Fix Implemented', description: 'Deploy remediation' },
        { title: 'Validation', description: 'Verify completion' }
      ];
    }

    // Calculate milestone due dates
    const startDate = new Date();
    const endDate = due_date ? new Date(due_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    const totalDays = Math.max((endDate - startDate) / (1000 * 60 * 60 * 24), milestoneTemplates.length);
    const daysPerMilestone = totalDays / milestoneTemplates.length;

    // Create milestones
    const milestones = await Promise.all(
      milestoneTemplates.map((template, index) => {
        const milestoneDueDate = new Date(startDate.getTime() + (daysPerMilestone * (index + 1) * 24 * 60 * 60 * 1000));
        
        return base44.entities.Milestone.create({
          finding_id,
          finding_number,
          title: template.title,
          description: template.description,
          status: 'NOT_STARTED',
          due_date: milestoneDueDate.toISOString().split('T')[0],
          sequence_number: index + 1
        });
      })
    );

    return Response.json({ 
      success: true, 
      milestones_created: milestones.length,
      milestones 
    });

  } catch (error) {
    console.error('Error generating milestones:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});