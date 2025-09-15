import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useCustomDashboardsActions, DashboardPersonalizado } from '@/hooks/useCustomDashboards';
import { useToast } from '@/hooks/use-toast';

interface DashboardSelectorProps {
  dashboards: DashboardPersonalizado[];
  selectedDashboardId: string;
  onSelectDashboard: (id: string) => void;
}

const DashboardSelector = ({ dashboards, selectedDashboardId, onSelectDashboard }: DashboardSelectorProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const { createDashboard, deleteDashboard } = useCustomDashboardsActions();
  const { toast } = useToast();

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o dashboard",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await createDashboard.mutateAsync({
        nome: newDashboardName.trim(),
        user_id: 'admin' // For now, using a fixed user_id
      });
      
      setNewDashboardName('');
      setShowCreateDialog(false);
      onSelectDashboard(result.id);
      
      toast({
        title: "Dashboard criado",
        description: `Dashboard "${result.nome}" criado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar dashboard",
        description: "Não foi possível criar o dashboard. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDashboard = async (dashboardId: string, dashboardName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o dashboard "${dashboardName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDashboard.mutateAsync(dashboardId);
      
      if (selectedDashboardId === dashboardId) {
        onSelectDashboard('');
      }
      
      toast({
        title: "Dashboard excluído",
        description: `Dashboard "${dashboardName}" excluído com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir dashboard",
        description: "Não foi possível excluir o dashboard. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Selecionar Dashboard</h3>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dashboard-name">Nome do Dashboard</Label>
                <Input
                  id="dashboard-name"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  placeholder="Ex: Controle Financeiro 2024"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateDashboard}
                  disabled={createDashboard.isPending}
                >
                  {createDashboard.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="dashboard-select">Dashboard Atual</Label>
          <Select value={selectedDashboardId} onValueChange={onSelectDashboard}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um dashboard" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.map((dashboard) => (
                <SelectItem key={dashboard.id} value={dashboard.id}>
                  {dashboard.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedDashboardId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dashboard = dashboards.find(d => d.id === selectedDashboardId);
              if (dashboard) {
                handleDeleteDashboard(dashboard.id, dashboard.nome);
              }
            }}
            disabled={deleteDashboard.isPending}
            className="mt-6"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default DashboardSelector;