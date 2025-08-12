
import { useEffect, useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import UploadExtrato from '@/components/upload/UploadExtrato';
import UploadFinanceiro from '@/components/financial/UploadFinanceiro';
import Categorization from '@/components/categorization/Categorization';
import RelatoriosFinanceiros from '@/components/financial/RelatoriosFinanceiros';
import Settings from '@/components/settings/Settings';
import Reports from '@/components/reports/Reports';
import CustomReports from '@/components/custom-reports/CustomReports';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user } = useAuth();

  const handlePageChange = (page: string) => {
    if (user?.role === 'cooperado' && page !== 'custom-reports') {
      setCurrentPage('custom-reports');
      return;
    }
    setCurrentPage(page);
  };

  useEffect(() => {
    if (user?.role === 'cooperado') {
      setCurrentPage('custom-reports');
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
      case 'custom-reports':
        return <CustomReports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <main className="lg:ml-64 p-6">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
