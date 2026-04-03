import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token    = params.get('token');
    const name     = params.get('name');
    const provider = params.get('provider');
    const error    = params.get('auth_error');

    if (error || !token) {
      navigate('/?auth_error=' + (error || 'unknown'));
      return;
    }

    // Store token + user info
    setToken(token);
    if (name) localStorage.setItem('ethv_user_name', decodeURIComponent(name));
    if (provider) localStorage.setItem('ethv_auth_provider', provider);

    navigate('/dashboard');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 size={36} className="animate-spin text-emerald-500" />
      <p className="text-zinc-400 text-sm">Iniciando sesión...</p>
    </div>
  );
}
