import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import QuoteModal from '@/components/property/QuoteModal';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, TrendingUp, Calendar } from 'lucide-react';
import type { Property } from '@/types/property';
import { formatPropertyPrice, type PriceCurrency } from '@/lib/currency';
import { fetchPropertyById, fetchPropertyImagesById } from '@/lib/osorioRepository';

export default function PropertyDetail() {
  const { t, lang } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [quoteOpen, setQuoteOpen] = useState(searchParams.get('cotizar') === '1');

  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      if (!id) return;
      const p = await fetchPropertyById(id);
      if (!active) return;
      setProperty(p);
      const imgs = await fetchPropertyImagesById(id);
      if (!active) return;
      setImages(imgs.map((x) => x.image_url));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const galleryImages = useMemo(() => {
    if (images.length > 0) return images;
    if (property?.main_image) return [property.main_image];
    return [];
  }, [images, property?.main_image]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">{t('detail.not_found')}</p>
          <Link to="/propiedades" className="text-primary hover:underline mt-4 inline-block">{t('detail.back')}</Link>
        </div>
      </Layout>
    );
  }

  const isRent = property.operacion === 'alquiler';

  const status = property.estado;
  const badgeClass =
    status === 'alquilado' ? 'badge-alquilado' : status === 'vendido' ? 'badge-vendido' : 'badge-disponible';

  const showAvailability = status === 'disponible' && Boolean(property.disponibilidad_desde);

  const getLocalizedDescription = (raw: string) => {
    if (!raw) return raw;

    // Soporta formato guardado en BD: "es || en || pt"
    const parts = raw.split(' || ').map((p) => p.trim());
    if (parts.length === 3) {
      if (lang === 'en') return parts[1];
      if (lang === 'pt') return parts[2];
      return parts[0];
    }

    // Fallback para descripciones demo existentes en BD.
    const known: Record<string, { en: string; pt: string }> = {
      'Unidad de lujo totalmente equipada, ideal para inversión o residencia, en zona estratégica de Asunción.': {
        en: 'Fully equipped luxury unit, ideal for investment or residence, in a strategic area of Asunción.',
        pt: 'Unidade de luxo totalmente equipada, ideal para investimento ou moradia, em uma área estratégica de Assunção.',
      },
      'Departamento premium con amenities de primer nivel, balcón panorámico y terminaciones de alta gama.': {
        en: 'Premium apartment with top-tier amenities, panoramic balcony, and high-end finishes.',
        pt: 'Apartamento premium com comodidades de alto padrão, varanda panorâmica e acabamentos de alto nível.',
      },
      'Propiedad de prueba creada por script para validar carga de imagenes por URL.': {
        en: 'Test property created by script to validate image upload by URL.',
        pt: 'Propriedade de teste criada por script para validar o carregamento de imagens por URL.',
      },
    };

    const hit = known[raw];
    if (!hit) return raw;
    if (lang === 'en') return hit.en;
    if (lang === 'pt') return hit.pt;
    return raw;
  };

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container max-w-5xl">
          {/* Back */}
          <Link to="/propiedades" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('detail.back')}
          </Link>

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 animate-reveal">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={badgeClass}>
                  {t(`estado.${property.estado}`)}
                </span>
                <span className="badge-status bg-foreground/80 text-white">{t(`op.${property.operacion}`)}</span>
                {/* Quote count hidden – admin only */}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{property.title}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {property.barrio} · {property.tipo}
              </p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {formatPropertyPrice(property.price, (property.price_currency ?? 'PYG') as PriceCurrency, isRent)}
            </p>
          </div>

          {/* Gallery */}
          <div className="animate-reveal animate-reveal-delay-1 grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <div className="md:col-span-2 aspect-[16/10] rounded-xl overflow-hidden border border-border">
              {galleryImages[0] ? (
                <img src={galleryImages[0]} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary" />
              )}
            </div>
            <div className="grid grid-rows-2 gap-3">
              {galleryImages.slice(1, 3).map((img, i) => (
                <div key={i} className="aspect-[16/10] rounded-xl overflow-hidden border border-border">
                  <img src={img} alt={`${property.title} ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Features */}
              <div className="animate-reveal animate-reveal-delay-3">
                <h2 className="font-bold text-xl text-foreground mb-3">{t('detail.features')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.bedrooms != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Bed className="w-4 h-4 text-primary" />
                      <span className="text-sm">{property.bedrooms} {t('properties.bedrooms')}</span>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="text-sm">{property.bathrooms} {t('properties.bathrooms')}</span>
                    </div>
                  )}
                  {property.area_m2 != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Maximize className="w-4 h-4 text-primary" />
                      <span className="text-sm">{property.area_m2} m²</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="animate-reveal animate-reveal-delay-2">
                <h2 className="font-bold text-xl text-foreground mb-3">{t('detail.description')}</h2>
                <p className="text-foreground/80 leading-relaxed">{getLocalizedDescription(property.description)}</p>
              </div>

              {/* Availability */}
              {showAvailability && (
                <div className="animate-reveal animate-reveal-delay-4 p-4 rounded-xl border border-amber bg-amber-light">
                  <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {t('detail.availability')}
                  </h3>
                  <p className="text-sm text-foreground/80">
                    {t('detail.from')}: {property.disponibilidad_desde}
                    {property.disponibilidad_hasta && ` — ${t('detail.to')}: ${property.disponibilidad_hasta}`}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="sticky top-24 space-y-4">
                <button
                  onClick={() => setQuoteOpen(true)}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-150"
                >
                  {t('detail.quote_btn')}
                </button>
                <a
                  href={`https://wa.me/595987276000?text=${encodeURIComponent(`Hola, me interesa: ${property.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                >
                  {t('quote.whatsapp')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        propertyTitle={property.title}
        propertyId={property.id}
      />
    </Layout>
  );
}
