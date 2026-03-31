import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import PropertyCard from "@/components/property/PropertyCard";
import StyledSelect from "@/components/ui/StyledSelect";
import { SlidersHorizontal, MapPin, Building2, Tag, ArrowUpDown } from "lucide-react";
import type { Neighborhood, Property } from "@/types/property";
import {
  fetchNeighborhoodsForSelect,
  fetchPropertyTypesForSelect,
  fetchPublicProperties,
} from "@/lib/osorioRepository";
import { priceToComparablePyg, type PriceCurrency } from "@/lib/currency";

type SortKey = 'quotes' | 'price_asc' | 'price_desc' | 'newest';

export default function Properties() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [barrio, setBarrio] = useState(searchParams.get("barrio") || "");
  const [tipo, setTipo] = useState(searchParams.get("tipo") || "");
  const [operacion, setOperacion] = useState(searchParams.get("operacion") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<SortKey>('quotes');
  const [showFilters, setShowFilters] = useState(true);

  const [properties, setProperties] = useState<Property[]>([]);
  const [barrios, setBarrios] = useState<Array<{ id: string; name: string }>>([]);
  const [tipos, setTipos] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [props, b, pt] = await Promise.all([
        fetchPublicProperties(),
        fetchNeighborhoodsForSelect(),
        fetchPropertyTypesForSelect(),
      ]);
      if (!active) return;
      setProperties(props);
      setBarrios(b);
      setTipos(pt);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...properties];

    if (barrio) list = list.filter((p) => p.barrio === barrio);
    if (tipo) list = list.filter((p) => p.tipo === tipo);
    if (operacion) list = list.filter((p) => p.operacion === operacion);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.barrio.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "quotes":
        list.sort((a, b) => b.quote_count - a.quote_count);
        break;
      case "price_asc":
        list.sort(
          (a, b) =>
            priceToComparablePyg(a.price, (a.price_currency ?? "PYG") as PriceCurrency) -
            priceToComparablePyg(b.price, (b.price_currency ?? "PYG") as PriceCurrency)
        );
        break;
      case "price_desc":
        list.sort(
          (a, b) =>
            priceToComparablePyg(b.price, (b.price_currency ?? "PYG") as PriceCurrency) -
            priceToComparablePyg(a.price, (a.price_currency ?? "PYG") as PriceCurrency)
        );
        break;
      case "newest":
        list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
        break;
    }

    return list;
  }, [properties, barrio, tipo, operacion, query, sort]);

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{t('properties.title')}</h1>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('properties.filters')}
          </button>

          {showFilters && (
            <div className="animate-reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8 p-4 rounded-xl bg-card border border-border">
              <StyledSelect icon={MapPin} value={barrio} onChange={e => setBarrio(e.target.value)}>
                <option value="">{t('hero.search.all_barrios')}</option>
                {barrios.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </StyledSelect>

              <StyledSelect icon={Building2} value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="">{t('hero.search.all_tipos')}</option>
                {tipos.map((tp) => (
                  <option key={tp.id} value={tp.name}>
                    {tp.name}
                  </option>
                ))}
              </StyledSelect>

              <StyledSelect icon={Tag} value={operacion} onChange={e => setOperacion(e.target.value)}>
                <option value="">{t('hero.search.all_ops')}</option>
                {(["venta", "alquiler"] as const).map((op) => (
                  <option key={op} value={op}>
                    {t(`op.${op}`)}
                  </option>
                ))}
              </StyledSelect>

              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('hero.search.texto')}
                className="h-12 rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
              />

              <StyledSelect icon={ArrowUpDown} value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                <option value="quotes">{t('properties.sort.quotes')}</option>
                <option value="price_asc">{t('properties.sort.price_asc')}</option>
                <option value="price_desc">{t('properties.sort.price_desc')}</option>
                <option value="newest">{t('properties.sort.newest')}</option>
              </StyledSelect>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">{t('properties.no_results')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((prop, i) => (
                <PropertyCard key={prop.id} property={prop} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
