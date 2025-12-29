import { useState } from 'react';
import FiscalNavigation from '@/components/layout/FiscalNavigation';
import FiscalDashboard from '@/components/fiscal/FiscalDashboard';
import FiscalReportsList from '@/components/fiscal/FiscalReportsList';
import FiscalReviewPanel from '@/components/fiscal/FiscalReviewPanel';

const FiscalIndex = () => {
  const [currentPage, setCurrentPage] = useState('fiscal-dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    // Verificar se é uma navegação para revisão específica
    if (page.startsWith('fiscal-review/')) {
      const reportId = page.replace('fiscal-review/', '');
      setSelectedReportId(reportId);
      setCurrentPage('fiscal-review');
    } else {
      setSelectedReportId(null);
      setCurrentPage(page);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'fiscal-dashboard':
        return <FiscalDashboard onNavigateToPage={handlePageChange} />;
      case 'fiscal-reports':
        return <FiscalReportsList onNavigateToPage={handlePageChange} />;
      case 'fiscal-review':
        return selectedReportId ? (
          <FiscalReviewPanel 
            reportId={selectedReportId} 
            onNavigateToPage={handlePageChange} 
          />
        ) : (
          <FiscalReportsList onNavigateToPage={handlePageChange} />
        );
      default:
        return <FiscalDashboard onNavigateToPage={handlePageChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FiscalNavigation
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

export default FiscalIndex;
