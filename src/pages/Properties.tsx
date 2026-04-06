import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import PropertyCard from "@/components/property/PropertyCard";
import StyledSelect from "@/components/ui/StyledSelect";
import { SlidersHorizontal, MapPin, Building2, Tag, ArrowUpDown, Search, MapPinned } from "lucide-react";
import type { Property } from "@/types/property";
import {
  fetchNeighborhoodsForSelect,
  fetchPropertyTypesForSelect,
  fetchPublicProperties,
  fetchCitiesForSelect,
} from "@/lib/osorioRepository";
import { priceToComparablePyg, type PriceCurrency } from "@/lib/currency";

type SortKey = 'quotes' | 'price_asc' | 'price_desc' | 'newest';

export default function Properties() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [ciudad, setCiudad] = useState(searchParams.get("ciudad") || "");
  const [barrio, setBarrio] = useState(searchParams.get("barrio") || "");
  const [tipo, setTipo] = useState(searchParams.get("tipo") || "");
  const [operacion, setOperacion] = useState(searchParams.get("operacion") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<SortKey>('quotes');
  const [showFilters, setShowFilters] = useState(true);

  const [properties, setProperties] = useState<Property[]>([]);
  const [ciudades, setCiudades] = useState<Array<{ id: string; name: string }>>([]);
  const [barrios, setBarrios] = useState<Array<{ id: string; name: string; ciudad_id?: string | null }>>([]);
  const [tipos, setTipos] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [props, b, pt, c] = await Promise.all([
        fetchPublicProperties(),
        fetchNeighborhoodsForSelect(),
        fetchPropertyTypesForSelect(),
        fetchCitiesForSelect(),
      ]);
      if (!active) return;
      setProperties(props);
      setBarrios(b);
      setTipos(pt);
      setCiudades(c);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const barriosFiltrados = useMemo(() => {
    if (!ciudad) return barrios;
    const cid = ciudades.find((c) => c.name === ciudad)?.id;
    if (!cid) return barrios;
    return barrios.filter((b) => b.ciudad_id === cid);
  }, [barrios, ciudad, ciudades]);

  const filtered = useMemo(() => {
    let list = [...properties];
    if (ciudad.trim()) {
      const cnorm = ciudad.trim().toLowerCase();
      list = list.filter((p) => (p.ciudad || "").trim().toLowerCase() === cnorm);
    }
    if (barrio) list = list.filter((p) => p.barrio === barrio);
    if (tipo) list = list.filter((p) => p.tipo === tipo);
    if (operacion) list = list.filter((p) => p.operacion === operacion);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.barrio.toLowerCase().includes(q) ||
          (p.ciudad && p.ciudad.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "quotes":
        list.sort((a, b) => b.quote_count - a.quote_count);
        break;
      case "price_asc":
        list.sort((a, b) =>
          priceToComparablePyg(a.price, (a.price_currency ?? "PYG") as PriceCurrency) -
          priceToComparablePyg(b.price, (b.price_currency ?? "PYG") as PriceCurrency));
        break;
      case "price_desc":
        list.sort((a, b) =>
          priceToComparablePyg(b.price, (b.price_currency ?? "PYG") as PriceCurrency) -
          priceToComparablePyg(a.price, (a.price_currency ?? "PYG") as PriceCurrency));
        break;
      case "newest":
        list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
        break;
    }
    return list;
  }, [properties, ciudad, barrio, tipo, operacion, query, sort]);

  return (
    <Layout>
      <section className="bg-primary py-16 md:py-20">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground">{t('properties.title')}</h1>
          <p className="text-primary-foreground/40 text-sm font-sans mt-2">{t('hero.subtitle')}</p>
        </div>
      </section>

      <div className="py-8 md:py-12">
        <div className="container">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mb-5 flex items-center gap-2 text-sm font-semibold font-sans text-accent hover:text-accent/80 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('properties.filters')}
          </button>

          {showFilters && (
            <div className="animate-reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8 p-4 rounded-xl bg-card border border-border">
              {ciudades.length > 0 && (
                <StyledSelect icon={MapPinned} value={ciudad} onChange={(e) => { setCiudad(e.target.value); setBarrio(""); }}>
                  <option value="">{t('hero.search.all_ciudades')}</option>
                  {ciudades.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                </StyledSelect>
              )}
              <StyledSelect icon={MapPin} value={barrio} onChange={e => setBarrio(e.target.value)}>
                <option value="">{t('hero.search.all_barrios')}</option>
                {barriosFiltrados.map((b) => (<option key={b.id} value={b.name}>{b.name}</option>))}
              </StyledSelect>
              <StyledSelect icon={Building2} value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="">{t('hero.search.all_tipos')}</option>
                {tipos.map((tp) => (<option key={tp.id} value={tp.name}>{tp.name}</option>))}
              </StyledSelect>
              <StyledSelect icon={Tag} value={operacion} onChange={e => setOperacion(e.target.value)}>
                <option value="">{t('hero.search.all_ops')}</option>
                {(["venta", "alquiler"] as const).map((op) => (
                  <option key={op} value={op}>{t(`op.${op}`)}</option>
                ))}
              </StyledSelect>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={t('hero.search.texto')} className="input-premium pl-9" />
              </div>
              <StyledSelect icon={ArrowUpDown} value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                <option value="quotes">{t('properties.sort.quotes')}</option>
                <option value="price_asc">{t('properties.sort.price_asc')}</option>
                <option value="price_desc">{t('properties.sort.price_desc')}</option>
                <option value="newest">{t('properties.sort.newest')}</option>
              </StyledSelect>
            </div>
          )}

          {!loading && (
            <p className="text-xs text-muted-foreground font-sans mb-5">{filtered.length} propiedades</p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground font-sans">{t('properties.no_results')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
