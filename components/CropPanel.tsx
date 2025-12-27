
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { TranslationSet } from '../translations';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
  t: TranslationSet;
}

type AspectRatio = 'free' | '1:1' | '16:9' | 'custom';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping, t }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free');
  const [customRatio, setCustomRatio] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    setIsInvalid(false);
    if (aspect !== 'custom') {
      onSetAspect(value);
    } else {
      // Re-validate current custom ratio if switching back to custom
      validateAndSetRatio(customRatio);
    }
  }

  const validateAndSetRatio = (value: string) => {
    if (!value) {
      setIsInvalid(false);
      onSetAspect(undefined);
      return;
    }

    // Strict validation for X:Y format (integers only)
    const ratioPattern = /^\d+:\d+$/;
    const isValid = ratioPattern.test(value.trim());
    
    if (isValid) {
      const [x, y] = value.trim().split(':').map(Number);
      if (x > 0 && y > 0) {
        setIsInvalid(false);
        onSetAspect(x / y);
      } else {
        setIsInvalid(true);
        onSetAspect(undefined);
      }
    } else {
      setIsInvalid(true);
      onSetAspect(undefined);
    }
  };

  const handleCustomRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomRatio(value);
    validateAndSetRatio(value);
  };

  const aspects: { name: AspectRatio, label: string, value: number | undefined }[] = [
    { name: 'free', label: 'Free', value: undefined },
    { name: '1:1', label: '1:1', value: 1 / 1 },
    { name: '16:9', label: '16:9', value: 16 / 9 },
    { name: 'custom', label: 'Custom', value: undefined },
  ];

  const canApply = isCropping && !isLoading && (activeAspect !== 'custom' || (!isInvalid && customRatio !== ''));

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-100">{t.cropTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{t.cropSub}</p>
      </div>
      
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-400">{t.cropAspect}</span>
          <div className="flex bg-black/30 rounded-lg p-1 border border-gray-700">
            {aspects.map(({ name, label, value }) => (
              <button
                key={name}
                onClick={() => handleAspectChange(name, value)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  activeAspect === name 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeAspect === 'custom' && (
          <div className="flex flex-col items-center gap-2 animate-fade-in w-full max-w-xs">
            <div className="flex items-center gap-3 w-full">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">{t.cropCustom}</label>
              <input
                type="text"
                value={customRatio}
                onChange={handleCustomRatioChange}
                placeholder="e.g., 4:5"
                className={`w-full bg-gray-900 border ${isInvalid ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-700'} text-gray-100 rounded-lg px-3 py-2 focus:ring-2 ${isInvalid ? 'focus:ring-red-500' : 'focus:ring-blue-500'} outline-none text-sm font-mono transition-all`}
              />
            </div>
            {isInvalid && (
              <p className="text-[10px] text-red-400 font-medium self-end">
                Format must be X:Y (e.g. 2:3)
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onApplyCrop}
        disabled={!canApply}
        className="w-full max-w-sm py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
      >
        {t.cropApply}
      </button>
    </div>
  );
};

export default CropPanel;
