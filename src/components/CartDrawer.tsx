import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { items, total, itemCount, isOpen, closeCart, updateQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  function handleCheckout() {
    closeCart();
    navigate('/checkout');
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      <aside
        className={`fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-ink-900 border-l border-ink-800 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent-500" />
            <h2 className="display-text text-xl text-ink-50">Carrito</h2>
            {itemCount > 0 && (
              <span className="text-ink-500 text-xs uppercase tracking-wider">({itemCount})</span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-ink-400 hover:text-ink-50 transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center border border-ink-700">
              <ShoppingBag className="w-7 h-7 text-ink-600" />
            </div>
            <p className="text-ink-400 text-sm">Tu carrito está vacío</p>
            <Link to="/tienda" onClick={closeCart} className="btn-secondary">
              Ver tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="w-20 h-20 shrink-0 bg-ink-800 border border-ink-700 overflow-hidden">
                    <img
                      src={product.image_url ?? ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-ink-100 text-sm font-medium truncate">{product.name}</h3>
                    {product.sku && (
                      <p className="text-ink-500 text-xs mt-0.5">SKU: {product.sku}</p>
                    )}
                    <p className="text-accent-500 text-sm font-semibold mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-ink-100 text-sm font-medium w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="ml-auto p-1 text-ink-500 hover:text-red-400 transition-colors"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-ink-200 text-sm font-medium">
                      ${(product.price * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={clear}
                className="text-ink-500 hover:text-red-400 text-xs uppercase tracking-wider transition-colors pt-2"
              >
                Vaciar carrito
              </button>
            </div>

            <footer className="border-t border-ink-800 px-5 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-400 uppercase tracking-wider text-xs">Total</span>
                <span className="text-accent-500 text-2xl font-semibold">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="btn-primary w-full"
              >
                Ir a Pagar
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
