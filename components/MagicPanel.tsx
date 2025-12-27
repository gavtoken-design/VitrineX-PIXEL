
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { TranslationSet } from '../translations';

interface MagicPanelProps {
  onApplyMagic: (prompt: string) => void;
  isLoading: boolean;
  t: TranslationSet;
}

const MagicPanel: React.FC<MagicPanelProps> = ({ onApplyMagic, isLoading, t }) => {
  const [prompt, setPrompt] = useState('');

  const suggestions = [
    "Add a retro film aesthetic",
    "Remove the background",
    "Make it look like an oil painting",
    "Add a cute cat in the corner",
    "Change the sky to a sunset"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onApplyMagic(prompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-100">{t.magicTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{t.magicSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.magicPlaceholder}
            className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-lg group-hover:border-gray-600"
            disabled={isLoading}
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none border border-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity" />
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
        >
          {isLoading ? t.magicLoading : t.magicButton}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setPrompt(suggestion)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MagicPanel;
