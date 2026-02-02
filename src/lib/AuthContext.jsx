import React, { createContext, useState, useContext, useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import { signOut } from 'aws-amplify/auth';
import { getCurrentUserProfile } from '@/lib/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUser();

    // Listen for auth events (sign in, sign out)
    const hubListener = Hub.listen('auth', (data) => {
      const { payload } = data;
      if (payload.event === 'signedIn') {
        checkUser();
      } else if (payload.event === 'signedOut') {
        setUser(null);
        setIsAuthenticated(false);
        setImpersonatedRole(null);
      }
    });

    return () => hubListener();
  }, []);

  const checkUser = async () => {
    try {
      setIsLoadingAuth(true);

      const currentUser = await getCurrentUserProfile();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const [impersonatedRole, setImpersonatedRole] = useState(null);

  const switchRole = (role) => {
    setImpersonatedRole(role);
  };

  const activeUser = user ? { ...user, role: impersonatedRole || user.role } : null;

  const loginAsDemoUser = () => {
    localStorage.setItem('poam_demo_mode', 'true');
    checkUser();
  };

  const logout = async (shouldRedirect = true) => {
    try {
      localStorage.removeItem('poam_demo_mode'); // Clear demo mode
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      setImpersonatedRole(null);
      if (shouldRedirect) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user: activeUser,
      originalUser: user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      checkAppState: checkUser,
      switchRole,
      impersonatedRole,
      loginAsDemoUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
