import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard from "@/components/property/PropertyCard";
import { fetchPublicProperties } from "@/lib/osorioRepository";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Property } from "@/types/property";
import { cn } from "@/lib/utils";

const ROTATE_MS = 8000;

function pickThreeRandom(properties: Property[]): Property[] {
  if (properties.length <= 3) return [...properties];
  const copy = [...properties];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

/** Intenta un trío distinto al anterior si hay suficientes filas. */
function pickThreeRandomAvoiding(
  properties: Property[],
  previousIds: Set<string>
): Property[] {
  if (properties.length <= 3) return [...properties];
  if (properties.length <= 6) return pickThreeRandom(properties);

  const others = properties.filter((p) => !previousIds.has(p.id));
  const pool = others.length >= 3 ? others : properties;
  return pickThreeRandom(pool);
}

export default function FeaturedProperties() {
  const { t } = useLanguage();
  const [pool, setPool] = useState<Property[]>([]);
  const [shown, setShown] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const poolRef = useRef<Property[]>([]);

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  const rotate = useCallback(() => {
    const currentPool = poolRef.current;
    if (currentPool.length <= 3) return;
    setFading(true);
    window.setTimeout(() => {
      setShown((prev) => {
        const prevSet = new Set(prev.map((p) => p.id));
        const next = pickThreeRandomAvoiding(currentPool, prevSet);
        return next;
      });
      window.requestAnimationFrame(() => {
        setFading(false);
      });
    }, 400);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const list = await fetchPublicProperties();
      if (!active) return;
      setPool(list);
      const first = pickThreeRandom(list);
      setShown(first);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (pool.length <= 3) return;
    const id = window.setInterval(rotate, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [pool.length, rotate]);

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="section-label">{t('featured.quotes')}</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{t('featured.title')}</h2>
            <p className="text-muted-foreground mt-2 text-sm font-sans">{t('featured.subtitle')}</p>
          </div>
          <Link to="/propiedades" className="btn-outline shrink-0">
            {t('featured.view_all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">{t('featured.empty')}</p>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-500 ease-out",
              fading ? "opacity-0" : "opacity-100"
            )}
          >
            {shown.map((prop, i) => (
              <PropertyCard key={`${prop.id}-${i}`} property={prop} index={i} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
