import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Category, Product, Order, OrderItem, OrderStatus } from '@/types/database';
import {
  LogOut, Package, ShoppingCart, Plus, Edit3, Trash2, X, AlertCircle, TrendingUp, Upload, Loader2, Users, ExternalLink,
} from 'lucide-react';

type Tab = 'inventory' | 'orders' | 'customers';

const statusOptions: OrderStatus[] = ['pending', 'Pendiente de Pago', 'Completado', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [tab, setTab] = useState<Tab>('inventory');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [catRes, prodRes, orderRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (catRes.error || prodRes.error || orderRes.error) {
      setError(catRes.error?.message || prodRes.error?.message || orderRes.error?.message || 'Error');
      setLoading(false);
      return;
    }

    setCategories(catRes.data ?? []);
    setProducts(prodRes.data ?? []);
    setOrders(orderRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    totalProducts: products.length,
    lowStock: products.filter((p) => p.stock <= 5).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'Pendiente de Pago').length,
    revenue: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0),
  };

  const customers = Array.from(
    orders.reduce((groups, order) => {
      const key = order.customer_email.trim().toLowerCase();
      const existing = groups.get(key);
      if (existing) {
        existing.orderCount += 1;
        if (!existing.phone && order.customer_phone) existing.phone = order.customer_phone;
      } else {
        groups.set(key, {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone ?? '—',
          orderCount: 1,
        });
      }
      return groups;
    }, new Map<string, { name: string; email: string; phone: string; orderCount: number }>()).values(),
  );

  async function loadOrderItems(orderId: string) {
    if (orderItems[orderId]) return;
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (!error && data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      setError(error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleProductSaved() {
    setShowProductForm(false);
    setEditingProduct(null);
    loadData();
  }

  if (loading) {
    return (
      <div className="section-padding py-32 flex items-center justify-center">
        <div className="text-ink-400 text-sm uppercase tracking-widest animate-pulse">Cargando panel...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in section-padding py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">Panel de control</span>
          <h1 className="display-text text-3xl sm:text-4xl text-ink-50 mt-2">Dashboard</h1>
          <p className="text-ink-500 text-sm mt-1">Conectado como {user?.email}</p>
        </div>
        <button onClick={() => signOut()} className="btn-secondary self-start sm:self-auto">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-ink-950 border border-red-900/50 px-4 py-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Productos" value={stats.totalProducts} />
        <StatCard icon={TrendingUp} label="Stock bajo" value={stats.lowStock} />
        <StatCard icon={ShoppingCart} label="Pedidos" value={stats.totalOrders} />
        <StatCard icon={TrendingUp} label="Ingresos" value={`${stats.revenue.toFixed(2)}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink-800">
        <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={Package} label="Inventario" />
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} icon={ShoppingCart} label="Pedidos" badge={stats.pendingOrders} />
        <TabButton active={tab === 'customers'} onClick={() => setTab('customers')} icon={Users} label="Clientes" />
      </div>

      {/* Inventory */}
      {tab === 'inventory' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="display-text text-2xl text-ink-50">Productos</h2>
            <button
              onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>

          {products.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-400">No hay productos. Crea el primero.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const cat = categories.find((c) => c.id === product.category_id);
                return (
                  <div key={product.id} className="card overflow-hidden">
                    <div className="aspect-video bg-ink-800 overflow-hidden">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-ink-50 font-medium text-sm truncate">{product.name}</h3>
                          <p className="text-ink-500 text-xs">{cat?.name ?? 'Sin categoría'}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 shrink-0 ${product.stock <= 5 ? 'text-accent-500 bg-accent-500/10' : 'text-ink-400 bg-ink-800'}`}>
                          {product.stock} ud.
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-accent-500 font-semibold text-sm">${product.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                            className="p-2 text-ink-400 hover:text-ink-100 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-ink-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          <h2 className="display-text text-2xl text-ink-50 mb-4">Pedidos</h2>
          {orders.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-400">No hay pedidos todavía.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="card">
                  <button
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 text-left"
                    onClick={() => {
                      if (selectedOrder === order.id) {
                        setSelectedOrder(null);
                      } else {
                        setSelectedOrder(order.id);
                        loadOrderItems(order.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-ink-800 border border-ink-700 shrink-0">
                        <ShoppingCart className="w-5 h-5 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-ink-50 font-medium text-sm">{order.customer_name}</p>
                        <p className="text-ink-500 text-xs">{order.customer_email}</p>
                        <p className="text-ink-500 text-xs">{order.customer_phone || 'Sin celular'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-ink-300 text-xs">
                        {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-accent-500 font-semibold text-sm">${Number(order.total).toFixed(2)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </button>

                  {selectedOrder === order.id && (
                    <div className="border-t border-ink-800 p-5 bg-ink-950/50 animate-fade-in">
                      {order.shipping_address && (
                        <p className="text-ink-400 text-sm mb-3">
                          <span className="text-ink-500 uppercase text-xs tracking-wider">Envío:</span>{' '}
                          {order.shipping_address}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-ink-400 text-sm mb-3">
                          <span className="text-ink-500 uppercase text-xs tracking-wider">Notas:</span>{' '}
                          {order.notes}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                        <p className="text-ink-400"><span className="text-ink-500 text-xs uppercase tracking-wider">Celular:</span> {order.customer_phone || '—'}</p>
                        <p className="text-ink-400"><span className="text-ink-500 text-xs uppercase tracking-wider">Total:</span> ${Number(order.total).toFixed(2)}</p>
                        <p className="text-ink-400"><span className="text-ink-500 text-xs uppercase tracking-wider">Fecha:</span> {new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                      {order.receipt_url && (
                        <a href={order.receipt_url} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-2 mb-4">
                          <ExternalLink className="w-4 h-4" /> Ver Comprobante
                        </a>
                      )}

                      <h4 className="text-ink-300 text-xs uppercase tracking-wider mb-2 mt-4">Artículos</h4>
                      {orderItems[order.id] ? (
                        <ul className="space-y-2">
                          {orderItems[order.id].map((item) => (
                            <li key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-ink-200">
                                {item.quantity}× {item.product_name}
                              </span>
                              <span className="text-ink-400">${Number(item.subtotal).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-ink-500 text-sm">Cargando...</p>
                      )}

                      <h4 className="text-ink-300 text-xs uppercase tracking-wider mb-2 mt-5">Cambiar estado</h4>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateOrderStatus(order.id, s)}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                              order.status === s
                                ? 'border-accent-500 text-accent-500 bg-accent-500/10'
                                : 'border-ink-700 text-ink-400 hover:border-ink-500'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="display-text text-2xl text-ink-50">Clientes</h2>
              <p className="text-ink-500 text-sm mt-1">Contactos únicos agrupados por correo electrónico.</p>
            </div>
            <span className="text-ink-400 text-sm">{customers.length} cliente{customers.length !== 1 ? 's' : ''}</span>
          </div>
          {customers.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-400">Aún no hay clientes registrados.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="border-b border-ink-800">
                  <tr>
                    <th className="px-5 py-4 text-ink-500 text-xs uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-4 text-ink-500 text-xs uppercase tracking-wider">Correo</th>
                    <th className="px-5 py-4 text-ink-500 text-xs uppercase tracking-wider">Celular</th>
                    <th className="px-5 py-4 text-ink-500 text-xs uppercase tracking-wider">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.email.toLowerCase()} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/40 transition-colors">
                      <td className="px-5 py-4 text-ink-100 text-sm font-medium">{customer.name}</td>
                      <td className="px-5 py-4 text-ink-400 text-sm">{customer.email}</td>
                      <td className="px-5 py-4 text-ink-400 text-sm">{customer.phone}</td>
                      <td className="px-5 py-4 text-accent-500 text-sm font-semibold">{customer.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product form modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 text-accent-500" />
        <span className="text-ink-500 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="display-text text-2xl text-ink-50">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, badge }: {
  active: boolean; onClick: () => void; icon: typeof Package; label: string; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
        active ? 'text-accent-500 border-accent-500' : 'text-ink-400 border-transparent hover:text-ink-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 bg-accent-500 text-ink-950 text-xs px-1.5 rounded-full font-bold">{badge}</span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    paid: 'text-blue-400 bg-blue-400/10',
    shipped: 'text-purple-400 bg-purple-400/10',
    delivered: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    Completado: 'text-green-400 bg-green-400/10',
    'Pendiente de Pago': 'text-yellow-400 bg-yellow-400/10',
  };
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    Completado: 'Completado',
    'Pendiente de Pago': 'Pendiente de Pago',
  };
  return (
    <span className={`text-xs px-2.5 py-1 uppercase tracking-wider font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(product?.price.toString() ?? '');
  const [stock, setStock] = useState(product?.stock.toString() ?? '0');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Solo se permiten archivos de imagen.');
      return;
    }

    setUploading(true);
    setFormError(null);

    const ext = file.name.split('.').pop() ?? 'png';
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      setFormError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    setImageUrl(urlData.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Precio inválido');
      setSaving(false);
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Stock inválido');
      setSaving(false);
      return;
    }

    const payload = {
      name,
      slug: slugify(name) + (product ? '' : '-' + Math.random().toString(36).slice(2, 6)),
      category_id: categoryId,
      price: priceNum,
      stock: stockNum,
      sku: sku || null,
      description: description || null,
      image_url: imageUrl || null,
      is_active: isActive,
    };

    let error;
    if (product) {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    if (error) {
      setFormError(error.message);
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ink-900 border border-ink-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-ink-800 sticky top-0 bg-ink-900 z-10">
          <h2 className="display-text text-xl text-ink-50">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="flex items-center gap-2 bg-ink-950 border border-red-900/50 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Sticker Lazarus Logo"
            />
          </div>

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Categoría</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="15.00"
              />
            </div>
            <div>
              <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Stock</label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Código / SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="input-field"
              placeholder="LZ-STK-001"
            />
          </div>

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="Descripción del producto..."
            />
          </div>

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Imagen del producto</label>
            {imageUrl ? (
              <div className="relative mb-3 group">
                <img src={imageUrl} alt="Vista previa" className="w-full h-40 object-cover border border-ink-700" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-ink-950/80 border border-ink-600 text-ink-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-700 hover:border-accent-500 transition-colors py-8 cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-accent-500 animate-spin" />
                    <span className="text-ink-400 text-sm">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-ink-500" />
                    <span className="text-ink-300 text-sm font-medium">Haz clic para subir una imagen</span>
                    <span className="text-ink-500 text-xs">PNG, JPG, WebP</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-accent-500"
            />
            <span className="text-ink-300 text-sm">Visible en la tienda</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
