
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
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const handlePageChange = (page: string) => {
    if (user?.role === 'cooperado' && page !== 'custom-reports' && page !== 'resultados-unipao') {
      setCurrentPage('resultados-unipao');
      return;
    }
    setCurrentPage(page);
  };

  useEffect(() => {
    if (user?.role === 'cooperado') {
      setCurrentPage('resultados-unipao');
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
      case 'settings':
        return <Settings />;
      default:
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
