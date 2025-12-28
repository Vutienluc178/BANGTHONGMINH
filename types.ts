export type ToolType = 'pen' | 'line' | 'dashed' | 'circle' | 'ellipse' | 'rect' | 'triangle' | 'axis' | 'eraser' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingSettings {
  color: string;
  width: number;
  opacity: number;
}