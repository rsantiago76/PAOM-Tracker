import React from 'react';
import { AlertTriangle, ShieldAlert, Ban } from 'lucide-react';

export default function BoundaryChangeWarningBanner({ 
  system, 
  systems,
  fromBoundary, 
  toBoundary,
  isBlocked = false 
}) {
  const fromCategory = fromBoundary?.boundary_category;
  const toCategory = toBoundary?.boundary_category;
  const fromAuthStatus = fromBoundary?.authorization_status;
  const toAuthStatus = toBoundary?.authorization_status;
  
  // Determine warning type and severity
  let severity = null; // 'red' or 'yellow'
  let title = '';
  let message = '';
  let Icon = AlertTriangle;
  
  // === RED BANNER CONDITIONS (HIGH RISK / BLOCKED / APPROVAL) ===
  
  // Check for PROD → NON-PROD (blocked)
  const isProdToNonProd = system?.environment === 'PROD' && toCategory === 'NON_PROD';
  const hasProdToNonProdInBulk = systems?.some(s => s.environment === 'PROD' && toCategory === 'NON_PROD');
  
  if (isProdToNonProd || hasProdToNonProdInBulk) {
    severity = 'red';
    Icon = Ban;
    title = 'Blocked: PROD → Non-Prod';
    message = 'PROD systems cannot be moved into a Non-Prod boundary. Choose a PROD boundary instead.';
  }
  // Check for EXTERNAL → PROD (approval required)
  else if (fromCategory === 'EXTERNAL' && toCategory === 'PROD') {
    severity = 'red';
    Icon = ShieldAlert;
    title = 'Approval Required: External → PROD';
    message = 'Moving a system from EXTERNAL into a PROD boundary requires Compliance Lead approval. Your request will be queued for review.';
  }
  // Check for any EXTERNAL involvement (general risk)
  else if (fromCategory === 'EXTERNAL' || toCategory === 'EXTERNAL') {
    severity = 'red';
    Icon = AlertTriangle;
    title = 'Risk Warning: External Boundary';
    message = 'This change affects an EXTERNAL boundary. External dependencies may increase risk and require additional evidence and approvals.';
  }
  
  // === YELLOW BANNER CONDITIONS (MEDIUM RISK / CAUTION) ===
  // Only check if no red condition was triggered
  else {
    // A) Target boundary_category == SHARED
    if (toCategory === 'SHARED') {
      severity = 'yellow';
      Icon = AlertTriangle;
      title = 'Caution: Scope Change';
      message = 'You are moving this system into a SHARED services boundary. Shared boundaries increase blast radius and require careful control inheritance review.';
    }
    // B) Moving into PROD from SHARED or NON_PROD
    else if ((fromCategory === 'SHARED' || fromCategory === 'NON_PROD') && toCategory === 'PROD') {
      severity = 'yellow';
      Icon = AlertTriangle;
      title = 'Caution: Scope Change';
      message = 'You are moving this system into a PROD boundary. Ensure controls, monitoring, and evidence are updated for the new scope.';
    }
    // C) Authorization status changes
    else if (fromAuthStatus && toAuthStatus && fromAuthStatus !== toAuthStatus) {
      severity = 'yellow';
      Icon = AlertTriangle;
      title = 'Caution: Scope Change';
      message = 'Authorization posture differs between these boundaries. Ensure documentation and evidence align with the new scope.';
    }
  }
  
  // If no warning conditions met, don't render anything
  if (!severity) return null;
  
  // Style based on severity
  const bgColor = severity === 'red' 
    ? 'bg-red-500/10 border-red-500/30' 
    : 'bg-amber-500/10 border-amber-500/30';
  
  const titleColor = severity === 'red'
    ? 'text-red-200'
    : 'text-amber-200';
  
  const iconColor = severity === 'red'
    ? 'text-red-300'
    : 'text-amber-300';
  
  return (
    <div 
      className={`${bgColor} border rounded-xl p-4 flex items-start gap-3`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <h4 className={`${titleColor} font-semibold text-sm mb-1`}>
          {title}
        </h4>
        <p className="text-slate-200 text-sm leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}