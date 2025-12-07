import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Receipt, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import logoIcon from '@/assets/logo-icon.png';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Inicio', path: '/', icon: Home },
  { label: 'Operaciones', path: '/operations', icon: Receipt },
  { label: 'Arqueo', path: '/cash-register', icon: Landmark },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-hero)' }}>
      {/* Elegant Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img src={logoIcon} alt="Al Toque!" className="h-12 w-12 object-contain drop-shadow-md" />
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Al Toque!
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Préstamos Personales</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "gap-2 transition-all",
                    location.pathname === item.path && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-300"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
