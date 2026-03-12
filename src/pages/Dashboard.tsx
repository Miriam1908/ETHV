import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { useWallet } from '../hooks/useWallet';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Skill } from '../types';

export default function Dashboard() {
  const { address } = useWallet();

  const { data: skills, isLoading } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      // In a real app, this would be:
      // const response = await apiClient.get('/user/skills');
      // return response.data;
      
      // Mock data for demo
      return [
        { id: '1', name: 'Solidity', level: 'expert', isValidated: true },
        { id: '2', name: 'React', level: 'intermediate', isValidated: true },
        { id: '3', name: 'TypeScript', level: 'intermediate', isValidated: false },
        { id: '4', name: 'Rust', level: 'beginner', isValidated: false },
      ] as Skill[];
    },
  });

  const stats = [
    { label: 'Validated Skills', value: skills?.filter(s => s.isValidated).length || 0, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Pending Validation', value: skills?.filter(s => !s.isValidated).length || 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Profile Score', value: '850', icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Open Opportunities', value: '12', icon: AlertCircle, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Talent Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back, <span className="font-mono text-zinc-300">{address}</span></p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={stat.color} size={24} />
              <span className="text-zinc-600 text-xs font-medium uppercase tracking-wider">Stat</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-zinc-500 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Skills List */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Your Skills</h2>
              <button className="text-emerald-500 text-sm font-medium hover:underline">Add New</button>
            </div>
            <div className="divide-y divide-zinc-900">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500">Loading skills...</div>
              ) : (
                skills?.map((skill) => (
                  <div key={skill.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors">
                    <div>
                      <h3 className="text-white font-medium">{skill.name}</h3>
                      <span className="text-zinc-500 text-xs capitalize">{skill.level}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {skill.isValidated ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12} />
                          Validated
                        </span>
                      ) : (
                        <button className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full hover:border-zinc-700 transition-colors">
                          Validate Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all">
                Upload New CV
              </button>
              <button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl border border-zinc-800 transition-all">
                Take Skill Test
              </button>
              <button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl border border-zinc-800 transition-all">
                Browse Jobs
              </button>
            </div>
          </section>

          <section className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Pro Tip</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Validating your core skills increases your visibility to top-tier Web3 projects by 400%.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
