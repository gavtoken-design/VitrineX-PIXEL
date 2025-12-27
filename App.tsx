
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { 
  generateEditedImage, 
  generateFilteredImage, 
  generateAdjustedImage, 
  generateMagicEdit,
  generateNewImage,
  analyzeImage,
  animateImage
} from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import MagicPanel from './components/MagicPanel';
import GeneratePanel from './components/GeneratePanel';
import AnalyzePanel from './components/AnalyzePanel';
import AnimatePanel from './components/AnimatePanel';
import { UndoIcon, RedoIcon, EyeIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import { translations, Language } from './translations';

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'generate' | 'magic' | 'point' | 'adjust' | 'filters' | 'analyze' | 'animate' | 'crop';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [language, setLanguage] = useState<Language>('en');
  
  const t = translations[language];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const [pointPrompt, setPointPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('magic');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  const checkApiKey = async () => {
    if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
    }
  };

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('magic');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAnalysisResult(null);
    setGeneratedVideoUrl(null);
  }, []);

  const handleMagicEditAction = useCallback(async (prompt: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const editedImageUrl = await generateMagicEdit(currentImage, prompt);
        const newImageFile = dataURLtoFile(editedImageUrl, `magic-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Magic failed.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleGenerateAction = useCallback(async (prompt: string, aspectRatio: string) => {
    setIsLoading(true);
    setError(null);
    try {
        await checkApiKey();
        const generatedImageUrl = await generateNewImage(prompt, aspectRatio);
        const newImageFile = dataURLtoFile(generatedImageUrl, `gen-${Date.now()}.png`);
        handleImageUpload(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
        setIsLoading(false);
    }
  }, [handleImageUpload]);

  const handleAnalyzeAction = useCallback(async (prompt: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        await checkApiKey();
        const result = await analyzeImage(currentImage, prompt);
        setAnalysisResult(result);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage]);

  const handleAnimateAction = useCallback(async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    try {
        await checkApiKey();
        const videoUrl = await animateImage(currentImage, prompt, aspectRatio);
        setGeneratedVideoUrl(videoUrl);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Animation failed.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage]);

  const handlePointGenerate = useCallback(async () => {
    if (!currentImage || !editHotspot) return;
    setIsLoading(true);
    setError(null);
    try {
        const editedImageUrl = await generateEditedImage(currentImage, pointPrompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `point-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
        setPointPrompt('');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Edit failed.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, pointPrompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Filter failed.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Adjustment failed.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, completedCrop.width, completedCrop.height,
    );
    addImageToHistory(dataURLtoFile(canvas.toDataURL('image/png'), `crop-${Date.now()}.png`));
  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPointPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-pixshop.png`;
          link.click();
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'point') return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDisplayHotspot({ x: offsetX, y: offsetY });
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const originalX = Math.round(offsetX * (naturalWidth / clientWidth));
    const originalY = Math.round(offsetY * (naturalHeight / clientHeight));
    setEditHotspot({ x: originalX, y: originalY });
  };

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">{t.errorTitle}</h2>
            <p className="text-md text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                {t.tryAgain}
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl && activeTab !== 'generate') return <StartScreen onFileSelect={handleImageUpload} t={t} />;

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-black/20">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4">
                    <Spinner />
                    <p className="text-gray-300 font-medium">{t.processing}</p>
                </div>
            )}
            
            <div className="relative">
                {activeTab === 'crop' ? (
                  <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect} className="max-h-[60vh]">
                    <img ref={imgRef} src={currentImageUrl || ''} alt="Crop" className="w-full h-auto object-contain max-h-[60vh]" />
                  </ReactCrop>
                ) : (
                  <div className="relative min-h-[300px] flex items-center justify-center bg-zinc-900/50">
                     {currentImageUrl ? (
                        <>
                          {originalImageUrl && (
                            <img src={originalImageUrl} alt="Original" className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none" />
                          )}
                          <img
                            ref={imgRef}
                            src={currentImageUrl}
                            alt="Current"
                            onClick={handleImageClick}
                            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'point' ? 'cursor-crosshair' : ''}`}
                          />
                        </>
                     ) : (
                       <div className="text-gray-500 font-medium italic">Generating your visual ideas...</div>
                     )}
                  </div>
                )}
                {displayHotspot && !isLoading && activeTab === 'point' && (
                    <div className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}>
                        <div className="absolute inset-0 rounded-full animate-ping bg-blue-400"></div>
                    </div>
                )}
            </div>
        </div>
        
        <div className="w-full bg-gray-800/80 border border-gray-700/80 rounded-lg p-1.5 flex items-center gap-1 backdrop-blur-sm overflow-x-auto no-scrollbar">
            {(['generate', 'magic', 'point', 'adjust', 'filters', 'analyze', 'animate', 'crop'] as Tab[]).map(tab => {
              const tabLabels: Record<Tab, string> = {
                generate: t.tabGenerate,
                magic: t.tabMagic,
                point: t.tabPoint,
                adjust: t.tabAdjust,
                filters: t.tabFilters,
                analyze: t.tabAnalyze,
                animate: t.tabAnimate,
                crop: t.tabCrop
              };
              return (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-none min-w-[100px] capitalize font-semibold py-2.5 px-4 rounded-md transition-all duration-200 text-sm ${
                        activeTab === tab 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {tabLabels[tab]}
                </button>
              );
            })}
        </div>
        
        <div className="w-full">
            {activeTab === 'generate' && <GeneratePanel onGenerate={handleGenerateAction} isLoading={isLoading} t={t} />}
            {activeTab === 'magic' && <MagicPanel onApplyMagic={handleMagicEditAction} isLoading={isLoading} t={t} />}
            {activeTab === 'analyze' && <AnalyzePanel onAnalyze={handleAnalyzeAction} analysisResult={analysisResult} isLoading={isLoading} t={t} />}
            {activeTab === 'animate' && <AnimatePanel onAnimate={handleAnimateAction} videoUrl={generatedVideoUrl} isLoading={isLoading} t={t} />}
            {activeTab === 'point' && (
                <div className="flex flex-col items-center gap-4 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-gray-100">{t.pointTitle}</h3>
                    <p className="text-sm text-gray-400 text-center">
                        {editHotspot ? t.pointSubSelected : t.pointSubUnselected}
                    </p>
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            value={pointPrompt}
                            onChange={(e) => setPointPrompt(e.target.value)}
                            placeholder={editHotspot ? t.pointPlaceholder : "Select point"}
                            className="flex-grow bg-gray-900 border border-gray-700 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                            disabled={isLoading || !editHotspot}
                        />
                        <button 
                            onClick={handlePointGenerate}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-lg transition-all disabled:bg-gray-700 disabled:cursor-not-allowed"
                            disabled={isLoading || !pointPrompt.trim() || !editHotspot}
                        >
                            {t.pointButton}
                        </button>
                    </div>
                </div>
            )}
            {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width} t={t} />}
            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} t={t} />}
            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} t={t} />}
        </div>
        
        {currentImageUrl && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full">
              <button onClick={handleUndo} disabled={!canUndo} className="flex-1 sm:flex-none flex items-center justify-center bg-white/5 border border-white/10 text-gray-300 py-3 px-6 rounded-lg hover:bg-white/10 disabled:opacity-30">
                  <UndoIcon className="w-5 h-5 mr-2" /> {t.undo}
              </button>
              <button onClick={handleRedo} disabled={!canRedo} className="flex-1 sm:flex-none flex items-center justify-center bg-white/5 border border-white/10 text-gray-300 py-3 px-6 rounded-lg hover:bg-white/10 disabled:opacity-30">
                  <RedoIcon className="w-5 h-5 mr-2" /> {t.redo}
              </button>
              <button 
                  onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)} onTouchEnd={() => setIsComparing(false)}
                  className="flex-1 sm:flex-none flex items-center justify-center bg-white/5 border border-white/10 text-gray-300 py-3 px-6 rounded-lg hover:bg-white/10"
              >
                  <EyeIcon className="w-5 h-5 mr-2" /> {t.compare}
              </button>
              <button onClick={handleReset} disabled={!canUndo} className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-gray-300 py-3 px-6 rounded-lg hover:bg-white/10 disabled:opacity-30">{t.reset}</button>
              <button onClick={handleUploadNew} className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-gray-300 py-3 px-6 rounded-lg hover:bg-white/10">{t.uploadNew}</button>
              <button onClick={handleDownload} className="w-full sm:w-auto sm:ml-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-green-900/20">{t.download}</button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header 
        language={language} 
        onLanguageToggle={setLanguage} 
        title={t.appName}
      />
      <main className={`flex-grow w-full max-w-[1400px] mx-auto p-4 md:p-8 flex justify-center ${currentImage || activeTab === 'generate' ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
