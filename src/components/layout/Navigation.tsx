
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  FileText, 
  Upload, 
  Settings, 
  Home,
  Menu,
  X,
  Presentation,
  LogOut,
  DollarSign,
  TrendingUp,
  PieChart,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const Navigation = ({ currentPage, onPageChange, isSidebarCollapsed, onToggleSidebar }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload Extrato', icon: Upload },
    { id: 'upload-financeiro', label: 'Upload Financeiro', icon: DollarSign },
    { id: 'categorization', label: 'Categorização', icon: FileText },
    { id: 'reports', label: 'Relatórios Unipão', icon: BarChart3 },
    { id: 'relatorios-financeiros', label: 'Relatórios Financeiros', icon: TrendingUp },
    { id: 'stock-balance', label: 'Balanço de Estoque', icon: Package },
    { id: 'custom-reports', label: 'Relatórios Personalizados', icon: Presentation },
    { id: 'custom-dashboards', label: 'Dashboards Personalizados', icon: PieChart },
    { id: 'settings', label: 'Configurações e Compartilhar', icon: Settings },
  ];

  const itemsToShow = user?.role === 'cooperado'
    ? [{ id: 'custom-reports', label: 'Relatórios Personalizados', icon: Presentation }]
    : menuItems;

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Toggle Button */}
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSidebar}
        >
          {isSidebarCollapsed ? <Menu /> : <X />}
        </Button>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-300 flex flex-col",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isSidebarCollapsed && "lg:-translate-x-full"
      )}>
        <div className="p-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="/lovable-uploads/4e1b96ec-ca5a-4872-8cc9-696a989df4ad.png" 
              alt="Unipão Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-primary">Resultados Unipão</h1>
              <p className="text-sm text-muted-foreground">Sistema Financeiro</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {itemsToShow.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    currentPage === item.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair do Sistema
          </Button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
