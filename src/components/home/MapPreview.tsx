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
    width: 32px; height: 32px;
    background: hsl(42 65% 48%);
    border: 2px solid hsl(220 35% 15%);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="hsl(220 35% 15%)" stroke="none">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
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
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="section-label">{t('map.title')}</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{t('map.subtitle')}</h2>
          </div>
          <Link to="/propiedades" className="text-sm font-semibold font-sans text-accent hover:underline underline-offset-4 transition-colors flex items-center gap-1">
            {t('map.view_all_properties')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="animate-reveal rounded-xl overflow-hidden border border-border bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 relative" style={{ minHeight: '480px' }}>
              <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                {mapProps.map((prop) => (
                  <Marker key={prop.id} position={[prop.lat as number, prop.lng as number]} icon={houseIcon}>
                    <Popup>
                      <div className="min-w-[200px] p-1">
                        <img src={prop.main_image} alt={prop.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                        <p className="font-bold text-sm leading-snug">{prop.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{prop.barrio}</p>
                        <p className="text-sm font-bold mt-1.5" style={{ color: 'hsl(42 65% 42%)' }}>
                          {formatPropertyPrice(prop.price, (prop.price_currency ?? 'PYG') as PriceCurrency, prop.operacion === 'alquiler')}
                        </p>
                        <Link to={`/propiedad/${prop.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline">
                          {t('featured.view')} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              <div className="absolute top-3 right-3 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-premium border border-border flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground font-sans">{properties.length} {t('map.properties_count')}</span>
              </div>
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-border flex flex-col">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-sm font-semibold text-foreground font-sans">{t('map.nearby_properties')}</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border" style={{ maxHeight: '420px' }}>
                {properties.map((prop) => (
                  <Link
                    key={prop.id}
                    to={`/propiedad/${prop.id}`}
                    className="group flex gap-3 p-3 transition-colors hover:bg-muted/50"
                  >
                    <img src={prop.main_image} alt={prop.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug truncate group-hover:text-accent transition-colors font-sans">{prop.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-sans">{prop.barrio}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-sm font-bold text-accent font-sans">
                          {formatPropertyPrice(prop.price, (prop.price_currency ?? 'PYG') as PriceCurrency, prop.operacion === 'alquiler')}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-sans">
                          {prop.bedrooms != null && (<span className="flex items-center gap-0.5"><Bed className="w-3 h-3" /> {prop.bedrooms}</span>)}
                          {prop.area_m2 != null && (<span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" /> {prop.area_m2}</span>)}
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
