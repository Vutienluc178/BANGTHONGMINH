import React, { useRef } from 'react';
import { 
  Pencil, 
  Minus, 
  Circle, 
  Square, 
  Triangle,
  Eraser, 
  Trash2, 
  MonitorUp, 
  VideoOff,
  Undo2,
  Move,
  MoreHorizontal,
  Dices,
  Maximize,
  Minimize,
  Image as ImageIcon,
  Type,
  LayoutTemplate
} from 'lucide-react';
import { ToolType, DrawingSettings } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  settings: DrawingSettings;
  setSettings: React.Dispatch<React.SetStateAction<DrawingSettings>>;
  onClear: () => void;
  onUndo: () => void;
  onScreenShare: () => void;
  isScreenSharing: boolean;
  onRandomPick: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  boardColor: string;
  setBoardColor: (color: string) => void;
}

const COLORS = ['#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#000000'];
const BOARD_COLORS = [
  { color: '#0f172a', title: 'Mặc định (Trong suốt/Tối)', border: 'border-slate-500' },
  { color: '#ffffff', title: 'Bảng Trắng', border: 'border-gray-300' },
  { color: '#14532d', title: 'Bảng Xanh', border: 'border-green-800' },
  { color: '#000000', title: 'Bảng Đen', border: 'border-gray-700' },
];

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  settings,
  setSettings,
  onClear,
  onUndo,
  onScreenShare,
  isScreenSharing,
  onRandomPick,
  onToggleFullscreen,
  isFullscreen,
  onImageUpload,
  boardColor,
  setBoardColor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleColorChange = (color: string) => {
    setSettings(prev => ({ ...prev, color }));
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, width: parseInt(e.target.value) }));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-3 z-50 max-h-[95vh] overflow-y-auto no-scrollbar w-[52px]">
      
      {/* Group 1: Core Tools */}
      <div className="flex flex-col gap-1 items-center">
         <ToolButton active={currentTool === 'pen'} onClick={() => setTool('pen')} icon={<Pencil size={18} />} title="Bút vẽ" />
         <ToolButton active={currentTool === 'text'} onClick={() => setTool('text')} icon={<Type size={18} />} title="Nhập văn bản" />
         <ToolButton active={currentTool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={18} />} title="Tẩy" />
         <ActionButton onClick={onUndo} icon={<Undo2 size={18} />} title="Hoàn tác (Undo)" />
         <ActionButton onClick={onClear} icon={<Trash2 size={18} />} title="Xóa bảng (Reset)" variant="danger" />
      </div>

      <div className="w-full h-px bg-white/10"></div>

      {/* Group 2: Shapes */}
      <div className="flex flex-col gap-1 items-center">
        <ToolButton active={currentTool === 'line'} onClick={() => setTool('line')} icon={<Minus size={18} />} title="Đường thẳng" />
        <ToolButton active={currentTool === 'dashed'} onClick={() => setTool('dashed')} icon={<MoreHorizontal size={18} />} title="Nét đứt" />
        <ToolButton active={currentTool === 'rect'} onClick={() => setTool('rect')} icon={<Square size={18} />} title="Hình vuông/Chữ nhật" />
        <ToolButton active={currentTool === 'circle'} onClick={() => setTool('circle')} icon={<Circle size={18} />} title="Hình tròn" />
        <ToolButton active={currentTool === 'ellipse'} onClick={() => setTool('ellipse')} icon={<div className="w-4 h-3 border-2 border-current rounded-[50%]" />} title="Hình Elip" />
        <ToolButton active={currentTool === 'triangle'} onClick={() => setTool('triangle')} icon={<Triangle size={18} />} title="Hình tam giác" />
        <ToolButton active={currentTool === 'axis'} onClick={() => setTool('axis')} icon={<Move size={18} />} title="Hệ trục Oxy" />
      </div>

      <div className="w-full h-px bg-white/10"></div>

      {/* Group 3: Pen Colors */}
      <div className="flex flex-col gap-1.5 items-center py-1">
           {COLORS.map(c => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${settings.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-110' : ''}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
      </div>
      
      <div className="h-20 flex items-center justify-center w-full py-2">
         <input
          type="range"
          min="1"
          max="20"
          value={settings.width}
          onChange={handleWidthChange}
          className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-50 hover:opacity-100 transition-opacity -rotate-90 origin-center"
          title={`Độ dày: ${settings.width}px`}
        />
      </div>

      <div className="w-full h-px bg-white/10"></div>
      
      {/* Group 4: Board Background Colors */}
      <div className="flex flex-col gap-1.5 items-center py-1 bg-white/5 rounded-lg w-full">
         {BOARD_COLORS.map(b => (
             <button
                key={b.color}
                onClick={() => setBoardColor(b.color)}
                className={`w-5 h-5 rounded-md border-2 ${b.border} transition-transform hover:scale-110 ${boardColor === b.color ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-black scale-105' : ''}`}
                style={{ backgroundColor: b.color }}
                title={b.title}
             />
         ))}
      </div>

      <div className="w-full h-px bg-white/10"></div>

      {/* Group 5: Advanced Features */}
      <div className="flex flex-col gap-1 items-center">
        <ActionButton onClick={triggerFileUpload} icon={<ImageIcon size={18} />} title="Chèn ảnh (Full màn hình)" variant="purple" />
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={onImageUpload} 
        />
        
        <ActionButton onClick={onRandomPick} icon={<Dices size={18} />} title="Quay số ngẫu nhiên" variant="purple" />
        <ActionButton onClick={onScreenShare} active={isScreenSharing} icon={isScreenSharing ? <VideoOff size={18} /> : <MonitorUp size={18} />} title="Chia sẻ màn hình" variant="blue" />
        <ActionButton onClick={onToggleFullscreen} icon={isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />} title="Toàn màn hình (Phím F)" />
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; title: string }> = ({ active, onClick, icon, title }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all flex items-center justify-center ${
        active ? 'bg-blue-600 text-white shadow shadow-blue-500/50' : 'text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
    </button>
    {/* Tooltip Left */}
    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-[60]">
      {title}
    </div>
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; active?: boolean; variant?: 'default' | 'danger' | 'blue' | 'purple'; loading?: boolean }> = ({ 
  onClick, icon, title, active, variant = 'default', loading 
}) => {
  let variantClass = "text-gray-400 hover:bg-white/10 hover:text-white";
  
  if (variant === 'danger') variantClass = "text-red-400 hover:bg-red-500/20 hover:text-red-200";
  if (variant === 'blue' || active) variantClass = "bg-blue-600/80 text-white hover:bg-blue-500";
  if (variant === 'purple') variantClass = "bg-purple-600/80 text-white hover:bg-purple-500";

  return (
    <div className="relative group">
      <button onClick={onClick} className={`p-2 rounded-lg transition-all ${variantClass}`} disabled={loading}>
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : icon}
      </button>
       {/* Tooltip Left */}
       <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-[60]">
        {title}
      </div>
    </div>
  );
};

export default Toolbar;