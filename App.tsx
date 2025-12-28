import React, { useState, useRef, useEffect } from 'react';
import Board from './components/Board';
import Toolbar from './components/Toolbar';
import { ToolType, DrawingSettings } from './types';
import { X, Dices } from 'lucide-react';

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [settings, setSettings] = useState<DrawingSettings>({
    color: '#FFFFFF',
    width: 4,
    opacity: 1
  });
  const [clearTrigger, setClearTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [boardColor, setBoardColor] = useState('#0f172a'); // Default Slate-900
  
  // Random Picker State
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const [classSize, setClassSize] = useState(40);
  const [pickedNumber, setPickedNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Refs needed for capturing the composed image
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowRandomPicker(false);
      }
      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleScreenShare = () => {
    window.dispatchEvent(new Event('TOGGLE_SCREEN_SHARE'));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleClear = () => {
    // Reset everything to default state
    setClearTrigger(prev => prev + 1);
    setBackgroundImage(null);
    setBoardColor('#0f172a');
  };
  
  const handleUndo = () => {
    setUndoTrigger(prev => prev + 1);
  };

  const handleRandomPick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    let counter = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      setPickedNumber(Math.floor(Math.random() * classSize) + 1);
      counter++;
      if (counter > maxIterations) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBackgroundImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-slate-900">
      
      {/* Main Board Area */}
      <div className="absolute inset-0 z-0">
        <Board 
          tool={currentTool} 
          settings={settings}
          clearTrigger={clearTrigger}
          undoTrigger={undoTrigger}
          onScreenShareReady={setIsScreenSharing}
          getCanvasRef={(ref) => canvasRef.current = ref}
          getVideoRef={(ref) => videoRef.current = ref}
          backgroundImage={backgroundImage}
          boardColor={boardColor}
        />
      </div>

      {/* Right Sidebar Toolbar */}
      <Toolbar 
        currentTool={currentTool}
        setTool={setCurrentTool}
        settings={settings}
        setSettings={setSettings}
        onClear={handleClear}
        onUndo={handleUndo}
        onScreenShare={toggleScreenShare}
        isScreenSharing={isScreenSharing}
        onRandomPick={() => setShowRandomPicker(true)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onImageUpload={handleImageUpload}
        boardColor={boardColor}
        setBoardColor={setBoardColor}
      />
      
      {/* Random Number Modal */}
      {showRandomPicker && (
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center">
           <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-[350px] shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2 text-purple-400 font-bold text-lg">
                 <Dices size={24} />
                 <span>Chọn học sinh ngẫu nhiên</span>
               </div>
               <button onClick={() => setShowRandomPicker(false)} className="text-gray-400 hover:text-white">
                 <X size={20} />
               </button>
             </div>

             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                   <label className="text-gray-300 text-sm">Sĩ số lớp:</label>
                   <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={classSize}
                      onChange={(e) => setClassSize(Number(e.target.value))}
                      className="w-20 bg-black/30 border border-white/20 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500"
                   />
                </div>

                <div className="h-32 flex items-center justify-center bg-black/30 rounded-xl border border-white/10 relative overflow-hidden">
                   {pickedNumber !== null ? (
                      <span className={`text-7xl font-bold ${isSpinning ? 'text-gray-500 blur-sm scale-90' : 'text-green-400 scale-110'} transition-all duration-100`}>
                        {pickedNumber}
                      </span>
                   ) : (
                      <span className="text-gray-600 text-sm">Nhấn quay để chọn</span>
                   )}
                </div>

                <button 
                  onClick={handleRandomPick}
                  disabled={isSpinning}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Dices size={20} className={isSpinning ? "animate-spin" : ""} />
                  {isSpinning ? "Đang quay..." : "Quay số"}
                </button>
             </div>
           </div>
         </div>
      )}

      {/* Intro Text */}
      {!isScreenSharing && !currentTool && !backgroundImage && boardColor === '#0f172a' && (
        <div className="absolute top-10 left-10 text-white/30 pointer-events-none select-none">
          <h1 className="text-4xl font-bold">GlassBoard</h1>
        </div>
      )}
    </div>
  );
}

export default App;