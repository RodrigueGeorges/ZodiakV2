import { ReactNode } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { LoadingScreen } from './LoadingScreen';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { redirectTo } = useAuthRedirect();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    redirectTo('/login');
    return <LoadingScreen />;
  }

  return <>{children}</>;
} 