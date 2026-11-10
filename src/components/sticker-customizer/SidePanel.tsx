import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Check, Shield } from 'lucide-react';
import { presetStickers, presetStickerToDataUrl } from '@/data/presetStickers';
import {
  ENABLE_UPLOADS,
  UPLOAD_POLICY_NOTE,
  FINISH_NOTE,
  FINISH_OPTIONS,
  type FinishOption,
} from '@/config/pricing';

interface SidePanelProps {
  onAddImage: (src: string, name: string, type: 'upload' | 'preset') => void;
  selectedFinish: string;
  onFinishChange: (finishId: string) => void;
}

type Tab = 'upload' | 'gallery';

export default function SidePanel({ onAddImage, selectedFinish, onFinishChange }: SidePanelProps) {
  const defaultTab: Tab = ENABLE_UPLOADS ? 'upload' : 'gallery';
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    if (file.type !== 'image/png') {
      setUploadError('Solo se permiten archivos PNG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      onAddImage(dataUrl, file.name.replace(/\.[^/.]+$/, ''), 'upload');
      setUploadSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    img.onerror = () => {
      setUploadError('No se pudo cargar la imagen.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    img.src = URL.createObjectURL(file);
  }

  return (
    <aside className="w-full lg:w-72 shrink-0 border-r border-ink-800 bg-ink-900 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-ink-800">
        {ENABLE_UPLOADS && (
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
              tab === 'upload' ? 'text-accent-500 border-b-2 border-accent-500' : 'text-ink-400 hover:text-ink-100 border-b-2 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4" />
            Subir Logo
          </button>
        )}
        <button
          onClick={() => setTab('gallery')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
            tab === 'gallery' ? 'text-accent-500 border-b-2 border-accent-500' : 'text-ink-400 hover:text-ink-100 border-b-2 border-transparent'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Galería
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Upload tab */}
        {ENABLE_UPLOADS && tab === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-ink-700 hover:border-accent-500 transition-colors p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-ink-500 mb-3" />
              <p className="text-ink-300 text-sm font-medium mb-1">Arrastra o haz clic</p>
              <p className="text-ink-500 text-xs">Solo PNG transparente</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 bg-ink-950 border border-red-900/50 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{uploadError}</p>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex items-start gap-2 bg-ink-950 border border-green-900/50 px-3 py-2">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-green-400 text-xs">Logo añadido al lienzo.</p>
              </div>
            )}

            <div className="flex items-start gap-2 bg-ink-950 border border-ink-700 px-3 py-2.5">
              <Shield className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
              <p className="text-ink-400 text-xs leading-relaxed">{UPLOAD_POLICY_NOTE}</p>
            </div>

            <div className="text-xs text-ink-500 leading-relaxed pt-2">
              <p className="mb-2 text-ink-400 uppercase tracking-wider font-medium">Requisitos</p>
              <ul className="space-y-1.5">
                <li>• Formato PNG con transparencia</li>
                <li>• Se añadirá al centro del lienzo A4</li>
                <li>• Arrastra para mover, redimensiona desde las esquinas</li>
                <li>• Tamaño entre 4 cm y 12 cm</li>
              </ul>
            </div>
          </div>
        )}

        {/* Gallery tab */}
        {tab === 'gallery' && (
          <div>
            <p className="text-ink-400 text-xs uppercase tracking-wider font-medium mb-3">
              Stickers prediseñados
            </p>
            <div className="grid grid-cols-3 gap-2">
              {presetStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => onAddImage(presetStickerToDataUrl(sticker), sticker.name, 'preset')}
                  className="aspect-square bg-white border border-ink-700 hover:border-accent-500 transition-colors p-3 group"
                  title={`Añadir ${sticker.name}`}
                >
                  <img
                    src={presetStickerToDataUrl(sticker)}
                    alt={sticker.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Finish selector — always visible */}
        <div className="pt-2 border-t border-ink-800">
          <p className="text-ink-400 text-xs uppercase tracking-wider font-medium mb-3">
            Acabado de la hoja
          </p>
          <div className="space-y-2">
            {FINISH_OPTIONS.map((finish: FinishOption) => (
              <button
                key={finish.id}
                onClick={() => onFinishChange(finish.id)}
                className={`w-full text-left px-3 py-2.5 border transition-all ${
                  selectedFinish === finish.id
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-ink-700 hover:border-ink-500 bg-ink-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${selectedFinish === finish.id ? 'text-accent-500' : 'text-ink-200'}`}>
                    {finish.label}
                  </span>
                  <span className={`text-xs ${finish.priceModifier > 0 ? 'text-accent-500' : 'text-ink-500'}`}>
                    {finish.priceModifier > 0 ? `+$${finish.priceModifier.toFixed(2)}` : 'Incluido'}
                  </span>
                </div>
                <p className="text-ink-500 text-xs mt-0.5">{finish.description}</p>
              </button>
            ))}
          </div>
          <p className="text-ink-500 text-xs mt-3 leading-relaxed">{FINISH_NOTE}</p>
        </div>
      </div>
    </aside>
  );
}
