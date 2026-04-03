import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../store/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Zap, Globe, ArrowRight, AlertCircle, FileUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

export default function Landing() {
  const { isConnected, login, isAuthenticating } = useWallet();
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authError = searchParams.get('auth_error');

  const handleStart = async () => {
    if (isConnected) {
      try {
        const token = await login();
        if (token) {
          setToken(token);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Login error', error);
      }
    }
  };

  const handleGoogleLogin   = () => { window.location.href = `${BACKEND}/auth/google`; };
  const handleLinkedInLogin = () => { window.location.href = `${BACKEND}/auth/linkedin`; };
  const handleGitHubLogin   = () => { window.location.href = `${BACKEND}/auth/github`; };

  const features = [
    {
      title: 'Decentralized Validation',
      description: 'Your skills are validated by AI and stored on-chain for permanent proof.',
      icon: Shield,
      color: 'text-emerald-500',
    },
    {
      title: 'AI-Powered Matching',
      description: 'Get matched with high-paying Web3 opportunities based on your verified talent.',
      icon: Zap,
      color: 'text-blue-500',
    },
    {
      title: 'Global Opportunities',
      description: 'Access a worldwide network of decentralized projects looking for verified experts.',
      icon: Globe,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-24">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-20">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
        >
          Verify Your Talent <br />
          <span className="text-emerald-500">On the Blockchain</span>
        </motion.h1>
        <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl mx-auto mb-10">
          LikeTalent es la plataforma de validación de talento y habilidades. Sube tu CV, valida tus skills y accede a oportunidades premium.
        </p>
        {/* CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Link
            to="/upload"
            className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-lg py-5 px-10 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 group"
          >
            <FileUp size={22} className="group-hover:-translate-y-0.5 transition-transform" />
            Sube tu CV
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-zinc-600 text-xs mt-3">Análisis con IA · Gratis · Sin registro previo</p>
        </motion.div>

        {/* Auth error banner */}
        {authError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-xl mb-4 max-w-md mx-auto">
            <AlertCircle size={15} /> Login failed ({authError}). Please try again.
          </div>
        )}

        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto w-full">
          {/* Wallet */}
          {isConnected ? (
            <button
              onClick={handleStart}
              disabled={isAuthenticating}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              {isAuthenticating ? 'Signing...' : 'Enter Dashboard'}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="w-full flex justify-center">
              {/* @ts-ignore */}
              <w3m-button />
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">o continúa con</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all border border-zinc-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* LinkedIn OAuth */}
          <button
            onClick={handleLinkedInLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#0077B5] hover:bg-[#005e93] text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continuar con LinkedIn
          </button>

          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1a1e22] text-white font-semibold py-3 px-6 rounded-xl transition-all border border-zinc-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continuar con GitHub
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 w-full">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl hover:border-zinc-700 transition-all"
          >
            <feature.icon className={cn("mb-6", feature.color)} size={40} />
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
