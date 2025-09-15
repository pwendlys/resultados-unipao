import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3 } from 'lucide-react';
import DashboardSelector from './DashboardSelector';
import DataEntry from './DataEntry';
import ChartsView from './ChartsView';
import { useCustomDashboards } from '@/hooks/useCustomDashboards';
import { useCustomEntries } from '@/hooks/useCustomEntries';

const CustomDashboards = () => {
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  const [showDataEntry, setShowDataEntry] = useState(false);
  
  const { data: dashboards, isLoading: loadingDashboards } = useCustomDashboards();
  const { data: entries, isLoading: loadingEntries } = useCustomEntries(selectedDashboardId);

  if (loadingDashboards) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando dashboards...</div>
        </div>
      </div>
    );
  }

  const selectedDashboard = dashboards?.find(d => d.id === selectedDashboardId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Dashboards Personalizados</h1>
            <p className="text-muted-foreground">
              Crie e visualize seus próprios dashboards com dados personalizados
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Selector */}
      <DashboardSelector 
        dashboards={dashboards || []}
        selectedDashboardId={selectedDashboardId}
        onSelectDashboard={setSelectedDashboardId}
      />

      {selectedDashboard && (
        <>
          {/* Action Bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedDashboard.nome}</h2>
                <p className="text-sm text-muted-foreground">
                  {entries?.length || 0} entradas registradas
                </p>
              </div>
              <Button 
                onClick={() => setShowDataEntry(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Dados
              </Button>
            </div>
          </Card>

          {/* Data Entry Modal */}
          {showDataEntry && (
            <DataEntry
              dashboardId={selectedDashboardId}
              onClose={() => setShowDataEntry(false)}
            />
          )}

          {/* Charts View */}
          {!loadingEntries && (
            <ChartsView 
              entries={entries || []}
              dashboardName={selectedDashboard.nome}
            />
          )}
        </>
      )}

      {!selectedDashboardId && dashboards && dashboards.length === 0 && (
        <Card className="p-8 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dashboard encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro dashboard personalizado para começar
          </p>
        </Card>
      )}
    </div>
  );
};

export default CustomDashboards;