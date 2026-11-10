import { Link } from 'react-router-dom';
import { Instagram, Mail, Facebook, Music2 } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store';

export default function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="section-padding py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-lazarus.png" alt="Lazarus" />
              <span className="display-text text-lg text-ink-50">LAZARUS</span>
            </div>
            <p className="text-ink-400 text-sm leading-relaxed max-w-xs">
              Diseño, fotografía y producto. Cultura urbana con identidad.
            </p>
          </div>

          <div>
            <h3 className="text-ink-100 font-semibold uppercase tracking-wider text-sm mb-4">Navegación</h3>
            <ul className="space-y-2">
              <li><Link to="/inicio" className="text-ink-400 text-sm hover:text-accent-500 transition-colors">Inicio</Link></li>
              <li><Link to="/tienda" className="text-ink-400 text-sm hover:text-accent-500 transition-colors">Tienda</Link></li>

            </ul>
          </div>

          <div>
            <h3 className="text-ink-100 font-semibold uppercase tracking-wider text-sm mb-4">Contacto</h3>
            <div className="flex items-center gap-4">
              <a
                href={STORE_CONFIG.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={STORE_CONFIG.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={STORE_CONFIG.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors"
                aria-label="TikTok"
              >
                <Music2 className="w-5 h-5" />
              </a>
              <a
                href={`mailto:hello@lazarus.brand`}
                className="w-10 h-10 flex items-center justify-center border border-ink-700 text-ink-300 hover:border-accent-500 hover:text-accent-500 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-ink-500 text-xs uppercase tracking-wider">© {new Date().getFullYear()} Lazarus Brand</p>
          <div className="flex items-center gap-4">
            <p className="text-ink-500 text-xs uppercase tracking-wider">Diseño · Fotografía · Producto</p>
            <Link to="/admin" className="text-ink-600 text-[10px] uppercase tracking-[0.2em] hover:text-ink-400 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
