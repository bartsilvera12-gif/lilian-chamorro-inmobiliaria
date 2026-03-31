import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="text-center animate-reveal">
        <p className="text-7xl font-serif font-bold text-accent mb-3">404</p>
        <p className="text-lg text-primary-foreground/60 mb-6 font-sans">{t('notfound.message')}</p>
        <a href="/" className="btn-gold inline-flex">
          <Home className="w-4 h-4" /> {t('notfound.back_home')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
