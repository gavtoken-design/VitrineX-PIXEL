
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { TranslationSet } from '../translations';

interface AnalyzePanelProps {
  onAnalyze: (prompt: string) => void;
  analysisResult: string | null;
  isLoading: boolean;
  t: TranslationSet;
}

const AnalyzePanel: React.FC<AnalyzePanelProps> = ({ onAnalyze, analysisResult, isLoading, t }) => {
  const [prompt, setPrompt] = useState(t.analyzeDefault);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(prompt);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-100">{t.analyzeTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{t.analyzeSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.analyzePlaceholder}
          className="flex-1 bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {isLoading ? t.analyzeThinking : t.analyzeButton}
        </button>
      </form>

      {analysisResult && (
        <div className="bg-black/30 border border-gray-700 rounded-xl p-4 text-gray-200 text-sm whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
          {analysisResult}
        </div>
      )}
    </div>
  );
};

export default AnalyzePanel;
