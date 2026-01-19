
import { useEffect, useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import UploadExtrato from '@/components/upload/UploadExtrato';
import UploadFinanceiro from '@/components/financial/UploadFinanceiro';
import Categorization from '@/components/categorization/Categorization';
import RelatoriosFinanceiros from '@/components/financial/RelatoriosFinanceiros';
import StockBalance from '@/components/stock-balance/StockBalance';
import AssetsLiabilities from '@/components/assets-liabilities/AssetsLiabilities';
import Settings from '@/components/settings/Settings';
import Reports from '@/components/reports/Reports';
import CustomReports from '@/components/custom-reports/CustomReports';
import SendReports from '@/components/send-reports/SendReports';
import CustomDashboards from '@/components/custom-dashboards/CustomDashboards';
import ResultadosUnipao from '@/components/cooperado/ResultadosUnipao';
import TreasurerDashboard from '@/components/treasurer/TreasurerDashboard';
import TreasurerFiscalArea from '@/components/treasurer/TreasurerFiscalArea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Allowlist de emails autorizados para acesso à área de tesouraria
const TREASURY_ALLOWED_EMAILS = ['arthur@tesoureiro.com', 'adm@adm.com'];

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Verifica se o usuário tem acesso à área de tesouraria
  const canAccessTreasury = TREASURY_ALLOWED_EMAILS.includes(user?.email?.toLowerCase() ?? '');

  const handlePageChange = (page: string) => {
    // Cooperado restrictions
    if (user?.role === 'cooperado' && page !== 'custom-reports' && page !== 'resultados-unipao') {
      setCurrentPage('resultados-unipao');
      return;
    }
    // Tesoureiro restrictions - can only access tesoureiro pages
    if (user?.role === 'tesoureiro' && !page.startsWith('tesoureiro')) {
      setCurrentPage('tesoureiro-dashboard');
      return;
    }
    // Treasury access guard - check allowlist for tesoureiro pages
    if (page.startsWith('tesoureiro') && !canAccessTreasury && user?.role !== 'tesoureiro') {
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(page);
  };

  useEffect(() => {
    if (user?.role === 'cooperado') {
      setCurrentPage('resultados-unipao');
    }
    if (user?.role === 'tesoureiro') {
      setCurrentPage('tesoureiro-dashboard');
    }
  }, [user]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadExtrato onNavigateToPage={setCurrentPage} />;
      case 'upload-financeiro':
        return <UploadFinanceiro onNavigateToPage={setCurrentPage} />;
      case 'categorization':
        return <Categorization />;
      case 'reports':
        return <Reports />;
      case 'relatorios-financeiros':
        return <RelatoriosFinanceiros />;
      case 'stock-balance':
        return <StockBalance />;
      case 'assets-liabilities':
        return <AssetsLiabilities />;
      case 'custom-reports':
        return <CustomReports />;
      case 'send-reports':
        return <SendReports />;
      case 'custom-dashboards':
        return <CustomDashboards />;
      case 'resultados-unipao':
        return <ResultadosUnipao />;
      case 'tesoureiro-dashboard':
        return <TreasurerDashboard />;
      case 'tesoureiro-fiscal':
        return <TreasurerFiscalArea onNavigateToPage={setCurrentPage} />;
      case 'settings':
        return <Settings />;
      default:
        // Tesoureiro defaults to their dashboard
        if (user?.role === 'tesoureiro') {
          return <TreasurerDashboard />;
        }
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={handlePageChange}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}>
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
