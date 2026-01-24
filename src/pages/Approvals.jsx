import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ApprovalRequestsList from '../components/approvals/ApprovalRequestsList';

export default function Approvals() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isComplianceLead = currentUser?.role === 'admin';

  if (!isComplianceLead) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        .approvals-page-wrapper {
          position: relative;
          overflow: hidden;
        }
        
        .approvals-page-wrapper::before {
          content: '';
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(
            ellipse at center,
            rgba(34, 197, 94, 0.08) 0%,
            rgba(217, 119, 6, 0.04) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }
        
        .approvals-page-wrapper::after {
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
        
        .approvals-page-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <div className="approvals-page-wrapper">
        <div className="approvals-page-content">
          <ApprovalRequestsList />
        </div>
      </div>
    </div>
  );
}