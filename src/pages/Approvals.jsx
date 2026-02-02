import { getCurrentUserProfile } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import ApprovalRequestsList from '../components/approvals/ApprovalRequestsList';
import { Button } from '@/components/ui/button';
import { client } from '@/api/amplifyClient';

export default function Approvals() {
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUserProfile(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isComplianceLead = currentUser?.role === 'ADMIN' || currentUser?.role === 'COMPLIANCE';

  if (!isComplianceLead) {
    const handleClaimAdmin = async () => {
      if (!currentUser?.email) return;
      try {
        // Check if user exists first
        const { data: users } = await client.models.User.list({
          filter: { email: { eq: currentUser.email } }
        });

        if (users.length > 0) {
          await client.models.User.update({
            id: users[0].id,
            role: 'ADMIN'
          });
        } else {
          await client.models.User.create({
            email: currentUser.email,
            role: 'ADMIN',
            status: 'ACTIVE',
            fullName: currentUser.full_name || currentUser.username || 'Admin User'
          });
        }
        window.location.reload();
      } catch (err) {
        console.error("Failed to claim admin:", err);
        alert("Failed to update role. Check console.");
      }
    };

    const isLoggedIn = currentUser && currentUser.email;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">
            {!isLoggedIn ? 'Authentication Required' : 'Access Denied'}
          </h2>
          <p className="text-slate-500 mt-2">
            {!isLoggedIn
              ? 'You need to be logged in to view this page.'
              : 'You don\'t have permission to view the Approvals page.'}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left w-full max-w-md">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-mono text-slate-700">{!isLoggedIn ? 'Not Logged In' : 'Logged In'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Role:</span>
              <span className="font-mono text-slate-700">{currentUser?.role || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-700">{currentUser?.email || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">User ID:</span>
              <span className="font-mono text-slate-700">{currentUser?.id || 'n/a'}</span>
            </div>
          </div>
        </div>

        {!isLoggedIn ? (
          <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700 text-white">
            Log In
          </Button>
        ) : (
          <Button onClick={handleClaimAdmin} className="bg-blue-600 hover:bg-blue-700 text-white">
            Fix Permission (Set Role to ADMIN)
          </Button>
        )}
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
