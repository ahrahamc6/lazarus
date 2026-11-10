import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-950/80 backdrop-blur-md border-b border-ink-800">
        <nav className="flex items-center justify-between h-16 section-padding">
          <Link to="/inicio" className="flex items-center gap-2 group">
            <img src="/logo-lazarus.png" alt="Lazarus" />
            <span className="display-text text-xl text-ink-50">LAZARUS</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative p-2 text-ink-100 hover:text-accent-500 transition-colors"
              aria-label="Ver carrito"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={2} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-500 text-ink-950 text-[10px] font-bold rounded-full px-1">
                  {itemCount}
                </span>
              )}
            </button>

            <ul className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
                        isActive ? 'text-accent-500' : 'text-ink-300 hover:text-ink-50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <button
              className="md:hidden p-2 text-ink-100 hover:text-accent-500 transition-colors"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-ink-950/95 backdrop-blur-lg" onClick={() => setOpen(false)} />

        <div className="relative flex flex-col h-full pt-16">
          <button
            className="absolute top-4 right-5 p-2 text-ink-100 hover:text-accent-500 transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-7 h-7" strokeWidth={2} />
          </button>

          <ul className="flex flex-col items-center justify-center gap-8 flex-1 animate-fade-in">
            {navLinks.map((link, i) => (
              <li
                key={link.to}
                style={{ animationDelay: `${i * 80}ms` }}
                className={open ? 'animate-fade-up' : ''}
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `display-text text-4xl transition-colors ${
                      isActive ? 'text-accent-500' : 'text-ink-200 hover:text-accent-500'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="pb-8 text-center">
            <p className="text-ink-500 text-xs uppercase tracking-widest">Lazarus Brand</p>
          </div>
        </div>
      </div>
    </>
  );
}
