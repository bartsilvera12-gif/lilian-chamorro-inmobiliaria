import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, Home, Building2, Phone, Construction } from 'lucide-react';
import { Language } from '@/i18n/translations';
import { scrollToHashElement } from '@/lib/hashScroll';
import logoLC from '@/assets/logo-lc.png';
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
    { to: '/#contacto', label: t('nav.contact'), icon: Phone },
  ];

  const isActive = (to: string) => {
    if (to.startsWith('/#')) {
      const h = '#' + to.split('#')[1];
      return location.pathname === '/' && location.hash === h;
    }
    if (to === '/') return location.pathname === '/' && !location.hash;
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary backdrop-blur-md border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoLC} alt="Lilian Chamorro" className="h-16 w-auto object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={e => handleNavClick(e, link.to)}
              className={`px-3.5 py-2 text-[13px] font-medium font-sans tracking-wide transition-colors duration-200 ${
                isActive(link.to) ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="block h-0.5 bg-accent rounded-full mt-0.5" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center border border-primary-foreground/20 rounded-md overflow-hidden">
            {(['es', 'en', 'pt'] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-[10px] font-semibold font-sans uppercase tracking-wider transition-colors ${
                  lang === l ? 'bg-accent text-primary' : 'text-primary-foreground/50 hover:text-primary-foreground'
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <button
            className="md:hidden p-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-primary border-t border-white/10 pb-3">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={e => { handleNavClick(e, link.to); setOpen(false); }}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium font-sans transition-colors ${
                isActive(link.to) ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-0 mx-6 mt-2 border border-primary-foreground/20 rounded-md overflow-hidden w-fit">
            {(['es', 'en', 'pt'] as Language[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-[10px] font-semibold font-sans uppercase tracking-wider transition-colors ${lang === l ? 'bg-accent text-primary' : 'text-primary-foreground/50 hover:text-primary-foreground'}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
