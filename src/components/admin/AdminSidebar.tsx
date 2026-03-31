import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, MessageSquare, MapPin, LogOut, X, Tag, Trophy, Star, Construction } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin/dashboard', labelKey: 'admin.nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/properties', labelKey: 'admin.nav.properties', icon: Building2 },
  { to: '/admin/quotes', labelKey: 'admin.nav.quotes', icon: MessageSquare },
  { to: '/admin/success-cases', labelKey: 'admin.nav.success_cases', icon: Trophy },
  { to: '/admin/testimonials', labelKey: 'admin.nav.testimonials', icon: Star },
  { to: '/admin/developments', labelKey: 'admin.nav.developments', icon: Construction },
  { to: '/admin/neighborhoods', labelKey: 'admin.nav.neighborhoods', icon: MapPin },
  { to: '/admin/property-types', labelKey: 'admin.nav.property_types', icon: Tag },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border shrink-0">
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">Admin Panel</span>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent">
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.to || 
              (item.to === '/admin/properties' && location.pathname.startsWith('/admin/properties'));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.97]"
          >
            <LogOut className="w-4.5 h-4.5" />
            {t('admin.sign_out')}
          </button>
        </div>
      </aside>
    </>
  );
}
