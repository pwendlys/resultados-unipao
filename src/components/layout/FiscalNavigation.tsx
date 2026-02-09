import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield,
  FileCheck,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface FiscalNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const FiscalNavigation = ({ 
  currentPage, 
  onPageChange, 
  isSidebarCollapsed, 
  onToggleSidebar 
}: FiscalNavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const menuItems = [
    { id: 'fiscal-dashboard', label: 'Painel Fiscal', icon: Home },
    { id: 'fiscal-reports', label: 'Relatórios para Revisão', icon: FileCheck },
  ];

  const handleLogout = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
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
        {/* Logo - Fixed at top */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">Área Fiscal</h1>
              <p className="text-sm text-muted-foreground">Sistema de Revisão</p>
            </div>
          </div>
        </div>

        {/* Menu Items with ScrollArea */}
        <div className="flex-1 overflow-hidden px-6">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2 pb-4">
              {menuItems.map((item) => {
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
          </ScrollArea>
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

export default FiscalNavigation;
