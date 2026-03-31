import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, MapPin, Building2, Tag } from 'lucide-react';
import StyledSelect from '@/components/ui/StyledSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchNeighborhoodsForSelect, fetchPropertyTypesForSelect } from "@/lib/osorioRepository";

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
    return () => {
      active = false;
    };
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
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://res.cloudinary.com/drupicep5/image/upload/v1774017752/c806c95d-c8a8-452b-b894-cb59d97eb412.png)` }}
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative container text-center py-28 md:py-36">
        <div className="max-w-2xl mx-auto animate-reveal">
          <h1 className="text-3xl md:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.1] text-white mb-4 tracking-tight">
            {t('hero.title')}
          </h1>
          <p className="text-base md:text-lg text-white/75 mb-10 max-w-lg mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSearch} className="animate-reveal animate-reveal-delay-1 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-3 shadow-2xl flex flex-col md:flex-row gap-3">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none z-10" />
                <Select value={barrioId} onValueChange={setBarrioId}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 pl-10 pr-10 text-sm">
                    <SelectValue placeholder={t('hero.search.all_barrios')} />
                  </SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false} className="max-h-72">
                    {barrios.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <StyledSelect
                icon={Building2}
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
                className="bg-secondary border-0"
              >
                <option value="">{t('hero.search.all_tipos')}</option>
                {tipos.map((tp) => (
                  <option key={tp.id} value={tp.name}>
                    {tp.name}
                  </option>
                ))}
              </StyledSelect>

              <StyledSelect icon={Tag} value={operacion} onChange={e => setOperacion(e.target.value)} className="bg-secondary border-0">
                <option value="">{t('hero.search.all_ops')}</option>
                {(['venta', 'alquiler'] as const).map((op) => (
                  <option key={op} value={op}>
                    {t(`op.${op}`)}
                  </option>
                ))}
              </StyledSelect>

              <input
                type="text" placeholder={t('hero.search.texto')} value={texto} onChange={e => setTexto(e.target.value)}
                className="w-full h-12 rounded-xl bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <button type="submit" className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all duration-150 flex-shrink-0">
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">{t('hero.search.btn')}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
