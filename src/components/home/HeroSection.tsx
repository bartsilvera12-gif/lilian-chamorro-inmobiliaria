import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, MapPin, Building2, Tag } from 'lucide-react';
import StyledSelect from '@/components/ui/StyledSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchNeighborhoodsForSelect, fetchPropertyTypesForSelect } from "@/lib/osorioRepository";
import heroBg from '@/assets/hero-bg.jpg';

export default function HeroSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [barrioId, setBarrioId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [operacion, setOperacion] = useState('');
  const [texto, setTexto] = useState('');
  const [barrios, setBarrios] = useState<Array<{ id: string; name: string }>>([]);
  const [tipos, setTipos] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [b, pt] = await Promise.all([fetchNeighborhoodsForSelect(), fetchPropertyTypesForSelect()]);
      if (!active) return;
      setBarrios(b);
      setTipos(pt);
    })();
    return () => { active = false; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (barrioId) params.set('barrio', barrioId);
    if (tipoId) params.set('tipo', tipoId);
    if (operacion) params.set('operacion', operacion);
    if (texto) params.set('q', texto);
    navigate(`/propiedades?${params.toString()}`);
  };

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

        {/* Search bar */}
        <div className="animate-reveal animate-reveal-delay-2 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-2 shadow-premium flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <Select value={barrioId} onValueChange={setBarrioId}>
                <SelectTrigger className="h-11 rounded-lg border-0 bg-muted/50 pl-9 text-sm font-sans">
                  <SelectValue placeholder={t('hero.search.all_barrios')} />
                </SelectTrigger>
                <SelectContent side="bottom" avoidCollisions={false} className="max-h-72">
                  {barrios.map((b) => (<SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <StyledSelect icon={Building2} value={tipoId} onChange={(e) => setTipoId(e.target.value)} className="border-0 bg-muted/50">
                <option value="">{t('hero.search.all_tipos')}</option>
                {tipos.map((tp) => (<option key={tp.id} value={tp.name}>{tp.name}</option>))}
              </StyledSelect>
            </div>

            <div className="flex-1">
              <StyledSelect icon={Tag} value={operacion} onChange={e => setOperacion(e.target.value)} className="border-0 bg-muted/50">
                <option value="">{t('hero.search.all_ops')}</option>
                {(['venta', 'alquiler'] as const).map((op) => (
                  <option key={op} value={op}>{t(`op.${op}`)}</option>
                ))}
              </StyledSelect>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={t('hero.search.texto')}
                className="h-11 w-full rounded-lg border-0 bg-muted/50 px-3 text-sm font-sans outline-none ring-0 placeholder:text-muted-foreground"
              />
            </div>

            <button type="submit" className="btn-gold shrink-0 rounded-lg">
              <Search className="w-4 h-4" />
              {t('hero.search.btn')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
