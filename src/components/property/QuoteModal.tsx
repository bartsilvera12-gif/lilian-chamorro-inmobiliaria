import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, MessageSquare, CheckCircle } from 'lucide-react';
import { insertQuote } from '@/lib/osorioRepository';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyId: string;
}

export default function QuoteModal({ isOpen, onClose, propertyTitle, propertyId }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      setSent(true);
      const err = await insertQuote({
        property_id: propertyId,
        nombre: name,
        telefono: phone,
        email,
        mensaje: message || undefined,
      });
      if (err) {
        setSent(false);
        toast.error(t('quote.send') + ': ' + err.message);
        return;
      }
      toast.success(t('quote.success'));
      setTimeout(() => {
        setSent(false);
        onClose();
        setName(''); setPhone(''); setEmail(''); setMessage('');
      }, 800);
    })();
  };

  const whatsappUrl = `https://wa.me/595986965042?text=${encodeURIComponent(`Hola, me interesa la propiedad: ${propertyTitle}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-premium animate-reveal">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif font-bold text-lg text-foreground mb-1">{t('quote.title')}</h3>
        <p className="text-sm text-muted-foreground mb-5 font-sans">{propertyTitle}</p>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <p className="font-semibold text-foreground font-sans">{t('quote.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t('quote.name')} className="input-premium" />
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('quote.phone')} className="input-premium" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('quote.email')} className="input-premium" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t('quote.message')} rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none" />
            <button type="submit" className="w-full btn-gold">{t('quote.send')}</button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full btn-outline">
              <MessageSquare className="w-4 h-4" /> {t('quote.whatsapp')}
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
