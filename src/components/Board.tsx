import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType, DrawingSettings, Point } from '../types';

interface BoardProps {
  tool: ToolType;
  settings: DrawingSettings;
  clearTrigger: number;
  undoTrigger: number;
  onScreenShareReady: (isActive: boolean) => void;
  getCanvasRef: (ref: HTMLCanvasElement | null) => void;
  getVideoRef: (ref: HTMLVideoElement | null) => void;
  backgroundImage: string | null;
  boardColor: string;
}

const Board: React.FC<BoardProps> = ({ 
  tool, 
  settings, 
  clearTrigger,
  undoTrigger,
  onScreenShareReady,
  getCanvasRef,
  getVideoRef,
  backgroundImage,
  boardColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for text input
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [typingPos, setTypingPos] = useState<Point | null>(null);

  // Initialize refs for parent
  useEffect(() => {
    getCanvasRef(canvasRef.current);
    getVideoRef(videoRef.current);
  }, [getCanvasRef, getVideoRef]);

  // Reset typing if tool changes
  useEffect(() => {
    setTypingPos(null);
  }, [tool]);

  // Auto-focus input when it appears
  useEffect(() => {
    if (typingPos && inputRef.current) {
      inputRef.current.focus();
    }
  }, [typingPos]);

  // Setup Canvas Size with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        
        // Save current content if canvas has size
        let content: ImageData | null = null;
        if (canvasRef.current.width > 0 && canvasRef.current.height > 0) {
           const ctx = canvasRef.current.getContext('2d');
           content = ctx?.getImageData(0,0, canvasRef.current.width, canvasRef.current.height) || null;
        }
        
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Restore content
        if (content) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.putImageData(content, 0, 0);
        }
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle Clear
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save state before clearing for Undo
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-19), currentData]);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [clearTrigger]);

  // Handle Undo
  useEffect(() => {
    if (history.length === 0 || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    
    // Restore previous state
    ctx.putImageData(previousState, 0, 0);
    
    // Remove last state from history
    setHistory(prev => prev.slice(0, -1));

  }, [undoTrigger]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);

    // Text Tool Logic
    if (tool === 'text') {
      // If we are already typing and click elsewhere, the onBlur of input will handle saving.
      // We just need to set the new position.
      // A small timeout ensures onBlur fires first if we clicked outside.
      setTimeout(() => setTypingPos(pos), 0);
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    // Save history before new stroke
    const currentData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory(prev => [...prev.slice(-19), currentData]);

    setIsDrawing(true);
    setStartPos(pos);

    // Save snapshot for shapes (to clear preview on drag)
    setSnapshot(currentData);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = settings.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]); // Reset dash by default

    // Eraser setup
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // Dashed line setup
    if (tool === 'dashed') {
      ctx.setLineDash([settings.width * 3, settings.width * 2]);
    }
  };

  const drawArrowHead = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const headLength = 15;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPos = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else if (snapshot) {
      // Restore the snapshot to "erase" the previous drag preview frame
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      
      // Reset generic styles for shape preview
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = settings.color;
      ctx.lineWidth = settings.width;
      ctx.setLineDash([]); // Reset for most shapes
      if (tool === 'dashed') ctx.setLineDash([settings.width * 3, settings.width * 2]);

      if (tool === 'line' || tool === 'dashed') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, currentPos.x - startPos.x, currentPos.y - startPos.y);
      } else if (tool === 'ellipse') {
        // Center is the start position
        const centerX = startPos.x;
        const centerY = startPos.y;
        // Radii are determined by distance from startPos to currentPos
        const radiusX = Math.abs(currentPos.x - startPos.x);
        const radiusY = Math.abs(currentPos.y - startPos.y);
        
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'triangle') {
        // Isosceles triangle inside the bounding box
        const topX = (startPos.x + currentPos.x) / 2;
        const topY = startPos.y;
        const botY = currentPos.y;
        const leftX = startPos.x;
        const rightX = currentPos.x;

        ctx.moveTo(topX, topY);
        ctx.lineTo(leftX, botY);
        ctx.lineTo(rightX, botY);
        ctx.closePath();
        ctx.stroke();
      } else if (tool === 'axis') {
         // Draw coordinate system inside bounding box
         // Center is origin
         const centerX = (startPos.x + currentPos.x) / 2;
         const centerY = (startPos.y + currentPos.y) / 2;
         
         // X Axis
         ctx.moveTo(startPos.x, centerY);
         ctx.lineTo(currentPos.x, centerY);
         ctx.stroke();
         drawArrowHead(ctx, {x: startPos.x, y: centerY}, {x: currentPos.x, y: centerY});
         
         // Y Axis
         ctx.beginPath();
         ctx.moveTo(centerX, currentPos.y);
         ctx.lineTo(centerX, startPos.y); // Y goes up visually, but canvas Y is 0 at top. Let's assume user drags top-left to bot-right. 
         // Arrow at the top (startPos.y)
         ctx.stroke();
         drawArrowHead(ctx, {x: centerX, y: currentPos.y}, {x: centerX, y: startPos.y});
         
         // Origin Label (O) could be added but text rendering is complex in drag preview, skipping for simplicity
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.closePath();
      setIsDrawing(false);
      setSnapshot(null);
    }
  };

  const handleTextComplete = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
      const text = (e.target as HTMLInputElement).value;
      
      // Always clear typing mode
      setTypingPos(null);

      if (!text.trim() || !typingPos) return;
      
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
           // Save history before adding text
          const currentData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
          setHistory(prev => [...prev.slice(-19), currentData]);
          
          ctx.font = `bold 32px sans-serif`;
          ctx.fillStyle = settings.color;
          ctx.textBaseline = 'top';
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillText(text, typingPos.x, typingPos.y);
      }
  };

  // Screen Sharing Logic
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          onScreenShareReady(true);
        };
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
      onScreenShareReady(false);
    }
  };

  const stopScreenShare = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      onScreenShareReady(false);
    }
  }, [onScreenShareReady]);

  useEffect(() => {
    const handleShareToggle = () => {
      if (videoRef.current?.srcObject) {
        stopScreenShare();
      } else {
        startScreenShare();
      }
    };
    
    window.addEventListener('TOGGLE_SCREEN_SHARE', handleShareToggle);
    return () => window.removeEventListener('TOGGLE_SCREEN_SHARE', handleShareToggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopScreenShare]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none transition-colors duration-300" style={{ backgroundColor: boardColor }}>
      {/* Background Video (Screen Share) - Z-index 0 */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        style={{ zIndex: 0 }}
      />
      
      {/* Background Image - Z-index 5 */}
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt="Board Background" 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 5 }}
        />
      )}

      {/* Drawing Canvas - Z-index 10 */}
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full touch-none ${tool === 'text' ? 'cursor-text' : 'cursor-pen'}`}
        style={{ zIndex: 10 }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Text Input Overlay */}
      {typingPos && (
        <input
          ref={inputRef}
          className="absolute bg-white/10 border border-white/30 rounded px-2 py-1 outline-none shadow-lg select-text backdrop-blur-sm"
          style={{
            left: typingPos.x,
            top: typingPos.y,
            color: settings.color,
            font: 'bold 32px sans-serif',
            zIndex: 20,
            lineHeight: 1,
            minWidth: '200px', // Ensures visibility
            pointerEvents: 'auto' // Ensures clicks work
          }}
          placeholder="Nhập văn bản..."
          onBlur={handleTextComplete}
          onKeyDown={(e) => {
             if(e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      )}
    </div>
  );
};

export default Board;