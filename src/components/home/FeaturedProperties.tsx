import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard from "@/components/property/PropertyCard";
import { fetchTopQuotedProperties } from "@/lib/osorioRepository";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Property } from "@/types/property";

export default function FeaturedProperties() {
  const { t } = useLanguage();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const list = await fetchTopQuotedProperties(4);
      if (!active) return;
      setFeatured(list);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="py-24 md:py-32 surface-warm">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {t('featured.quotes')}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.08] tracking-tight">
              {t('featured.title')}
            </h2>
            <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed">
              {t('featured.subtitle')}
            </p>
          </div>
          <Link
            to="/propiedades"
            className="hidden md:inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-lg hover:shadow-xl"
          >
            {t('featured.view_all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[400px] rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((prop, i) => (
              <PropertyCard key={prop.id} property={prop} index={i} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-12 text-center md:hidden">
          <Link
            to="/propiedades"
            className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-lg"
          >
            {t('featured.view_all_properties')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
