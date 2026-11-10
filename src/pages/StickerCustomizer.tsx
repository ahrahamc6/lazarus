import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { presetStickerToDataUrl } from '@/data/presetStickers';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types/database';
import type { CanvasItem, DesignMeta } from '@/types/sticker-canvas';
import {
  A4_WIDTH_CM,
  A4_HEIGHT_CM,
  CM_TO_DISPLAY_PX,
  CM_TO_PX_300DPI,
  pxToCm,
} from '@/types/sticker-canvas';
import {
  SIZE_TIERS,
  FINISH_OPTIONS,
  SHEET_CAPACITY,
  MIN_STICKER_CM,
  MAX_STICKER_CM,
  getSizeTier,
  getStickerUnitPrice,
  getSizeLabel,
} from '@/config/pricing';
import SidePanel from '@/components/sticker-customizer/SidePanel';
import InteractiveCanvas from '@/components/sticker-customizer/InteractiveCanvas';
import { Loader2, Package, AlertCircle, Layers, Plus, Trash2 } from 'lucide-react';

const CANVAS_W = A4_WIDTH_CM * CM_TO_DISPLAY_PX;
const CANVAS_H = A4_HEIGHT_CM * CM_TO_DISPLAY_PX;

export default function StickerCustomizer() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string>('mate');
  const [justAdded, setJustAdded] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const addImage = useCallback((src: string, name: string, type: 'upload' | 'preset') => {
    idCounter.current += 1;
    const defaultSize = 120;
    const newItem: CanvasItem = {
      id: `${type}-${idCounter.current}-${Date.now()}`,
      type,
      src,
      name,
      x: (CANVAS_W - defaultSize) / 2,
      y: (CANVAS_H - defaultSize) / 2,
      width: defaultSize,
      height: defaultSize,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  // --- Pricing calculations ---
  const { totalPoints, sheetPrice, itemsBreakdown } = useMemo(() => {
    let points = 0;
    let price = 0;
    const breakdown = items.map((item) => {
      const shortestCm = pxToCm(Math.min(item.width, item.height));
      const tier = getSizeTier(shortestCm);
      const unitPrice = getStickerUnitPrice(shortestCm, selectedFinish);
      points += tier.points;
      price += unitPrice;
      return {
        id: item.id,
        name: item.name,
        shortestCm,
        sizeLabel: getSizeLabel(shortestCm),
        unitPrice,
      };
    });
    return { totalPoints: points, sheetPrice: price, itemsBreakdown: breakdown };
  }, [items, selectedFinish]);

  const capacityPct = Math.min((totalPoints / SHEET_CAPACITY) * 100, 100);
  const overCapacity = totalPoints > SHEET_CAPACITY;

  async function handleAddSheetToCart() {
    if (items.length === 0) {
      setError('Añade al menos un sticker al lienzo antes de agregar la hoja.');
      return;
    }
    if (overCapacity) {
      setError(`La hoja excede la capacidad máxima (${totalPoints}/${SHEET_CAPACITY} pts). Reduce el tamaño o la cantidad de stickers.`);
      return;
    }

    // Validate dimensions
    for (const item of items) {
      const shortestCm = pxToCm(Math.min(item.width, item.height));
      if (shortestCm < MIN_STICKER_CM) {
        setError(`"${item.name}" mide ${shortestCm.toFixed(1)} cm. El mínimo es ${MIN_STICKER_CM} cm.`);
        return;
      }
      if (shortestCm > MAX_STICKER_CM) {
        setError(`"${item.name}" mide ${shortestCm.toFixed(1)} cm. El máximo es ${MAX_STICKER_CM} cm.`);
        return;
      }
    }

    setProcessing(true);
    setError(null);

    try {
      const designImageUrl = await captureCanvas();
      const finishLabel = FINISH_OPTIONS.find((f) => f.id === selectedFinish)?.label ?? 'Mate';
      const designMeta = buildDesignMeta(selectedFinish, finishLabel, sheetPrice);

      // Build a synthetic Product for the cart
      const sheetProduct: Product = {
        id: crypto.randomUUID(),
        category_id: 'sticker-sheet',
        name: `Hoja A4 Stickers — ${finishLabel}`,
        slug: `sticker-sheet-${Date.now()}`,
        description: `${items.length} sticker(s) · ${finishLabel} · A4 ${A4_WIDTH_CM}×${A4_HEIGHT_CM}cm`,
        price: sheetPrice,
        image_url: designImageUrl,
        stock: 999,
        is_active: true,
        sku: null,
        metadata: designMeta as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addItem(sheetProduct, 1);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2000);

      // Clear canvas for next sheet
      setItems([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No se pudo procesar la hoja: ${msg}`);
    } finally {
      setProcessing(false);
    }
  }

  async function captureCanvas(): Promise<string> {
    const canvasEl = canvasRef.current;
    if (!canvasEl) throw new Error('Lienzo no encontrado');

    const targetWidthPx = Math.round(A4_WIDTH_CM * CM_TO_PX_300DPI);
    const targetHeightPx = Math.round(A4_HEIGHT_CM * CM_TO_PX_300DPI);
    const renderScale = targetWidthPx / CANVAS_W;

    const { default: html2canvas } = await import('html2canvas');

    const fullCanvas = await html2canvas(canvasEl, {
      backgroundColor: '#ffffff',
      scale: renderScale,
      useCORS: true,
      logging: false,
      width: CANVAS_W,
      height: CANVAS_H,
      windowWidth: CANVAS_W,
      windowHeight: CANVAS_H,
    });

    if (fullCanvas.width !== targetWidthPx || fullCanvas.height !== targetHeightPx) {
      const resized = document.createElement('canvas');
      resized.width = targetWidthPx;
      resized.height = targetHeightPx;
      const ctx = resized.getContext('2d');
      if (ctx) {
        ctx.drawImage(fullCanvas, 0, 0, targetWidthPx, targetHeightPx);
      }
      return uploadCanvas(resized);
    }

    return uploadCanvas(fullCanvas);
  }

  async function uploadCanvas(canvas: HTMLCanvasElement): Promise<string> {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) throw new Error('No se pudo generar la imagen del diseño.');

    const fileName = `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const filePath = `custom-stickers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('sticker-designs')
      .upload(filePath, blob, { contentType: 'image/png' });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('sticker-designs')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  function buildDesignMeta(finishId: string, finishLabel: string, price: number): DesignMeta {
    return {
      itemCount: items.length,
      sheetWidthCm: A4_WIDTH_CM,
      sheetHeightCm: A4_HEIGHT_CM,
      items: items.map((item) => ({
        name: item.name,
        widthCm: parseFloat(pxToCm(item.width).toFixed(2)),
        heightCm: parseFloat(pxToCm(item.height).toFixed(2)),
        xCm: parseFloat(pxToCm(item.x).toFixed(2)),
        yCm: parseFloat(pxToCm(item.y).toFixed(2)),
      })),
      // Extended fields for pricing context
      ...({ finishId, finishLabel, sheetPrice: price } as unknown as Record<string, never>),
    } as DesignMeta;
  }

  function clearCanvas() {
    setItems([]);
    setError(null);
  }

  return (
    <div className="animate-fade-in min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with pricing summary */}
      <div className="border-b border-ink-800 bg-ink-900 px-4 sm:px-5 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-accent-500/10 border border-accent-500/30">
              <Package className="w-5 h-5 text-accent-500" strokeWidth={2} />
            </div>
            <div>
              <span className="text-accent-500 text-xs uppercase tracking-[0.2em] font-medium block">
                Stickers Personalizados
              </span>
              <h1 className="display-text text-xl sm:text-2xl text-ink-50">Lienzo Interactivo</h1>
            </div>
          </div>

          {/* Cost + capacity */}
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-ink-500" />
                <span className="text-ink-400">{items.length} sticker{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-ink-500 text-xs uppercase tracking-wider">Costo hoja</span>
                <span className="text-accent-500 text-xl font-semibold">${sheetPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="flex items-center gap-2 w-full sm:w-64">
              <div className="flex-1 h-2 bg-ink-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    overCapacity ? 'bg-red-500' : capacityPct > 75 ? 'bg-yellow-500' : 'bg-accent-500'
                  }`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${overCapacity ? 'text-red-400' : 'text-ink-400'}`}>
                {totalPoints}/{SHEET_CAPACITY}
              </span>
            </div>
          </div>
        </div>

        {/* Over capacity alert */}
        {overCapacity && (
          <div className="mt-3 flex items-center gap-2 bg-red-950/50 border border-red-900/50 px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">
              La hoja excede la capacidad máxima. Reduce el tamaño o cantidad de stickers para continuar.
            </p>
          </div>
        )}

        {/* Item price breakdown */}
        {itemsBreakdown.length > 0 && (
          <div className="mt-3 hidden sm:flex flex-wrap gap-2">
            {itemsBreakdown.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 text-xs text-ink-400 bg-ink-950 border border-ink-700 px-2 py-1"
              >
                <span className="text-ink-300 truncate max-w-[120px]">{b.name}</span>
                <span className="text-ink-500">·</span>
                <span className="text-accent-500">${b.unitPrice.toFixed(2)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-ink-950 border-b border-red-900/30 px-5 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Added confirmation banner */}
      {justAdded && (
        <div className="bg-green-950/50 border-b border-green-900/30 px-5 py-3 flex items-center gap-3 animate-fade-in">
          <div className="w-5 h-5 flex items-center justify-center bg-green-500 text-ink-950 text-xs font-bold">✓</div>
          <p className="text-green-300 text-sm">Hoja agregada al carrito. Lienzo limpio para tu próxima hoja.</p>
          <button
            onClick={() => navigate('/checkout')}
            className="ml-auto text-green-400 hover:text-green-200 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Ir a pagar →
          </button>
        </div>
      )}

      {/* Main area: side panel + canvas */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <SidePanel
          onAddImage={addImage}
          selectedFinish={selectedFinish}
          onFinishChange={setSelectedFinish}
        />
        <InteractiveCanvas items={items} onItemsChange={setItems} canvasRef={canvasRef} />
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-ink-800 bg-ink-900 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <button
          onClick={clearCanvas}
          disabled={items.length === 0 || processing}
          className="inline-flex items-center gap-2 text-ink-400 hover:text-red-400 text-xs uppercase tracking-wider font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpiar lienzo
        </button>

        <button
          onClick={handleAddSheetToCart}
          disabled={processing || items.length === 0 || overCapacity}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : justAdded ? (
            'Hoja agregada'
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Agregar Hoja al Carrito
              <span className="text-ink-950/70">·</span>
              <span>${sheetPrice.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>

      {/* Size tier reference */}
      <div className="border-t border-ink-800 bg-ink-950 px-4 sm:px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-500">
          <span className="uppercase tracking-wider font-medium text-ink-400">Precios por tamaño:</span>
          {SIZE_TIERS.map((tier) => (
            <span key={tier.id} className="flex items-center gap-1.5">
              <span className="text-ink-300">{tier.label}</span>
              <span className="text-accent-500">${tier.basePrice.toFixed(2)}</span>
              <span className="text-ink-600">· {tier.points} pts</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
