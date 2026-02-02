
import React, { useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
    const { route } = useAuthenticator((context) => [context.route]);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        if (route === 'authenticated') {
            navigate(from, { replace: true });
        }
    }, [route, navigate, from]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <Authenticator />
        </div>
    );
}
