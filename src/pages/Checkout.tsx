import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clipboard,
  CreditCard,
  ExternalLink,
  ImageIcon,
  Layers,
  Loader2,
  Minus,
  Package,
  Plus,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { STORE_CONFIG } from '@/config/store';
import { useCart } from '@/context/CartContext';
import type { StickerOrderData } from '@/types/sticker-canvas';
import { A4_HEIGHT_CM, A4_WIDTH_CM } from '@/types/sticker-canvas';

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
}

export default function Checkout() {
  const { items: cartItems, total: cartTotal, updateQuantity, removeItem, clear } = useCart();
  const [stickerOrder, setStickerOrder] = useState<StickerOrderData | null>(null);
  const [customer, setCustomer] = useState<CustomerForm>({ name: '', email: '', phone: '' });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState<'receipt' | 'whatsapp' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<'receipt' | 'whatsapp' | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('stickerOrder');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StickerOrderData;
      if (parsed.designImageUrl && parsed.designMeta) setStickerOrder(parsed);
    } catch {
      sessionStorage.removeItem('stickerOrder');
    }
  }, []);

  const hasCartItems = cartItems.length > 0;
  const hasSticker = stickerOrder !== null;
  const hasAnyOrder = hasCartItems || hasSticker;
  const grandTotal = cartTotal + (stickerOrder?.total ?? 0);

  function handleFieldChange(field: keyof CustomerForm, value: string) {
    setCustomer((previous) => ({ ...previous, [field]: value }));
  }

  function handleReceiptChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setReceiptPreview(null);
    if (!file) {
      setReceipt(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('El comprobante debe ser una imagen.');
      event.target.value = '';
      setReceipt(null);
      return;
    }
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  async function copyValue(label: string, value: string) {
    if (!value || value.startsWith('COMPLETAR')) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  function validateForm(requireReceipt: boolean) {
    if (!hasAnyOrder) {
      setError('No hay productos en el carrito. Vuelve a la tienda y agrega productos.');
      return false;
    }
    if (!customer.name.trim() || !customer.email.trim() || !/^\S+@\S+\.\S+$/.test(customer.email.trim())) {
      setError('Escribe un nombre y un correo válido con @.');
      return false;
    }
    if (!/^\d{10}$/.test(customer.phone.trim())) {
      setError('El celular debe tener exactamente 10 dígitos numéricos.');
      return false;
    }
    if (requireReceipt && !receipt) {
      setError('Sube una imagen del comprobante de pago para continuar.');
      return false;
    }
    return true;
  }

  async function uploadReceipt(): Promise<string | null> {
    if (!receipt) return null;
    const extension = receipt.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `checkout/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, receipt, { contentType: receipt.type });
    if (uploadError) throw uploadError;
    return supabase.storage.from('receipts').getPublicUrl(filePath).data.publicUrl;
  }

  function buildOrderNotes(): string {
    const parts: string[] = [];
    if (hasCartItems) {
      parts.push(cartItems.map((i) => `${i.product.name} x${i.quantity}`).join(', '));
    }
    if (hasSticker && stickerOrder) {
      parts.push(`Sticker personalizado A4 · ${stickerOrder.designMeta.itemCount} elemento(s)`);
    }
    return parts.join(' | ');
  }

  async function saveOrder(status: 'Completado' | 'Pendiente de Pago', requireReceipt: boolean) {
    if (!validateForm(requireReceipt)) return null;

    const receiptUrl = await uploadReceipt();

    const { data, error: orderError } = await supabase
      .from('orders')
      .insert({
        status,
        customer_name: customer.name.trim(),
        customer_email: customer.email.trim(),
        customer_phone: customer.phone.trim(),
        total: grandTotal,
        notes: buildOrderNotes(),
        design_image_url: stickerOrder?.designImageUrl ?? null,
        design_meta: (stickerOrder?.designMeta as unknown as Record<string, unknown>) ?? null,
        receipt_url: receiptUrl,
      })
      .select('id')
      .maybeSingle();

    if (orderError) {
      const detail = orderError.details ? `\nDetalle: ${orderError.details}` : '';
      const hint = orderError.hint ? `\nPista: ${orderError.hint}` : '';
      throw new Error(`[${orderError.code}] ${orderError.message}${detail}${hint}`);
    }
    if (!data?.id) throw new Error('No se pudo obtener el identificador del pedido (RETURNING vacío).');

    const orderId = data.id;

    if (hasCartItems) {
      const orderItemsRows = cartItems.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsRows);

      if (itemsError) {
        const detail = itemsError.details ? `\nDetalle: ${itemsError.details}` : '';
        throw new Error(`Error al guardar items: [${itemsError.code}] ${itemsError.message}${detail}`);
      }
    }

    return { id: orderId, receiptUrl };
  }

  async function handleReceiptSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProcessing('receipt');
    setError(null);
    try {
      const saved = await saveOrder('Completado', true);
      if (saved) {
        setSuccessType('receipt');
        setCompletedOrderId(saved.id);
        clear();
        sessionStorage.removeItem('stickerOrder');
      }
    } catch (submissionError) {
      const msg = submissionError instanceof Error ? submissionError.message : 'No se pudo guardar el pedido.';
      setError(msg);
      window.alert(`Error al guardar pedido (comprobante):\n\n${msg}`);
    } finally {
      setProcessing(null);
    }
  }

  async function handleWhatsApp() {
    setProcessing('whatsapp');
    setError(null);
    try {
      const saved = await saveOrder('Pendiente de Pago', false);
      if (!saved) {
        setProcessing(null);
        return;
      }

      const phone = STORE_CONFIG.whatsappNumber.replace(/\D/g, '');
      const productLines = cartItems.map((i) => `• ${i.product.name} x${i.quantity} — $${(i.product.price * i.quantity).toFixed(2)}`);
      if (hasSticker && stickerOrder) {
        productLines.push(`• Sticker personalizado A4 (${stickerOrder.designMeta.itemCount} elementos) — $${stickerOrder.total.toFixed(2)}`);
      }
      const message = `Hola, acabo de realizar el pedido #${saved.id} en la web.\n\nProductos:\n${productLines.join('\n')}\n\nTotal: $${grandTotal.toFixed(2)}\n\nQuiero coordinar el pago y la entrega.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      sessionStorage.removeItem('stickerOrder');
      setSuccessType('whatsapp');
      setCompletedOrderId(saved.id);
      setProcessing(null);
    } catch (submissionError) {
      const msg = submissionError instanceof Error ? submissionError.message : 'No se pudo preparar el pedido para WhatsApp.';
      setError(msg);
      window.alert(`Error al guardar pedido (WhatsApp):\n\n${msg}`);
      setProcessing(null);
    }
  }

  if (completedOrderId && successType) {
    return (
      <ThankYou
        orderId={completedOrderId}
        message={
          successType === 'receipt'
            ? STORE_CONFIG.checkoutMessages.successReceipt
            : STORE_CONFIG.checkoutMessages.successWhatsApp
        }
      />
    );
  }

  if (!hasAnyOrder) {
    return (
      <div className="section-padding py-24 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-16 h-16 flex items-center justify-center bg-ink-800 border border-ink-700 mb-6">
          <Package className="w-8 h-8 text-ink-500" />
        </div>
        <h1 className="display-text text-3xl text-ink-50 mb-3">Tu carrito está vacío</h1>
        <p className="text-ink-400 text-sm max-w-md mb-8">
          Agrega productos desde la tienda o crea un diseño de stickers personalizado para continuar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/tienda" className="btn-primary">Ir a la tienda</Link>
          <Link to="/tienda/stickers-personalizados" className="btn-secondary">Crear stickers personalizados</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="section-padding pt-12 pb-8 border-b border-ink-800">
        <Link to="/tienda" className="inline-flex items-center gap-1.5 text-ink-400 hover:text-accent-500 text-xs uppercase tracking-wider mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Seguir comprando
        </Link>
        <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">Compra sin registro</span>
        <h1 className="display-text text-4xl sm:text-6xl text-ink-50 mt-3">Finaliza tu pedido</h1>
        <p className="text-ink-400 mt-4 max-w-2xl leading-relaxed">
          Completa tus datos, realiza el pago y envía tu comprobante. No necesitas crear una cuenta.
        </p>
      </section>

      <form onSubmit={handleReceiptSubmit} className="section-padding py-8 lg:py-12">
        {error && (
          <div className="max-w-6xl mx-auto mb-6 flex items-start gap-3 bg-ink-950 border border-red-900/50 px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm flex-1 whitespace-pre-line">{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-8">
          {/* Left: customer form + receipt */}
          <section className="card p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center bg-accent-500/10 border border-accent-500/30">
                <CreditCard className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <h2 className="display-text text-2xl text-ink-50">Tus datos</h2>
                <p className="text-ink-500 text-xs">Los usaremos para preparar tu pedido.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Nombre completo" value={customer.name} placeholder="Tu nombre" onChange={(value) => handleFieldChange('name', value)} />
              <Field label="Correo electrónico" type="email" value={customer.email} placeholder="tu@email.com" onChange={(value) => handleFieldChange('email', value)} />
              <Field label="Celular" type="tel" value={customer.phone} placeholder="0999999999" onChange={(value) => handleFieldChange('phone', value)} inputMode="numeric" maxLength={10} />
            </div>

            <div className="mt-8 pt-6 border-t border-ink-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-ink-100 font-medium">Comprobante de pago</h3>
                <span className="text-ink-500 text-xs">Imagen</span>
              </div>
              {receiptPreview ? (
                <div className="relative border border-ink-700 bg-white p-2">
                  <img src={receiptPreview} alt="Vista previa del comprobante" className="w-full max-h-52 object-contain" />
                  <label className="absolute bottom-3 right-3 btn-secondary !px-3 !py-2 cursor-pointer bg-ink-950/90">
                    Cambiar
                    <input type="file" accept="image/*" className="hidden" onChange={handleReceiptChange} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-700 hover:border-accent-500 py-9 cursor-pointer transition-colors">
                  <Upload className="w-7 h-7 text-ink-500" />
                  <span className="text-ink-200 text-sm font-medium">Subir comprobante</span>
                  <span className="text-ink-500 text-xs">PNG, JPG o WebP</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleReceiptChange} />
                </label>
              )}
            </div>
          </section>

          {/* Right: order summary + payment instructions */}
          <section className="space-y-6">
            <div className="card p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 flex items-center justify-center bg-accent-500/10 border border-accent-500/30">
                  <Package className="w-5 h-5 text-accent-500" />
                </div>
                <div>
                  <h2 className="display-text text-2xl text-ink-50">Resumen del pedido</h2>
                  <p className="text-ink-500 text-xs">{cartItems.length + (hasSticker ? 1 : 0)} artículo(s)</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Cart products */}
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 items-center py-2 border-b border-ink-800/60">
                    <div className="w-16 h-16 shrink-0 bg-ink-800 border border-ink-700 overflow-hidden">
                      <img src={product.image_url ?? ''} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-ink-100 text-sm font-medium truncate">{product.name}</h3>
                      <p className="text-ink-500 text-xs">${product.price.toFixed(2)} c/u</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} className="w-6 h-6 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-ink-100 text-xs font-medium w-5 text-center">{quantity}</span>
                        <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} className="w-6 h-6 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => removeItem(product.id)} className="ml-auto text-ink-500 hover:text-red-400 text-xs transition-colors">
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-ink-100 text-sm font-medium">${(product.price * quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}

                {/* Custom sticker design */}
                {hasSticker && stickerOrder && (
                  <div className="flex gap-3 items-center py-2 border-b border-ink-800/60">
                    <div className="w-16 h-16 shrink-0 bg-white p-1 border border-ink-700">
                      <img src={stickerOrder.designImageUrl} alt="Diseño A4" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-ink-100 text-sm font-medium">Stickers Personalizados</h3>
                      <p className="text-ink-400 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-accent-500" />
                        {stickerOrder.designMeta.itemCount} elemento(s)
                      </p>
                      <p className="text-ink-400 text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-accent-500" />
                        A4 · {A4_WIDTH_CM} × {A4_HEIGHT_CM} cm
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-ink-100 text-sm font-medium">${stickerOrder.total.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-ink-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Subtotal</span>
                  <span className="text-ink-200">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-ink-400 uppercase tracking-wider text-xs">Total a pagar</span>
                  <span className="text-accent-500 text-2xl font-semibold">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <Wallet className="w-5 h-5 text-accent-500" />
                <h2 className="display-text text-2xl text-ink-50">Instrucciones de pago</h2>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-ink-400">Realiza una transferencia bancaria o paga con PayPal por el total indicado.</p>
                <div className="space-y-2 bg-ink-950 border border-ink-800 p-4">
                  <p className="text-ink-100 font-medium">{STORE_CONFIG.banking.bankName}</p>
                  <p className="text-ink-400">Titular: {STORE_CONFIG.banking.accountHolder}</p>
                  <CopyRow label="Cuenta" value={STORE_CONFIG.banking.accountNumber} copied={copied === 'Cuenta'} onCopy={() => copyValue('Cuenta', STORE_CONFIG.banking.accountNumber)} />
                  <CopyRow label="Tipo" value={STORE_CONFIG.banking.accountType} copied={copied === 'Tipo'} onCopy={() => copyValue('Tipo', STORE_CONFIG.banking.accountType)} />
                  <CopyRow label="Identificación" value={STORE_CONFIG.banking.identification} copied={copied === 'Identificación'} onCopy={() => copyValue('Identificación', STORE_CONFIG.banking.identification)} />
                </div>
                {STORE_CONFIG.paypalUrl ? (
                  <a href={STORE_CONFIG.paypalUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                    Pagar con PayPal <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-ink-500 text-xs border border-ink-800 px-3 py-2">Enlace de PayPal pendiente de configurar.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="submit" disabled={processing !== null} className="btn-primary w-full">
            {processing === 'receipt' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {processing === 'receipt' ? 'Guardando pedido...' : 'Subir Comprobante'}
          </button>
          <button type="button" onClick={handleWhatsApp} disabled={processing !== null} className="btn-secondary w-full border-green-800 text-green-400 hover:border-green-500 hover:text-green-300">
            {processing === 'whatsapp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            {processing === 'whatsapp' ? 'Preparando WhatsApp...' : 'Enviar por WhatsApp'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = 'text', value, placeholder, onChange, inputMode, maxLength }: { label: string; type?: string; value: string; placeholder: string; onChange: (value: string) => void; inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'search' | 'decimal' | 'none'; maxLength?: number }) {
  return (
    <label className="block">
      <span className="block text-ink-300 text-xs uppercase tracking-wider mb-2">{label}</span>
      <input type={type} required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} className="input-field" />
    </label>
  );
}

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-ink-400">
      <span>{label}: {value}</span>
      <button type="button" onClick={onCopy} disabled={value.startsWith('COMPLETAR')} className="inline-flex items-center gap-1 text-xs text-accent-500 hover:text-accent-300 disabled:text-ink-600 disabled:cursor-not-allowed">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

function ThankYou({ orderId, message }: { orderId: string; message: string }) {
  return (
    <section className="section-padding min-h-[calc(100vh-4rem)] py-24 flex items-center justify-center">
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 mx-auto flex items-center justify-center bg-green-500/10 border border-green-500/30 mb-7">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">Pedido recibido</span>
        <h1 className="display-text text-4xl sm:text-5xl text-ink-50 mt-3 mb-4">Gracias por tu compra</h1>
        <p className="text-ink-400 leading-relaxed mb-6">{message}</p>
        <p className="text-ink-500 text-xs uppercase tracking-wider mb-8">Pedido #{orderId}</p>
        <Link to="/tienda" className="btn-primary">Volver a la tienda</Link>
      </div>
    </section>
  );
}
