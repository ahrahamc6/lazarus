import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Copy, Trash2, AlertTriangle } from 'lucide-react';
import type { CanvasItem } from '@/types/sticker-canvas';
import {
  A4_WIDTH_CM,
  A4_HEIGHT_CM,
  CM_TO_DISPLAY_PX,
  pxToCm,
  cmToPx,
  formatCm,
} from '@/types/sticker-canvas';
import { MIN_STICKER_CM, MAX_STICKER_CM } from '@/config/pricing';

interface InteractiveCanvasProps {
  items: CanvasItem[];
  onItemsChange: (items: CanvasItem[]) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const CANVAS_W = A4_WIDTH_CM * CM_TO_DISPLAY_PX;
const CANVAS_H = A4_HEIGHT_CM * CM_TO_DISPLAY_PX;

export default function InteractiveCanvas({ items, onItemsChange, canvasRef }: InteractiveCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const availW = containerRef.current.clientWidth - 32;
      const availH = containerRef.current.clientHeight - 32;
      const s = Math.min(availW / CANVAS_W, availH / CANVAS_H, 1);
      setScale(s > 0 ? s : 1);
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  function updateItem(id: string, patch: Partial<CanvasItem>) {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function duplicateItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newItem: CanvasItem = {
      ...item,
      id: crypto.randomUUID(),
      x: item.x + 20,
      y: item.y + 20,
    };
    onItemsChange([...items, newItem]);
    setSelectedId(newItem.id);
  }

  function deleteItem(id: string) {
    onItemsChange(items.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleResizeStart(item: CanvasItem) {
    setResizingId(item.id);
    setSelectedId(item.id);
  }

  function handleResizeStop(id: string, ref: HTMLElement, delta: { width: number; height: number }) {
    setResizingId(null);
    let newWidth = ref.offsetWidth;
    let newHeight = ref.offsetHeight;

    const minPx = cmToPx(MIN_STICKER_CM);
    const maxPx = cmToPx(MAX_STICKER_CM);

    if (newWidth < minPx || newHeight < minPx) {
      if (newWidth < newHeight) {
        newWidth = minPx;
        newHeight = Math.max(minPx, newHeight);
      } else {
        newHeight = minPx;
        newWidth = Math.max(minPx, newWidth);
      }
    }

    if (newWidth > maxPx) newWidth = maxPx;
    if (newHeight > maxPx) newHeight = maxPx;

    updateItem(id, { width: newWidth, height: newHeight });
  }

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const resizing = items.find((i) => i.id === resizingId) ?? null;
  const tooltipItem = resizing ?? selected;
  const tooltipCm = tooltipItem ? pxToCm(Math.min(tooltipItem.width, tooltipItem.height)) : 0;
  const showMinWarning = tooltipCm > 0 && tooltipCm < MIN_STICKER_CM;
  const showMaxWarning = tooltipCm > MAX_STICKER_CM;

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-ink-950 overflow-auto">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        {/* A4 Sheet */}
        <div
          ref={canvasRef as React.RefObject<HTMLDivElement>}
          className="relative bg-white shadow-2xl"
          style={{ width: CANVAS_W, height: CANVAS_H }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {/* A4 label */}
          <div className="absolute -top-7 left-0 text-ink-500 text-xs uppercase tracking-wider">
            A4 · {A4_WIDTH_CM} × {A4_HEIGHT_CM} cm
          </div>

          {items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-ink-400 text-sm text-center px-8">
                Sube tu logo o elige un sticker de la galería para empezar a diseñar.
              </p>
            </div>
          )}

          {items.map((item) => (
            <Rnd
              key={item.id}
              size={{ width: item.width, height: item.height }}
              position={{ x: item.x, y: item.y }}
              bounds="parent"
              lockAspectRatio={false}
              resizeHandleStyles={resizeHandleStyles}
              onResizeStart={() => handleResizeStart(item)}
              onResizeStop={(_e, _dir, ref) => handleResizeStop(item.id, ref, { width: 0, height: 0 })}
              onDragStart={() => setSelectedId(item.id)}
              onDragStop={(_e, d) => {
                const x = Math.max(0, Math.min(d.x, CANVAS_W - item.width));
                const y = Math.max(0, Math.min(d.y, CANVAS_H - item.height));
                updateItem(item.id, { x, y });
              }}
              onMouseDown={() => setSelectedId(item.id)}
              style={{
                outline: selectedId === item.id ? '2px solid #ed751c' : 'none',
                outlineOffset: '2px',
              }}
            >
              <div className="relative w-full h-full select-none">
                <img
                  src={item.src}
                  alt={item.name}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Controls */}
                {selectedId === item.id && !resizingId && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateItem(item.id); }}
                      className="w-7 h-7 flex items-center justify-center bg-ink-900 border border-ink-600 text-ink-200 hover:bg-accent-500 hover:text-ink-950 hover:border-accent-500 transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="w-7 h-7 flex items-center justify-center bg-ink-900 border border-ink-600 text-ink-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Rnd>
          ))}
        </div>
      </div>

      {/* Dimension tooltip */}
      {tooltipItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className={`flex items-center gap-3 px-4 py-2 border text-sm font-medium ${
              showMinWarning || showMaxWarning
                ? 'bg-red-950/90 border-red-700 text-red-300'
                : 'bg-ink-900/95 border-ink-600 text-ink-100'
            }`}
          >
            {(showMinWarning || showMaxWarning) && <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span>
              {formatCm(pxToCm(tooltipItem.width))} × {formatCm(pxToCm(tooltipItem.height))}
            </span>
            <span className="text-ink-500 text-xs">·</span>
            <span className="text-ink-400 text-xs uppercase tracking-wider">
              {showMinWarning
                ? `Mín. ${MIN_STICKER_CM} cm`
                : showMaxWarning
                  ? `Máx. ${MAX_STICKER_CM} cm`
                  : 'A 300 DPI'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const resizeHandleStyles: Record<string, React.CSSProperties> = {
  bottomLeft: { width: '10px', height: '10px', background: '#ed751c', left: '-5px', bottom: '-5px', cursor: 'nesw-resize' },
  bottomRight: { width: '10px', height: '10px', background: '#ed751c', right: '-5px', bottom: '-5px', cursor: 'nwse-resize' },
  topLeft: { width: '10px', height: '10px', background: '#ed751c', left: '-5px', top: '-5px', cursor: 'nwse-resize' },
  topRight: { width: '10px', height: '10px', background: '#ed751c', right: '-5px', top: '-5px', cursor: 'nesw-resize' },
};
