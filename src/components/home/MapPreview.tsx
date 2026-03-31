import { useEffect, useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, ArrowRight, Bed, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchPublicProperties } from '@/lib/osorioRepository';
import { formatPropertyPrice, type PriceCurrency } from '@/lib/currency';
import type { Property } from '@/types/property';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const houseIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 38px; height: 38px;
    background: white;
    border: 2.5px solid hsl(240 50% 55%);
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="hsl(240 50% 55%)" stroke="none">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>
    </svg>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
});

export default function MapPreview() {
  const { t } = useLanguage();
  const center: [number, number] = [-25.2867, -57.5802];
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await fetchPublicProperties();
      if (!active) return;
      setProperties(list);
    })();
    return () => { active = false; };
  }, []);

  const mapProps = properties.filter((p) => typeof p.lat === "number" && typeof p.lng === "number");

  return (
    <section className="py-20 md:py-28 surface-warm">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-lg">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">
              {t('map.title')}
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.1]">
              {t('map.subtitle')}
            </h2>
          </div>
          <Link
            to="/propiedades"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            {t('map.view_all_properties')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Map + Side */}
        <div className="animate-reveal rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Map */}
            <div className="lg:col-span-2 relative" style={{ minHeight: '520px' }}>
              <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {mapProps.map((prop) => (
                  <Marker key={prop.id} position={[prop.lat as number, prop.lng as number]} icon={houseIcon}>
                    <Popup>
                      <div className="min-w-[220px] p-1">
                        <img src={prop.main_image} alt={prop.title} className="w-full h-28 object-cover rounded-lg mb-2.5" />
                        <p className="font-bold text-sm leading-snug" style={{ color: 'hsl(220 20% 14%)' }}>
                          {prop.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(220 10% 46%)' }}>{prop.barrio}</p>
                        <p className="text-base font-extrabold mt-1.5" style={{ color: 'hsl(240 68% 30%)' }}>
                          {formatPropertyPrice(prop.price, (prop.price_currency ?? 'PYG') as PriceCurrency, prop.operacion === 'alquiler')}
                        </p>
                        <Link
                          to={`/propiedad/${prop.id}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                          style={{ color: 'hsl(240 68% 30%)' }}
                        >
                          {t('featured.view')} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Counter chip */}
              <div className="absolute top-4 right-4 z-[1000] bg-card/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{properties.length} {t('map.properties_count')}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t('map.in_asuncion_surroundings')}</p>
                </div>
              </div>
            </div>

            {/* Side panel: lista con scroll; incluye todas las propiedades públicas cargadas */}
            <div className="border-t lg:border-t-0 lg:border-l border-border flex flex-col">
              <div className="px-5 py-4 border-b border-border bg-secondary/30">
                <p className="text-sm font-bold text-foreground">{t('map.nearby_properties')}</p>
                <p className="text-xs text-muted-foreground">{t('map.click_for_details')}</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border" style={{ maxHeight: '460px' }}>
                {properties.map((prop, i) => (
                  <Link
                    key={prop.id}
                    to={`/propiedad/${prop.id}`}
                    className={`animate-reveal animate-reveal-delay-${Math.min(i + 1, 4)} group flex gap-3.5 p-4 hover:bg-secondary/50 transition-colors duration-150`}
                  >
                    <img src={prop.main_image} alt={prop.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <p className="text-sm font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                          {prop.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {prop.barrio}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-sm font-extrabold text-primary">
                          {formatPropertyPrice(prop.price, (prop.price_currency ?? 'PYG') as PriceCurrency, prop.operacion === 'alquiler')}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {prop.bedrooms != null && (
                            <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" /> {prop.bedrooms}</span>
                          )}
                          {prop.area_m2 != null && (
                            <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" /> {prop.area_m2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
