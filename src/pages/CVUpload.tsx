import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import { motion, AnimatePresence } from 'motion/react';

export default function CVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('cv', file);

    try {
      // In a real app:
      // const response = await apiClient.post('/cv/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      // setExtractedSkills(response.data.skills);
      
      // Mock delay and response
      await new Promise(resolve => setTimeout(resolve, 2000));
      setExtractedSkills(['Solidity', 'Smart Contracts', 'React', 'Web3.js', 'Ethers.js', 'Hardhat']);
      setUploadStatus('success');
    } catch (error) {
      console.error('Upload failed', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Upload Your CV</h1>
        <p className="text-zinc-500">Our AI will analyze your experience and extract relevant Web3 skills for validation.</p>
      </header>

      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 md:p-12">
        <div 
          className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById('cv-input')?.click()}
        >
          <input 
            id="cv-input"
            type="file" 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
            <Upload className="text-emerald-500" size={32} />
          </div>
          {file ? (
            <div className="flex items-center gap-2 text-white font-medium">
              <FileText size={20} className="text-zinc-400" />
              {file.name}
            </div>
          ) : (
            <>
              <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-zinc-500 text-sm">PDF (max. 5MB)</p>
            </>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing CV...
              </>
            ) : (
              'Start Analysis'
            )}
          </button>
        </div>

        <AnimatePresence>
          {uploadStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-6"
            >
              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <Check size={20} />
                Analysis Complete
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Extracted Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, idx) => (
                    <span key={idx} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm">
                Great! We've found {extractedSkills.length} skills. You can now proceed to validate them to earn your on-chain credentials.
              </div>
              <button className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-xl transition-all">
                Proceed to Validation
              </button>
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm flex items-center gap-2"
            >
              <AlertCircle size={20} />
              Failed to upload CV. Please try again.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
