import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useAccount } from 'wagmi';

const WALLET_BYPASS = import.meta.env.VITE_WALLET_BYPASS === 'true';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useAccount();

  if (WALLET_BYPASS) return <Outlet />;

  // Allow access via wallet OR social login (Google/LinkedIn)
  const provider = localStorage.getItem('ethv_auth_provider');
  const isSocialLogin = isAuthenticated && (provider === 'google' || provider === 'linkedin');

  if (!isAuthenticated || (!isConnected && !isSocialLogin)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
