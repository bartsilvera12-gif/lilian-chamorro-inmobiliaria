import { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, MapPin, Building2, Tag, MapPinned } from 'lucide-react';
import StyledSelect from '@/components/ui/StyledSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  fetchNeighborhoodsForSelect,
  fetchPropertyTypesForSelect,
  fetchCitiesForSelect,
  type NeighborhoodSelectOption,
} from "@/lib/osorioRepository";
import { cn } from '@/lib/utils';
import heroBg from '@/assets/hero-bg.jpg';

/** Controles del hero: una línea, alineados, mismo alto */
const heroFieldClass =
  'h-12 w-full rounded-xl border border-border/40 bg-muted/35 pl-10 pr-10 text-sm font-sans text-foreground shadow-none transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-0';

const heroSelectValueClass =
  '[&>span]:block [&>span]:truncate [&>span]:whitespace-nowrap [&>span]:text-left [&>span]:leading-none';

export default function HeroSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [ciudadId, setCiudadId] = useState('');
  const [barrioId, setBarrioId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [operacion, setOperacion] = useState('');
  const [texto, setTexto] = useState('');
  const [barrios, setBarrios] = useState<NeighborhoodSelectOption[]>([]);
  const [ciudades, setCiudades] = useState<Array<{ id: string; name: string }>>([]);
  const [tipos, setTipos] = useState<Array<{ id: string; name: string }>>([]);

  const showCiudad = ciudades.length > 0;

  useEffect(() => {
    let active = true;
    (async () => {
      const [b, pt, c] = await Promise.all([
        fetchNeighborhoodsForSelect(),
        fetchPropertyTypesForSelect(),
        fetchCitiesForSelect(),
      ]);
      if (!active) return;
      setBarrios(b);
      setTipos(pt);
      setCiudades(c);
    })();
    return () => { active = false; };
  }, []);

  const barriosFiltrados = useMemo(() => {
    if (!ciudadId) return barrios;
    return barrios.filter((b) => b.ciudad_id === ciudadId);
  }, [barrios, ciudadId]);

  useEffect(() => {
    const ok = barriosFiltrados.some((b) => b.name === barrioId);
    if (barrioId && !ok) setBarrioId('');
  }, [barriosFiltrados, barrioId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ciudadId) {
      const c = ciudades.find((x) => x.id === ciudadId);
      if (c) params.set('ciudad', c.name);
    }
    if (barrioId) params.set('barrio', barrioId);
    if (tipoId) params.set('tipo', tipoId);
    if (operacion) params.set('operacion', operacion);
    if (texto) params.set('q', texto);
    navigate(`/propiedades?${params.toString()}`);
  };

  /** xl: 12 cols — 6 ítems × 2 = 12; sin ciudad: 2+2+2+4+2 = 12 */
  const cell = 'min-w-0 xl:col-span-2';
  const cellText = showCiudad ? cell : 'min-w-0 xl:col-span-4';
  const cellBtn = 'min-w-0 xl:col-span-2 flex';

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-foreground/70" />
      </div>

      <div className="relative container py-28 md:py-36">
        <div className="max-w-3xl mx-auto text-center animate-reveal">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.08] text-white mb-5">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-white/60 mb-12 max-w-xl mx-auto font-sans font-light leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="animate-reveal animate-reveal-delay-2 max-w-[1100px] xl:max-w-[1200px] mx-auto w-full px-1">
          <form
            onSubmit={handleSearch}
            className={cn(
              'grid gap-3 rounded-2xl border border-white/25 bg-white/95 p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.2)] backdrop-blur-md',
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12',
            )}
          >
            {showCiudad && (
              <div className={cn('relative', cell)}>
                <MapPinned className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Select value={ciudadId} onValueChange={setCiudadId}>
                  <SelectTrigger className={cn(heroFieldClass, heroSelectValueClass, 'items-center')}>
                    <SelectValue placeholder={t('hero.search.all_ciudades')} />
                  </SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false} className="max-h-72 rounded-xl">
                    {ciudades.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={cn('relative', cell)}>
              <MapPin className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Select value={barrioId} onValueChange={setBarrioId}>
                <SelectTrigger className={cn(heroFieldClass, heroSelectValueClass, 'items-center')}>
                  <SelectValue placeholder={t('hero.search.all_barrios')} />
                </SelectTrigger>
                <SelectContent side="bottom" avoidCollisions={false} className="max-h-72 rounded-xl">
                  {barriosFiltrados.map((b) => (
                    <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cell}>
              <StyledSelect
                icon={Building2}
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
                className={cn(heroFieldClass, heroSelectValueClass, 'items-center')}
              >
                <option value="">{t('hero.search.all_tipos')}</option>
                {tipos.map((tp) => (
                  <option key={tp.id} value={tp.name}>{tp.name}</option>
                ))}
              </StyledSelect>
            </div>

            <div className={cell}>
              <StyledSelect
                icon={Tag}
                value={operacion}
                onChange={(e) => setOperacion(e.target.value)}
                className={cn(heroFieldClass, heroSelectValueClass, 'items-center')}
              >
                <option value="">{t('hero.search.all_ops')}</option>
                {(['venta', 'alquiler'] as const).map((op) => (
                  <option key={op} value={op}>{t(`op.${op}`)}</option>
                ))}
              </StyledSelect>
            </div>

            <div className={cn('relative', cellText)}>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={t('hero.search.texto')}
                className={cn(
                  heroFieldClass,
                  'pl-4 pr-4 placeholder:text-muted-foreground/80',
                )}
              />
            </div>

            <div className={cellBtn}>
              <button
                type="submit"
                className={cn(
                  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5',
                  'bg-gradient-to-b from-amber-500 to-amber-600 text-sm font-medium text-white',
                  'shadow-sm shadow-amber-900/10 ring-1 ring-amber-400/40',
                  'transition hover:brightness-[1.03] hover:shadow-md active:scale-[0.99]',
                )}
              >
                <Search className="h-4 w-4 shrink-0 opacity-95" />
                {t('hero.search.btn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
