import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  X, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Shield,
  FileCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface TreasurerNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const TreasurerNavigation = ({ 
  currentPage, 
  onPageChange, 
  isSidebarCollapsed,
  onToggleSidebar 
}: TreasurerNavigationProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || null);
    });
  }, []);

  const menuItems = [
    { id: 'tesoureiro-dashboard', label: 'Painel Tesoureiro', icon: Home },
    { id: 'tesoureiro-fiscal', label: 'Área Fiscal', icon: Shield },
  ];

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate('/fiscal/login');
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsMobileOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <FileCheck className="h-6 w-6 text-amber-600" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate">Tesouraria</h1>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isSidebarCollapsed && "justify-center px-2",
                currentPage === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-muted"
              )}
              onClick={() => handlePageChange(item.id)}
            >
              <item.icon className={cn(
                "h-5 w-5",
                currentPage !== item.id && "text-amber-600"
              )} />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            isSidebarCollapsed && "justify-center px-2"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isSidebarCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <NavContent />
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm"
          onClick={onToggleSidebar}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <FileCheck className="h-5 w-5 text-amber-600" />
          </div>
          <span className="font-bold">Tesouraria</span>
        </div>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default TreasurerNavigation;
