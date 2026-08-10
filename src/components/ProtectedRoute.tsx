import React from 'react';
import { Navigate } from 'react-router-dom';
import { subscribeToAuthState } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    return subscribeToAuthState((authed) => {
      setIsAuthenticated(authed);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-school-light-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-school-blue border-t-school-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-school-blue uppercase tracking-widest">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
