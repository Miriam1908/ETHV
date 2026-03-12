import React from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'motion/react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-grow container mx-auto px-4 py-8 max-w-7xl"
      >
        {children}
      </motion.main>
      <footer className="bg-zinc-950 border-t border-zinc-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-500 text-sm">
          <p>&copy; 2026 ETHV Talent Validation Agent. Built on Ethereum.</p>
        </div>
      </footer>
    </div>
  );
}
