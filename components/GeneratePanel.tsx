
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { TranslationSet } from '../translations';

interface GeneratePanelProps {
  onGenerate: (prompt: string, aspectRatio: string) => void;
  isLoading: boolean;
  t: TranslationSet;
}

const GeneratePanel: React.FC<GeneratePanelProps> = ({ onGenerate, isLoading, t }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const ratios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, aspectRatio);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-100">{t.genTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{t.genSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.genPlaceholder}
          className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-lg"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-400">{t.genRatio}</label>
          <div className="flex flex-wrap gap-2">
            {ratios.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  aspectRatio === r 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? t.genLoading : t.genButton}
        </button>
      </form>
    </div>
  );
};

export default GeneratePanel;
