import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin, DollarSign, Zap, ExternalLink } from 'lucide-react';
import { Job } from '../types';

export default function Opportunities() {
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      // Mock data
      return [
        { id: '1', title: 'Senior Solidity Engineer', company: 'Uniswap Labs', matchScore: 98, description: 'Lead the development of next-gen AMM protocols.' },
        { id: '2', title: 'Full Stack Web3 Developer', company: 'Aave', matchScore: 92, description: 'Build intuitive interfaces for decentralized lending.' },
        { id: '3', title: 'Smart Contract Auditor', company: 'OpenZeppelin', matchScore: 85, description: 'Ensure the security of the world\'s most critical DeFi infrastructure.' },
        { id: '4', title: 'Protocol Researcher', company: 'Ethereum Foundation', matchScore: 78, description: 'Contribute to the core research of Ethereum 2.0.' },
      ] as Job[];
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Job Opportunities</h1>
        <p className="text-zinc-500 mt-1">Personalized matches based on your validated skill profile.</p>
      </header>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">Finding matches...</div>
        ) : (
          jobs?.map((job) => (
            <div key={job.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                    <Briefcase className="text-zinc-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-500 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-zinc-500 text-sm">
                      <span className="flex items-center gap-1.5"><Globe size={14} /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> Remote</span>
                      <span className="flex items-center gap-1.5"><DollarSign size={14} /> $140k - $220k</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold justify-end">
                      <Zap size={16} fill="currentColor" />
                      {job.matchScore}% Match
                    </div>
                    <div className="text-zinc-600 text-xs mt-1">Based on validated skills</div>
                  </div>
                  <button className="bg-zinc-100 hover:bg-white text-black font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2">
                    Apply Now
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-zinc-900">
                <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                  {job.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Solidity', 'EVM', 'DeFi', 'Security'].map(tag => (
                    <span key={tag} className="text-[10px] font-bold tracking-wider uppercase bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper for Globe icon which I missed in imports
import { Globe } from 'lucide-react';
