
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { TranslationSet } from '../translations';

interface AnimatePanelProps {
  onAnimate: (prompt: string, aspectRatio: '16:9' | '9:16') => void;
  videoUrl: string | null;
  isLoading: boolean;
  t: TranslationSet;
}

const AnimatePanel: React.FC<AnimatePanelProps> = ({ onAnimate, videoUrl, isLoading, t }) => {
  const [prompt, setPrompt] = useState('Bring this image to life with cinematic motion.');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnimate(prompt, aspectRatio);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-100">{t.animateTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{t.animateSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl p-4 min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          disabled={isLoading}
        />
        
        <div className="flex gap-4 items-center">
          <label className="text-sm font-semibold text-gray-400">{t.animateLayout}</label>
          <div className="flex gap-2">
            {(['16:9', '9:16'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  aspectRatio === r 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-gray-400'
                }`}
              >
                {r === '16:9' ? t.animateLandscape : t.animatePortrait}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? t.animateLoading : t.animateButton}
        </button>
      </form>

      {videoUrl && (
        <div className="mt-4 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
          <video src={videoUrl} controls className="w-full h-auto" autoPlay loop muted />
        </div>
      )}
    </div>
  );
};

export default AnimatePanel;
