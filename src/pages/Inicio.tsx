import { Link } from 'react-router-dom';
import { ArrowRight, Camera, PenTool, ShoppingBag, Sparkles } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store';

const services = [
  {
    icon: PenTool,
    title: 'Diseño',
    description: 'Identidad visual, branding y diseño gráfico con estética urbana. Logos, ilustraciones y direcciones de arte que cuentan tu historia.',
  },
  {
    icon: Camera,
    title: 'Fotografía',
    description: 'Sesiones editoriales, de producto y de marca. Capturamos la esencia de la cultura urbana con un estilo crudo y auténtico.',
  },
  {
    icon: ShoppingBag,
    title: 'Productos',
    description: 'Stickers, camisetas y bolsos con diseños exclusivos. Mercancía que viste la identidad de Lazarus en cada pieza.',
  },
];

export default function Inicio() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={STORE_CONFIG.landingImages.hero}
            alt="Arte urbano"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/80 to-ink-950" />
        </div>

        <div className="relative section-padding w-full py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">{STORE_CONFIG.hero.eyebrow}</span>
            </div>
            <h1 className="display-text text-5xl sm:text-7xl lg:text-8xl text-ink-50 mb-6 text-balance animate-fade-up" style={{ animationDelay: '100ms' }}>
              {STORE_CONFIG.hero.title}
            </h1>
            <p className="text-ink-300 text-lg leading-relaxed max-w-xl mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
              {STORE_CONFIG.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <Link to="/tienda" className="btn-primary">
                Ver tienda
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#servicios" className="btn-secondary">Conoce más</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="section-padding py-20 lg:py-28">
        <div className="mb-12">
          <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">Servicios</span>
          <h2 className="display-text text-4xl sm:text-5xl text-ink-50 mt-3">Lo que hacemos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              className="card p-8 hover:border-ink-500 group animate-fade-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-ink-800 border border-ink-700 mb-6 group-hover:border-accent-500 transition-colors">
                <service.icon className="w-6 h-6 text-accent-500" strokeWidth={2} />
              </div>
              <h3 className="display-text text-2xl text-ink-50 mb-3">{service.title}</h3>
              <p className="text-ink-400 leading-relaxed text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="section-padding py-20 lg:py-28 border-t border-ink-800">
        <div className="mb-12">
          <span className="text-accent-500 text-xs uppercase tracking-[0.3em] font-medium">Galería</span>
          <h2 className="display-text text-4xl sm:text-5xl text-ink-50 mt-3">Trabajos recientes</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] gap-3">
          {STORE_CONFIG.landingImages.gallery.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden group ${img.span}`}
            >
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-ink-950/20 group-hover:bg-ink-950/50 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-ink-50 text-xs uppercase tracking-wider">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding py-20 lg:py-28 border-t border-ink-800">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="display-text text-4xl sm:text-6xl text-ink-50 mb-6 text-balance">
            Forma parte del <span className="text-accent-500">movimiento</span>
          </h2>
          <p className="text-ink-400 text-lg mb-8 leading-relaxed">
            Descubre los diseños exclusivos de Lazarus. Stickers, camisetas y bolsos con identidad propia.
          </p>
          <Link to="/tienda" className="btn-primary">
            Ir a la tienda
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
