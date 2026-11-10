export interface CanvasItem {
  id: string;
  type: 'upload' | 'preset';
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface DesignMeta {
  itemCount: number;
  sheetWidthCm: number;
  sheetHeightCm: number;
  items: Array<{
    name: string;
    widthCm: number;
    heightCm: number;
    xCm: number;
    yCm: number;
  }>;
}

export interface StickerOrderData {
  designImageUrl: string;
  designMeta: DesignMeta;
  total: number;
  orderId?: string;
}

// A4 dimensions in centimeters
export const A4_WIDTH_CM = 21.0;
export const A4_HEIGHT_CM = 29.7;

// 300 DPI conversion: 1 cm = 300/2.54 ≈ 118.11 pixels
export const CM_TO_PX_300DPI = 300 / 2.54;

// Minimum dimension in cm for any image side
export const MIN_DIMENSION_CM = 4.0;

// Canvas display scale: we render A4 at a fixed pixel width on screen
// and convert between display pixels and centimeters
export const CANVAS_DISPLAY_WIDTH_PX = 495; // ~21cm at ~95px/cm display scale
export const CM_TO_DISPLAY_PX = CANVAS_DISPLAY_WIDTH_PX / A4_WIDTH_CM; // ≈ 23.57 px/cm

export function pxToCm(px: number): number {
  return px / CM_TO_DISPLAY_PX;
}

export function cmToPx(cm: number): number {
  return cm * CM_TO_DISPLAY_PX;
}

export function formatCm(cm: number): string {
  return `${cm.toFixed(1)} cm`;
}
