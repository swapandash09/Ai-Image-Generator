import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  History, 
  Settings2, 
  Maximize2, 
  ArrowRight,
  Layout,
  Square,
  Smartphone,
  Monitor,
  Loader2,
  Trash2,
  Zap,
  ZapOff,
  Clock,
  Copy,
  Share2,
  Check
} from 'lucide-react';
import { generateImage } from './services/geminiService';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: string;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', icon: Square, ratio: 'aspect-square' },
  { id: '16:9', label: 'Landscape', icon: Monitor, ratio: 'aspect-video' },
  { id: '9:16', label: 'Portrait', icon: Smartphone, ratio: 'aspect-[9/16]' },
  { id: '4:3', label: 'Classic', icon: Layout, ratio: 'aspect-[4/3]' },
  { id: '3:4', label: 'Photo', icon: Layout, ratio: 'aspect-[3/4]' },
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isTurboMode, setIsTurboMode] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastPrompt = useRef('');

  const handleGenerate = useCallback(async (manualPrompt?: string) => {
    const activePrompt = manualPrompt || prompt;
    if (!activePrompt.trim() || isGenerating) return;
    if (activePrompt === lastPrompt.current && !manualPrompt) return;

    setIsGenerating(true);
    setError(null);
    const startTime = Date.now();

    try {
      const imageUrl = await generateImage({
        prompt: activePrompt,
        aspectRatio: selectedRatio.id as any,
      });

      setCurrentImage(imageUrl);
      setGenerationTime(Date.now() - startTime);
      lastPrompt.current = activePrompt;
      
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substring(7),
        url: imageUrl,
        prompt: activePrompt,
        timestamp: Date.now(),
        aspectRatio: selectedRatio.id,
      };

      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, selectedRatio.id]);

  // Turbo Mode Debounce
  useEffect(() => {
    if (isTurboMode && prompt.trim().length > 10) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        handleGenerate();
      }, 1500); // 1.5s debounce for Turbo Mode
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [prompt, isTurboMode, handleGenerate]);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image: ', err);
      // Fallback: Copy URL
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lumina AI Creation',
          text: `Check out this AI image I generated: ${prompt}`,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy(url);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your generation history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-white selection:bg-brand-accent selection:text-white">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">LUMINA <span className="text-brand-accent">AI</span></h1>
          </motion.div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsTurboMode(!isTurboMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                isTurboMode 
                  ? 'bg-brand-accent/20 border-brand-accent text-brand-accent shadow-[0_0_15px_rgba(242,125,38,0.3)]' 
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              {isTurboMode ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-widest">Turbo Mode</span>
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors relative"
            >
              <History className="w-6 h-6" />
              {history.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-brand-accent rounded-full" />
              )}
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr,400px] gap-12 items-start">
          {/* Left Column: Generation Area */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-5xl lg:text-7xl font-bold leading-[0.9] tracking-tighter">
                IMAGINE <br />
                <span className="text-brand-accent italic font-light">ANYTHING.</span>
              </h2>
              <p className="text-white/50 text-lg max-w-md">
                Experience the next generation of AI image creation. High fidelity, real-time, and uniquely yours.
              </p>
            </motion.div>

            {/* Prompt Input */}
            <div className="glass-panel p-6 space-y-6">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic cyberpunk city with neon lights and floating vehicles..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px] text-lg focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent/50 outline-none transition-all resize-none placeholder:text-white/20"
                />
                <div className="absolute bottom-4 right-4 text-xs text-white/30 font-mono flex items-center gap-2">
                  {isTurboMode && <span className="flex items-center gap-1 text-brand-accent animate-pulse"><Zap className="w-3 h-3 fill-current" /> Live</span>}
                  {prompt.length} characters
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => {
                        setSelectedRatio(ratio);
                        if (isTurboMode) handleGenerate();
                      }}
                      className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[64px] ${
                        selectedRatio.id === ratio.id 
                          ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <ratio.icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">{ratio.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="bg-white text-brand-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      GENERATE
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Preview Area */}
          <div className="sticky top-12 space-y-6">
            <div className={`glass-panel overflow-hidden relative group ${selectedRatio.ratio} flex items-center justify-center bg-white/5`}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20"
                  >
                    <div className="w-16 h-16 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
                    <p className="text-brand-accent font-mono text-xs tracking-widest animate-pulse">PROCESSING PIXELS...</p>
                  </motion.div>
                ) : currentImage ? (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full"
                  >
                    <img 
                      src={currentImage} 
                      alt="Generated AI" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => handleDownload(currentImage, `lumina-${Date.now()}.png`)}
                          className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-white/20"
                  >
                    <ImageIcon className="w-16 h-16" />
                    <p className="text-sm font-medium">Your masterpiece will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Shimmer effect during generation */}
              {isGenerating && <div className="absolute inset-0 animate-shimmer z-10" />}
            </div>

            {/* Actions Bar (Persistent) */}
            {currentImage && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <button 
                  onClick={() => handleDownload(currentImage, `lumina-${Date.now()}.png`)}
                  className="flex-1 bg-brand-accent text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-brand-accent/20"
                >
                  <Download className="w-5 h-5" />
                  DOWNLOAD
                </button>
                <button 
                  onClick={() => handleCopy(currentImage)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all relative"
                  title="Copy to Clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  <AnimatePresence>
                    {copied && (
                      <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap"
                      >
                        COPIED!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button 
                  onClick={() => handleShare(currentImage)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Quick Stats */}
            <div className="flex justify-between items-center text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-brand-accent rounded-full" />
                Live Engine Active
              </div>
              <div className="flex items-center gap-2">
                {generationTime && (
                  <span className="flex items-center gap-1 text-emerald-500/70">
                    <Clock className="w-3 h-3" />
                    {(generationTime / 1000).toFixed(2)}s
                  </span>
                )}
                <span>Model: 2.5 Flash</span>
              </div>
            </div>
          </div>
        </div>


        {/* History Drawer / Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="mt-24 space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight">RECENT <span className="text-brand-accent">CREATIONS</span></h3>
                  <p className="text-white/40 text-sm">Your generation history for this session.</p>
                </div>
                <button 
                  onClick={clearHistory}
                  className="text-xs font-mono text-red-500/50 hover:text-red-500 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  CLEAR ALL
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {history.map((item) => (
                  <motion.div 
                    key={item.id}
                    layoutId={item.id}
                    className="group relative glass-panel overflow-hidden aspect-square cursor-pointer"
                    onClick={() => {
                      setCurrentImage(item.url);
                      setPrompt(item.prompt);
                      const ratio = ASPECT_RATIOS.find(r => r.id === item.aspectRatio);
                      if (ratio) setSelectedRatio(ratio);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <img 
                      src={item.url} 
                      alt={item.prompt} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <p className="text-[10px] line-clamp-2 text-white/80 mb-2 font-mono leading-tight uppercase tracking-wider">
                        {item.prompt}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-white/40 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item.url, `lumina-${item.id}.png`);
                            }}
                            className="p-1.5 bg-white/10 rounded-md hover:bg-brand-accent transition-colors"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {history.length === 0 && (
                  <div className="col-span-full h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-white/10">
                    No history yet. Start generating!
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-white/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-mono tracking-widest uppercase">Lumina AI Studio &copy; 2024</span>
          </div>
          <div className="flex gap-8 text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <a href="#" className="hover:text-brand-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-accent transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-accent transition-colors">API Docs</a>
            <a href="#" className="hover:text-brand-accent transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


