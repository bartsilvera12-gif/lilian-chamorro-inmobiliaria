import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { profile } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
          {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  );
}
