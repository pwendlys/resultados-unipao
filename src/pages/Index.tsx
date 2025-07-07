
import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import UploadExtrato from '@/components/upload/UploadExtrato';
import Categorization from '@/components/categorization/Categorization';
import Settings from '@/components/settings/Settings';
import Reports from '@/components/reports/Reports';
import CustomReports from '@/components/custom-reports/CustomReports';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadExtrato onNavigateToPage={setCurrentPage} />;
      case 'categorization':
        return <Categorization />;
      case 'reports':
        return <Reports />;
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
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="lg:ml-64 p-6">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
