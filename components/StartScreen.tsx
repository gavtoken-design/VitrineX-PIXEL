
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SparklesIcon, EyeIcon } from './icons';
import { TranslationSet } from '../translations';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
  t: TranslationSet;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, t }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          {t.tagline.split('Every')[0]} <span className="text-blue-400">{t.tagline.split('Every')[1] || 'Every Pixel'}</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t.description}
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors shadow-2xl shadow-blue-500/20">
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                {t.uploadButton}
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500">{t.uploadSub}</p>
        </div>

        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-black/20 p-6 rounded-xl border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-900/40 rounded-full mb-4">
                       <SparklesIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">{t.featProGenTitle}</h3>
                    <p className="mt-2 text-sm text-gray-400">{t.featProGenSub}</p>
                </div>
                <div className="bg-black/20 p-6 rounded-xl border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-900/40 rounded-full mb-4">
                       <MagicWandIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">{t.featSmartEditTitle}</h3>
                    <p className="mt-2 text-sm text-gray-400">{t.featSmartEditSub}</p>
                </div>
                <div className="bg-black/20 p-6 rounded-xl border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-900/40 rounded-full mb-4">
                       <EyeIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">{t.featThinkingTitle}</h3>
                    <p className="mt-2 text-sm text-gray-400">{t.featThinkingSub}</p>
                </div>
                <div className="bg-black/20 p-6 rounded-xl border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-900/40 rounded-full mb-4">
                       <PaletteIcon className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">{t.featVeoTitle}</h3>
                    <p className="mt-2 text-sm text-gray-400">{t.featVeoSub}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
