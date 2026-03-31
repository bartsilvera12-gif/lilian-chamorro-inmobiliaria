import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPropertyPrice, type PriceCurrency } from '@/lib/currency';
import { Property } from '@/types/property';
import { Bed, Bath, Maximize, TrendingUp, MapPin } from 'lucide-react';

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
      className={`group rounded-2xl overflow-hidden bg-card border border-border card-hover animate-reveal ${
        index > 0 ? `animate-reveal-delay-${Math.min(index, 4)}` : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.main_image}
          alt={property.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {rank && (
            <span className="badge-status bg-primary text-primary-foreground font-bold">
              #{rank}
            </span>
          )}
            <span className={badgeClass}>
            {t(`estado.${property.estado}`)}
          </span>
        </div>

        {/* Quote count hidden – admin only */}

        {/* Price bottom-left */}
        <div className="absolute bottom-3 left-3">
          <p className="text-lg font-extrabold text-white drop-shadow-md">
            {formatPropertyPrice(property.price, (property.price_currency ?? 'PYG') as PriceCurrency, isRent)}
          </p>
        </div>

        {/* Operation badge bottom-right */}
        <div className="absolute bottom-3 right-3">
          <span className="badge-status bg-white/90 text-foreground backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {t(`op.${property.operacion}`)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground leading-snug mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
          {property.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {property.barrio} · {property.tipo}
        </p>

        {/* Features */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1">
              <Bed className="w-3 h-3" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1">
              <Bath className="w-3 h-3" /> {property.bathrooms}
            </span>
          )}
          {property.area_m2 != null && (
            <span className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1">
              <Maximize className="w-3 h-3" /> {property.area_m2} m²
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/propiedad/${property.id}`}
            className="flex-1 h-10 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold flex items-center justify-center hover:bg-secondary/80 active:scale-[0.97] transition-all duration-150"
          >
            {t('featured.view')}
          </Link>
          <Link
            to={`/propiedad/${property.id}?cotizar=1`}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:opacity-90 active:scale-[0.97] transition-all duration-150"
          >
            {t('featured.quote')}
          </Link>
        </div>
      </div>
    </div>
  );
}
