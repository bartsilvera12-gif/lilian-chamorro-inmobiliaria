import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPropertyPrice, type PriceCurrency } from '@/lib/currency';
import { Property } from '@/types/property';
import { Bed, Bath, Maximize, MapPin, ArrowRight } from 'lucide-react';

interface Props {
  property: Property;
  index?: number;
  rank?: number;
}

export default function PropertyCard({ property, index = 0, rank }: Props) {
  const { t } = useLanguage();
  const badgeClass =
    property.estado === 'alquilado'
      ? 'badge-alquilado'
      : property.estado === 'vendido'
        ? 'badge-vendido'
        : 'badge-disponible';
  const isRent = property.operacion === 'alquiler';

  return (
    <div
      className={`group rounded-xl overflow-hidden bg-card border border-border animate-reveal ${
        index > 0 ? `animate-reveal-delay-${Math.min(index, 4)}` : ''
      } transition-all duration-300 hover:-translate-y-1 hover:shadow-premium`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.main_image}
          alt={property.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {rank && (
            <span className="badge-status bg-accent text-white">#{rank}</span>
          )}
          <span className={badgeClass}>{t(`estado.${property.estado}`)}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="badge-status bg-white/90 text-foreground backdrop-blur-sm">{t(`op.${property.operacion}`)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-base font-bold text-foreground leading-snug line-clamp-1">
            {property.title}
          </h3>
        </div>

        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1 font-sans">
          <MapPin className="w-3 h-3 shrink-0" />
          {property.barrio} · {property.tipo}
        </p>

        {/* Features */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 font-sans">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.bedrooms}</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms}</span>
          )}
          {property.area_m2 != null && (
            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {property.area_m2} m²</span>
          )}
        </div>

        {/* Price + Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-lg font-sans font-bold text-accent tracking-tight">
            {formatPropertyPrice(property.price, (property.price_currency ?? 'PYG') as PriceCurrency, isRent)}
          </p>
          <Link
            to={`/propiedad/${property.id}`}
            className="text-xs font-semibold font-sans text-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            {t('featured.view')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
