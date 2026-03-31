import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const { t } = useLanguage();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (profile?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    if (user && profile?.role !== 'admin') {
      setError('Tu usuario inició sesión, pero no tiene rol admin en profiles.');
    }
  }, [authLoading, navigate, profile, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await signIn(email, password);

    if (loginError) {
      setError(loginError);
      setLoading(false);
    } else {
      // Auth state change disparará carga de perfil y redirección si corresponde.
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-border animate-reveal">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground text-center mb-6">{t('nav.admin')}</h1>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t('quote.email')}
              disabled={loading}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              disabled={loading}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
