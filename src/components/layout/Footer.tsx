import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, MapPin, ArrowUpRight, Briefcase, Send } from 'lucide-react';
import { scrollToHashElement } from '@/lib/hashScroll';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Footer() {
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [workForm, setWorkForm] = useState({
    nombre: '',
    edad: '',
    sexo: '',
    mensaje: '',
  });

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

  const workTitle = useMemo(() => {
    if (lang === 'en') return 'Do you want to work with us?';
    if (lang === 'pt') return 'Quer trabalhar conosco?';
    return '¿Quieres trabajar con nosotros?';
  }, [lang]);

  const handleWorkInput =
    (key: 'nombre' | 'edad' | 'sexo' | 'mensaje') =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setWorkForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleWorkSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = 'Postulación - Trabajar con nosotros';
    const body = [
      `Nombre Completo: ${workForm.nombre || '-'}`,
      `Edad: ${workForm.edad || '-'}`,
      `Sexo: ${workForm.sexo || '-'}`,
      '',
      'Mensaje:',
      workForm.mensaje || '-',
    ].join('\n');
    window.location.href = `mailto:inmuebles.jo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setWorkDialogOpen(false);
  };

  return (
    <footer id="contacto" className="bg-primary text-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/10 rounded-full translate-x-1/3 translate-y-1/3 blur-[80px]" />

      <div className="container relative py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <img
                src="https://res.cloudinary.com/drupicep5/image/upload/v1774017672/ed6b5ff7-d534-43df-aa24-644df4072734.png"
                alt="OSORIO Inmobiliaria EAS"
                className="h-14 sm:h-16 w-auto object-contain"
              />
              <div>
                <span className="font-bold text-2xl sm:text-3xl leading-none text-white">OSORIO</span>
                <span className="block text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-white/50 mt-1">Inmobiliaria EAS</span>
              </div>
            </div>
            <p className="text-sm text-white/45 max-w-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-xs mb-5 uppercase tracking-[0.2em] text-white/40">{t('footer.links')}</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/propiedades', label: t('nav.properties') },
                { to: '/desarrollo', label: t('nav.developments') },
                { to: '/#calculadora', label: t('nav.calculator') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={e => handleFooterLink(e, link.to)}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-xs mb-5 uppercase tracking-[0.2em] text-white/40">{t('footer.company')}</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.me/595987276000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  <Phone className="w-4 h-4 text-white/55 shrink-0" aria-hidden />
                  +595 987 276 000
                </a>
              </li>
              <li className="inline-flex items-center gap-2.5 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-white/55 shrink-0" aria-hidden />
                {t('footer.location')}
              </li>
              <li>
                <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="w-full text-left inline-flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-white/55 shrink-0" aria-hidden />
                      {workTitle}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{workTitle}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleWorkSubmit} className="space-y-3">
                      <input
                        value={workForm.nombre}
                        onChange={handleWorkInput('nombre')}
                        placeholder="Nombre Completo"
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={workForm.edad}
                          onChange={handleWorkInput('edad')}
                          placeholder="Edad"
                          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                        <select
                          value={workForm.sexo}
                          onChange={handleWorkInput('sexo')}
                          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        >
                          <option value="">Sexo</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <textarea
                        value={workForm.mensaje}
                        onChange={handleWorkInput('mensaje')}
                        placeholder="Mensaje"
                        rows={4}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Enviar
                      </button>
                    </form>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.08] text-center text-xs text-white/30">
          © {new Date().getFullYear()} OSORIO INMOBILIARIA EAS — {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
