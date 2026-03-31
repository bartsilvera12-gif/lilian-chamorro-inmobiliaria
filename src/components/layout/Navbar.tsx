import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, Home, Building2, Calculator, Phone, Construction } from 'lucide-react';
import { Language } from '@/i18n/translations';
import { scrollToHashElement } from '@/lib/hashScroll';

const LANG_LABELS: Record<Language, string> = { es: 'ES', en: 'EN', pt: 'PT' };

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/propiedades', label: t('nav.properties'), icon: Building2 },
    { to: '/desarrollo', label: t('nav.developments'), icon: Construction },
    { to: '/#calculadora', label: t('nav.calculator'), icon: Calculator },
    { to: '/#contacto', label: t('nav.contact'), icon: Phone },
  ];

  const isActive = (to: string) => {
    if (to.startsWith('/#')) {
      const h = '#' + to.split('#')[1];
      return location.pathname === '/' && location.hash === h;
    }
    if (to === '/') {
      return location.pathname === '/' && !location.hash;
    }
    return location.pathname === to;
  };

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (to.includes('#')) {
      e.preventDefault();
      const hash = to.split('#')[1];
      if (location.pathname === '/') {
        navigate({ pathname: '/', hash: `#${hash}` }, { replace: true });
        setTimeout(() => scrollToHashElement(hash), 50);
      } else {
        navigate({ pathname: '/', hash: `#${hash}` });
        setTimeout(() => scrollToHashElement(hash), 300);
      }
      setOpen(false);
    }
  }, [location.pathname, navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="https://res.cloudinary.com/drupicep5/image/upload/v1774017496/b4ca9fde-39bd-47b1-9d49-f27f3a997c28.png"
            alt="OSORIO Inmobiliaria EAS"
            className="h-8 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <span className="font-extrabold text-base leading-none tracking-tight text-foreground">OSORIO</span>
            <span className="block text-[9px] font-medium tracking-[0.2em] text-muted-foreground uppercase">Inmobiliaria EAS</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={e => handleNavClick(e, link.to)}
              className={`relative px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                isActive(link.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute inset-x-1 -bottom-[17px] h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Language + mobile toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            {(['es', 'en', 'pt'] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors duration-150 ${
                  lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-white pb-4">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={e => { handleNavClick(e, link.to); setOpen(false); }}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive(link.to) ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-muted'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
