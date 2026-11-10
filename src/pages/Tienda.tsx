import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import type { Category, Product } from '@/types/database';
import { Package, Tag, ArrowRight, AlertCircle, Sparkles, Wand2, ShoppingBag, Check } from 'lucide-react';

const placeholderImages: Record<string, string> = {
  stickers: 'https://images.pexels.com/photos/30101199/pexels-photo-30101199.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  camisetas: 'https://images.pexels.com/photos/13995911/pexels-photo-13995911.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  bolsos: 'https://images.pexels.com/photos/1214212/pexels-photo-1214212.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

const categoryIcons: Record<string, typeof Package> = {
  stickers: Tag,
  camisetas: Package,
  bolsos: Package,
};

export default function Tienda() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: cats, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (catError) {
        setError(catError.message);
        setLoading(false);
        return;
      }

      setCategories(cats ?? []);

      const { data: prods, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodError) {
        setError(prodError.message);
        setLoading(false);
        return;
      }

      const grouped: Record<string, Product[]> = {};
      for (const cat of cats ?? []) {
        grouped[cat.id] = (prods ?? []).filter((p) => p.category_id === cat.id);
      }
      setProductsByCategory(grouped);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="section-padding py-32 flex items-center justify-center">
        <div className="text-ink-400 text-sm uppercase tracking-widest animate-pulse">Cargando catálogo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding py-32 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-8 h-8 text-accent-500" />
        <p className="text-ink-300 text-sm">No se pudo cargar el catálogo.</p>
        <p className="text-ink-500 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="section-padding pt-12 pb-8 border-b border-ink-800">
        <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">Catálogo</span>
        <h1 className="display-text text-4xl sm:text-6xl text-ink-50 mt-3">Tienda</h1>
        <p className="text-ink-400 mt-4 max-w-2xl leading-relaxed">
          Explora nuestras colecciones. Diseños exclusivos con identidad urbana.
        </p>
      </section>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="section-padding py-20 text-center">
          <p className="text-ink-400">Aún no hay categorías configuradas.</p>
        </div>
      ) : (
        <div className="section-padding py-12 space-y-16">
          {categories.map((category) => {
            const products = productsByCategory[category.id] ?? [];
            const Icon = categoryIcons[category.slug] ?? Tag;
            const placeholderImg = placeholderImages[category.slug] ?? placeholderImages.stickers;

            return (
              <section key={category.id}>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 flex items-center justify-center bg-ink-800 border border-ink-700">
                        <Icon className="w-5 h-5 text-accent-500" strokeWidth={2} />
                      </div>
                      <span className="text-ink-500 text-xs uppercase tracking-[0.2em]">
                        {products.length} producto{products.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h2 className="display-text text-3xl sm:text-4xl text-ink-50">{category.name}</h2>
                    {category.description && (
                      <p className="text-ink-400 mt-2 max-w-xl text-sm leading-relaxed">{category.description}</p>
                    )}
                  </div>
                </div>

                {/* Customizer banner for stickers category */}
                {category.slug === 'stickers' && (
                  <Link
                    to="/tienda/stickers-personalizados"
                    className="group block mb-4 relative overflow-hidden border border-accent-500/30 hover:border-accent-500 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-transparent" />
                    <div className="relative flex items-center gap-4 p-5 sm:p-6">
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-accent-500/10 border border-accent-500/30 group-hover:bg-accent-500 group-hover:border-accent-500 transition-all">
                        <Wand2 className="w-6 h-6 text-accent-500 group-hover:text-ink-950 transition-colors" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-accent-500" />
                          <span className="text-accent-500 text-xs uppercase tracking-widest font-medium">Personalizable</span>
                        </div>
                        <h3 className="display-text text-xl text-ink-50">Crea tus propios stickers</h3>
                        <p className="text-ink-400 text-sm mt-1">Sube tu logo o usa nuestra galería. Diseño en lienzo A4 interactivo.</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-ink-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Link>
                )}

                {products.length === 0 && category.slug !== 'stickers' ? (
                  <div className="card p-8 text-center">
                    <p className="text-ink-500 text-sm">Próximamente. Estamos trabajando en esta colección.</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-ink-500 text-sm">Más productos próximamente. Mientras tanto, ¡diseña tus propios stickers!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="card group hover:border-ink-500 cursor-default flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-ink-800">
        <img
          src={product.image_url ?? ''}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-ink-950/70 flex items-center justify-center">
            <span className="text-ink-100 text-xs uppercase tracking-widest">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-ink-50 font-medium text-sm truncate group-hover:text-accent-500 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-ink-500 text-xs mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-800 mt-auto">
          <span className="text-accent-500 font-semibold text-sm">${product.price.toFixed(2)}</span>
          {product.sku && <span className="text-ink-600 text-[10px] uppercase tracking-wider">{product.sku}</span>}
        </div>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:bg-accent-500 enabled:text-ink-950 enabled:hover:bg-accent-400 border border-ink-700 enabled:border-accent-500"
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              Agregado
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              Agregar al Carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
}
