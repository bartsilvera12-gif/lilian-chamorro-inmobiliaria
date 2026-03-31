import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, MapPin } from 'lucide-react';
import { scrollToHashElement } from '@/lib/hashScroll';

export default function Footer() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleFooterLink = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (!to.includes('#')) return;
    e.preventDefault();
    const hash = to.split('#')[1];
    if (location.pathname === '/') {
      navigate({ pathname: '/', hash: `#${hash}` }, { replace: true });
      setTimeout(() => scrollToHashElement(hash), 50);
    } else {
      navigate({ pathname: '/', hash: `#${hash}` });
      setTimeout(() => scrollToHashElement(hash), 300);
    }
  };

  return (
    <footer id="contacto" className="bg-primary text-primary-foreground">
      <div className="container py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-12 items-start">
          <div className="flex flex-col">
            <h4 className="font-sans font-semibold text-xs mb-5 uppercase tracking-[0.15em] text-primary-foreground/30">
              {t('footer.about')}
            </h4>
            <p className="text-sm text-primary-foreground/40 max-w-xs leading-relaxed font-sans">{t('footer.tagline')}</p>
          </div>

          <div className="flex flex-col">
            <h4 className="font-sans font-semibold text-xs mb-5 uppercase tracking-[0.15em] text-primary-foreground/30">{t('footer.links')}</h4>
            <ul className="space-y-3">
              {[{ to: '/', label: t('nav.home') }, { to: '/propiedades', label: t('nav.properties') }, { to: '/desarrollo', label: t('nav.developments') }].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} onClick={e => handleFooterLink(e, link.to)} className="text-sm text-primary-foreground/50 hover:text-accent transition-colors font-sans">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col">
            <h4 className="font-sans font-semibold text-xs mb-5 uppercase tracking-[0.15em] text-primary-foreground/30">{t('footer.company')}</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://wa.me/595986965042" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-foreground/50 hover:text-accent transition-colors font-sans">
                  <Phone className="w-4 h-4 shrink-0" />+595 986 965 042
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/50 font-sans">
                <MapPin className="w-4 h-4 shrink-0" />{t('footer.location')}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 text-center text-xs text-primary-foreground/20 font-sans border-t border-primary-foreground/5">
          {t('footer.developed_by')}
        </div>
      </div>
    </footer>
  );
}
