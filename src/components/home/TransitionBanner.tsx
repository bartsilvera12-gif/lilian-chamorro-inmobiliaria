import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, MapPin, Shield } from 'lucide-react';
import { fetchTransitionStats } from '@/lib/osorioRepository';

export default function TransitionBanner() {
  const { t } = useLanguage();
  const [quotesCount, setQuotesCount] = useState<number>(0);
  const [barriosCount, setBarriosCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const stats = await fetchTransitionStats();
      if (!active) return;
      setQuotesCount(stats.quotesCount);
      setBarriosCount(stats.barriosCount);
    })();
    return () => { active = false; };
  }, []);

  const stats = [
    { icon: TrendingUp, value: quotesCount > 0 ? `+${quotesCount}` : '0', label: t('banner.quotes_done') },
    { icon: MapPin, value: `${barriosCount}`, label: t('banner.coverage_asuncion') },
    { icon: Shield, value: t('banner.free'), label: t('banner.instant_estimate') },
  ];

  return (
    <section className="py-16">
      <div className="container">
        <div className="bg-primary rounded-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <div key={i} className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${i}` : ''} flex items-center gap-4 ${i > 0 ? 'md:border-l md:border-primary-foreground/10 md:pl-8' : ''}`}>
                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-primary-foreground">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/50 font-sans mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
