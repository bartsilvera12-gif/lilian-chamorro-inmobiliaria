import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, ArrowRight, TrendingUp, MapPin, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import StyledSelect from "@/components/ui/StyledSelect";
import { fetchCalculatorInputs, insertCalculatorLog } from "@/lib/osorioRepository";
import { formatUsd } from "@/lib/currency";
import { toast } from "sonner";

export default function CalculatorSection() {
  const { t } = useLanguage();
  const [barrioId, setBarrioId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [area, setArea] = useState("");
  const [tipoCalle, setTipoCalle] = useState<"asfalto" | "empedrado" | "tierra">("asfalto");
  const [cercaArroyo, setCercaArroyo] = useState(false);
  const [urgencia, setUrgencia] = useState<"apurado" | "no_apurado">("no_apurado");
  const [barrios, setBarrios] = useState<Array<{ id: string; nombre: string; coeficiente: number }>>([]);
  const [tipos, setTipos] = useState<Array<{ id: string; nombre: string; coeficiente: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ estimated: number; min: number; max: number; vreal: number; plista: number } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const inputs = await fetchCalculatorInputs();
      if (!active) return;
      setBarrios(inputs.barrios);
      setTipos(inputs.types);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const selectedBarrio = useMemo(() => barrios.find((b) => b.id === barrioId) ?? null, [barrios, barrioId]);
  const selectedTipo = useMemo(() => tipos.find((t) => t.id === tipoId) ?? null, [tipos, tipoId]);
  const fmt = (n: number) => formatUsd(n, 0);
  const PRECIO_BASE_M2 = 500;
  const MARGEN = 1.40;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarrio) { toast.error(t('calc.error.select_barrio')); return; }
    if (!selectedTipo) { toast.error(t('calc.error.select_tipo')); return; }
    if (!area) { toast.error(t('calc.error.surface_required')); return; }
    const areaNum = parseFloat(area);
    if (!Number.isFinite(areaNum) || areaNum <= 0) { toast.error(t('calc.error.surface_invalid')); return; }
    const C_ciudad = selectedBarrio.coeficiente;
    const C_vial = tipoCalle === "asfalto" ? 1.2 : tipoCalle === "empedrado" ? 1.05 : 0.9;
    const C_arroyo = cercaArroyo ? 0.75 : 1.0;
    const C_tipo = selectedTipo.coeficiente;
    const C_urgencia = urgencia === "apurado" ? 0.92 : 0.95;
    const Vu = PRECIO_BASE_M2 * C_ciudad * C_vial * C_arroyo * C_tipo * C_urgencia;
    const Vreal = Vu * areaNum;
    const Plista = Vreal * MARGEN;
    setResult({ estimated: Vreal, min: Vreal, max: Plista, vreal: Vreal, plista: Plista });
    await insertCalculatorLog({ barrio_id: barrioId, tipo_propiedad_id: tipoId, superficie: areaNum, tipo_calle: tipoCalle, cerca_arroyo: cercaArroyo, urgencia: urgencia, resultado_precio: Vreal });
  };

  return (
    <section id="calculadora" className="py-20 md:py-28 surface-warm">
      <div className="container">
        <div className="text-center mb-12 max-w-xl mx-auto">
          <p className="section-label">{t('calc.title')}</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-3">{t('calc.title')}</h2>
          <p className="text-muted-foreground text-sm font-sans">{t('calc.subtitle')}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-premium">
            <form onSubmit={handleCalculate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-sans">{t('calc.barrio')}</label>
                  <StyledSelect icon={MapPin} value={barrioId} onChange={(e) => setBarrioId(e.target.value)} required>
                    <option value="">{t('hero.search.all_barrios')}</option>
                    {barrios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </StyledSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-sans">{t('calc.tipo')}</label>
                  <StyledSelect icon={Building2} value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                    <option value="">{t('hero.search.all_tipos')}</option>
                    {tipos.map((tp) => <option key={tp.id} value={tp.id}>{tp.nombre}</option>)}
                  </StyledSelect>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 font-sans">{t('calc.area')}</label>
                <div className="relative">
                  <input type="number" min="1" value={area} onChange={e => setArea(e.target.value)} required placeholder="150"
                    className="input-premium pr-12" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground font-sans">m²</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-sans">{t('calc.calle')}</label>
                  <div className="space-y-1.5">
                    {(["asfalto", "empedrado", "tierra"] as const).map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm text-foreground font-sans cursor-pointer">
                        <input type="radio" name="tipoCalle" value={v} checked={tipoCalle === v} onChange={() => setTipoCalle(v)} className="accent-accent" />
                        {v === "asfalto" ? t('calc.calle.asfalto') : v === "empedrado" ? t('calc.calle.empedrado') : t('calc.calle.tierra')}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-sans">{t('calc.cerca_arroyo')}</label>
                  <label className="flex items-center gap-2 text-sm text-foreground font-sans cursor-pointer">
                    <input type="checkbox" checked={cercaArroyo} onChange={(e) => setCercaArroyo(e.target.checked)} className="accent-accent" />
                    {t('calc.cerca_arroyo.si')}
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-sans">{t('calc.urgencia')}</label>
                  <StyledSelect value={urgencia} onChange={(e) => setUrgencia(e.target.value as "apurado" | "no_apurado")}>
                    <option value="apurado">{t('calc.urgencia.apurado')}</option>
                    <option value="no_apurado">{t('calc.urgencia.no_apurado')}</option>
                  </StyledSelect>
                </div>
              </div>

              <button type="submit" className="w-full btn-gold">
                <Calculator className="w-4 h-4" />{t('calc.calculate')}
              </button>
            </form>

            {result && (
              <div className="mt-6 rounded-xl bg-primary p-6 animate-reveal">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-1 font-sans">{t('calc.result')}</p>
                    <p className="text-3xl font-serif font-bold text-accent">{fmt(result.estimated)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg px-3 py-2 bg-primary-foreground/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/40 mb-0.5 font-sans">{t('calc.min')}</p>
                    <p className="text-sm font-bold text-primary-foreground font-sans">{fmt(result.min)}</p>
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-primary-foreground/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/40 mb-0.5 font-sans">{t('calc.max')}</p>
                    <p className="text-sm font-bold text-primary-foreground font-sans">{fmt(result.max)}</p>
                  </div>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden bg-primary-foreground/10 mb-4">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-500"
                    style={{ width: result.max === result.min ? "100%" : `${Math.round(((result.estimated - result.min) / (result.max - result.min)) * 100)}%` }} />
                </div>
                <Link to="/propiedades" className="text-sm font-semibold text-accent/80 hover:text-accent transition-colors font-sans flex items-center gap-1">
                  {t('calc.to_quote')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
