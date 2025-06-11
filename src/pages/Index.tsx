
import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import UploadExtrato from '@/components/upload/UploadExtrato';
import Categorization from '@/components/categorization/Categorization';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadExtrato />;
      case 'categorization':
        return <Categorization />;
      case 'reports':
        return <div className="p-8 text-center text-muted-foreground">Página de Relatórios DRE em desenvolvimento</div>;
      case 'settings':
        return <div className="p-8 text-center text-muted-foreground">Página de Configurações em desenvolvimento</div>;
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
