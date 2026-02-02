import React, { useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
    const { isAuthenticated, loginAsDemoUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-4">
            <Authenticator />

            <div className="text-center">
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm">Or</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                </div>
                <button
                    onClick={loginAsDemoUser}
                    className="px-6 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm font-medium"
                >
                    View Demo (Public)
                </button>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                    Access a read-only demo version of the platform without signing in.
                </p>
            </div>
        </div>
    );

}
