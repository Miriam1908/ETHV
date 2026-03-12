import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useAccount } from 'wagmi';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useAccount();

  if (!isAuthenticated || !isConnected) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
