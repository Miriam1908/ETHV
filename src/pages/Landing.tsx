import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

export default function Landing() {
  const { isConnected, login, isAuthenticating } = useWallet();
  const { setToken } = useAuth();
  const navigate = useNavigate();

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
    } else {
      // Web3Modal handles connection
    }
  };

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
          ETHV is the first decentralized talent validation agent. Upload your CV, validate your skills, and unlock premium Web3 jobs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isConnected ? (
            <button
              onClick={handleStart}
              disabled={isAuthenticating}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              {isAuthenticating ? 'Signing...' : 'Enter Dashboard'}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="w-full sm:w-auto">
              {/* @ts-ignore */}
              <w3m-button />
            </div>
          )}
          <button className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 px-8 rounded-xl border border-zinc-800 transition-all">
            Learn More
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
