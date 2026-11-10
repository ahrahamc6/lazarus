// ============================================================
//  CONFIGURACIÓN DE PRECIOS — LIENZO DE STICKERS
//  Edita estos valores para ajustar precios, acabados y límites.
// ============================================================

// --- Interruptor de subidas ---
// Si está en false, se oculta el botón "Subir Logo" del panel.
// La funcionalidad NO se borra, solo se oculta.
export const ENABLE_UPLOADS = false;

// Nota que aparece debajo del botón de subida cuando está activo
export const UPLOAD_POLICY_NOTE =
  'Nota: Todo diseño está sujeto a revisión según nuestras políticas de marca.';

// --- Nota de acabado ---
export const FINISH_NOTE =
  'Todos nuestros stickers incluyen laminado protector de alta durabilidad.';

// --- Tamaños y precios ---
// Cada tramo define un rango en cm (mínimo inclusive, máximo exclusive)
// y el precio base por sticker de ese tamaño.
export interface SizeTier {
  id: string;
  label: string;
  minCm: number;
  maxCm: number;
  basePrice: number;
  points: number;
}

export const SIZE_TIERS: SizeTier[] = [
  { id: 'small', label: 'Pequeño (4–5.9 cm)', minCm: 4, maxCm: 6, basePrice: 0.5, points: 10 },
  { id: 'medium', label: 'Mediano (6–8.9 cm)', minCm: 6, maxCm: 9, basePrice: 0.75, points: 15 },
  { id: 'large', label: 'Grande (9–12 cm)', minCm: 9, maxCm: 12.01, basePrice: 1.0, points: 50 },
];

// --- Acabados ---
// El modificador se suma al precio de cada sticker.
export interface FinishOption {
  id: string;
  label: string;
  description: string;
  priceModifier: number;
}

export const FINISH_OPTIONS: FinishOption[] = [
  { id: 'mate', label: 'Mate', description: 'Acabado suave sin reflejos', priceModifier: 0 },
  { id: 'glossy', label: 'Brillante', description: 'Colores vivos con brillo', priceModifier: 0 },
  { id: 'transparent', label: 'Transparente', description: 'Fondo claro translúcido', priceModifier: 0.5 },
  { id: 'holographic', label: 'Holográfico', description: 'Efecto iridiscente premium', priceModifier: 1.0 },
];

// --- Capacidad de la hoja ---
export const SHEET_CAPACITY = 100;

// --- Límites de tamaño en cm ---
export const MIN_STICKER_CM = 4;
export const MAX_STICKER_CM = 12;

// ============================================================
//  FUNCIONES DE CÁLCULO
// ============================================================

/** Obtiene el tramo de tamaño para una dimensión en cm (lado más corto). */
export function getSizeTier(shortestCm: number): SizeTier {
  return (
    SIZE_TIERS.find((t) => shortestCm >= t.minCm && shortestCm < t.maxCm) ??
    SIZE_TIERS[SIZE_TIERS.length - 1]
  );
}

/** Precio unitario de un sticker según su tamaño y acabado. */
export function getStickerUnitPrice(shortestCm: number, finishId: string): number {
  const tier = getSizeTier(shortestCm);
  const finish = FINISH_OPTIONS.find((f) => f.id === finishId) ?? FINISH_OPTIONS[0];
  return tier.basePrice + finish.priceModifier;
}

/** Etiqueta legible del tamaño. */
export function getSizeLabel(shortestCm: number): string {
  const tier = getSizeTier(shortestCm);
  return tier.label;
}
