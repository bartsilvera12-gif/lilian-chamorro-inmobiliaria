import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import QuoteModal from '@/components/property/QuoteModal';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Calendar, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Property } from '@/types/property';
import { formatPropertyPrice, type PriceCurrency } from '@/lib/currency';
import { fetchPropertyById, fetchPropertyImagesById } from '@/lib/osorioRepository';

export default function PropertyDetail() {
  const { t, lang } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [quoteOpen, setQuoteOpen] = useState(searchParams.get('cotizar') === '1');
  const [activeImg, setActiveImg] = useState(0);

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
    return () => { active = false; };
  }, [id]);

  const galleryImages = useMemo(() => {
    if (images.length > 0) return images;
    if (property?.main_image) return [property.main_image];
    return [];
  }, [images, property?.main_image]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <p className="text-muted-foreground font-sans">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground font-sans">{t('detail.not_found')}</p>
          <Link to="/propiedades" className="text-accent hover:underline mt-4 inline-block font-sans">{t('detail.back')}</Link>
        </div>
      </Layout>
    );
  }

  const isRent = property.operacion === 'alquiler';
  const status = property.estado;
  const badgeClass = status === 'alquilado' ? 'badge-alquilado' : status === 'vendido' ? 'badge-vendido' : 'badge-disponible';
  const showAvailability = status === 'disponible' && Boolean(property.disponibilidad_desde);

  const getLocalizedDescription = (raw: string) => {
    if (!raw) return raw;
    const parts = raw.split(' || ').map((p) => p.trim());
    if (parts.length === 3) {
      if (lang === 'en') return parts[1];
      if (lang === 'pt') return parts[2];
      return parts[0];
    }
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

  const prevImg = () => setActiveImg((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % galleryImages.length);

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container max-w-5xl">
          <Link to="/propiedades" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-sans">
            <ArrowLeft className="w-4 h-4" /> {t('detail.back')}
          </Link>

          {/* Gallery */}
          <div className="animate-reveal mb-8">
            <div className="relative rounded-xl overflow-hidden border border-border">
              <div className="aspect-[16/9] relative bg-muted">
                {galleryImages[activeImg] ? (
                  <img src={galleryImages[activeImg]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
                {galleryImages.length > 1 && (
                  <>
                    <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {galleryImages.map((_, i) => (
                        <button key={i} onClick={() => setActiveImg(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-accent w-5' : 'bg-white/60'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {galleryImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-reveal">
                <div className="flex items-center gap-2 mb-2">
                  <span className={badgeClass}>{t(`estado.${property.estado}`)}</span>
                  <span className="badge-status bg-primary text-primary-foreground">{t(`op.${property.operacion}`)}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">{property.title}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5" /> {property.barrio} · {property.tipo}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-accent mt-3 font-sans">
                  {formatPropertyPrice(property.price, (property.price_currency ?? 'PYG') as PriceCurrency, isRent)}
                </p>
              </div>

              {/* Features */}
              <div className="animate-reveal animate-reveal-delay-1">
                <h2 className="font-serif text-lg font-bold text-foreground mb-3">{t('detail.features')}</h2>
                <div className="grid grid-cols-3 gap-3">
                  {property.bedrooms != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Bed className="w-4 h-4 text-accent" />
                      <span className="text-sm font-sans">{property.bedrooms} {t('properties.bedrooms')}</span>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Bath className="w-4 h-4 text-accent" />
                      <span className="text-sm font-sans">{property.bathrooms} {t('properties.bathrooms')}</span>
                    </div>
                  )}
                  {property.area_m2 != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Maximize className="w-4 h-4 text-accent" />
                      <span className="text-sm font-sans">{property.area_m2} m²</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="animate-reveal animate-reveal-delay-2">
                <h2 className="font-serif text-lg font-bold text-foreground mb-3">{t('detail.description')}</h2>
                <p className="text-foreground/75 leading-relaxed font-sans text-sm">{getLocalizedDescription(property.description)}</p>
              </div>

              {showAvailability && (
                <div className="animate-reveal animate-reveal-delay-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
                  <h3 className="font-semibold text-sm text-foreground mb-1 flex items-center gap-2 font-sans">
                    <Calendar className="w-4 h-4 text-accent" /> {t('detail.availability')}
                  </h3>
                  <p className="text-sm text-foreground/80 font-sans">
                    {t('detail.from')}: {property.disponibilidad_desde}
                    {property.disponibilidad_hasta && ` — ${t('detail.to')}: ${property.disponibilidad_hasta}`}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="sticky top-20 space-y-3 animate-reveal animate-reveal-delay-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground font-sans mb-4">¿Te interesa esta propiedad?</p>
                  <button onClick={() => setQuoteOpen(true)} className="w-full btn-gold mb-2">
                    {t('detail.quote_btn')}
                  </button>
                  <a
                    href={`https://wa.me/595986965042?text=${encodeURIComponent(`Hola, me interesa: ${property.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-outline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('quote.whatsapp')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} propertyTitle={property.title} propertyId={property.id} />
    </Layout>
  );
}
