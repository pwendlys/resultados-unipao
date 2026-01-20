import { useState, useEffect } from 'react';
import TreasurerNavigation from '@/components/layout/TreasurerNavigation';
import TreasurerDashboard from '@/components/treasurer/TreasurerDashboard';
import TreasurerFiscalArea from '@/components/treasurer/TreasurerFiscalArea';

const TreasurerIndex = () => {
  const [currentPage, setCurrentPage] = useState('tesoureiro-dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'tesoureiro-dashboard':
        return <TreasurerDashboard />;
      case 'tesoureiro-fiscal':
        return <TreasurerFiscalArea onNavigateToPage={setCurrentPage} />;
      default:
        return <TreasurerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TreasurerNavigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}>
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default TreasurerIndex;
