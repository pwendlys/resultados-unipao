import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAssetsLiabilities, useUpdateAssetsLiabilities } from '@/hooks/useAssetsLiabilitiesActions';
import { AssetsLiabilities } from '@/hooks/useAssetsLiabilities';

interface DataFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editData?: AssetsLiabilities;
}

export default function DataForm({ onClose, onSuccess, editData }: DataFormProps) {
  const [formData, setFormData] = useState({
    saldo_do_dia: editData?.saldo_do_dia ?? 0,
    a_receber: editData?.a_receber ?? 0,
    vencida: editData?.vencida ?? 0,
    estoque: editData?.estoque ?? 0,
    investimento: editData?.investimento ?? 0,
    a_pagar: editData?.a_pagar ?? 0,
    joia: editData?.joia ?? 0,
    aporte: editData?.aporte ?? 0,
    data_referencia: editData?.data_referencia ?? new Date().toISOString().split('T')[0],
    observacoes: editData?.observacoes ?? ''
  });

  const createMutation = useCreateAssetsLiabilities();
  const updateMutation = useUpdateAssetsLiabilities();

  const calcularTotalAtivos = () => {
    return Number(formData.saldo_do_dia) + 
           Number(formData.a_receber) + 
           Number(formData.vencida) + 
           Number(formData.estoque) + 
           Number(formData.investimento);
  };

  const calcularTotalPassivos = () => {
    return Number(formData.a_pagar) + 
           Number(formData.joia) + 
           Number(formData.aporte);
  };

  const calcularResultado = () => {
    return calcularTotalAtivos() - calcularTotalPassivos();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editData) {
      await updateMutation.mutateAsync({ id: editData.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    onSuccess();
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setFormData({ ...formData, [field]: isNaN(numValue) ? 0 : numValue });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Editar Registro' : 'Novo Registro de Ativos e Passivos'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} id="assets-form" className="space-y-6">
          {/* Data de Referência */}
          <div>
            <Label htmlFor="data_referencia">Data de Referência *</Label>
            <Input
              type="date"
              id="data_referencia"
              value={formData.data_referencia}
              onChange={(e) => setFormData({ ...formData, data_referencia: e.target.value })}
              required
            />
          </div>

          {/* ATIVOS */}
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 text-green-700 dark:text-green-400">ATIVOS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saldo_do_dia">Saldo do Dia</Label>
                <Input
                  type="number"
                  id="saldo_do_dia"
                  step="0.01"
                  value={formData.saldo_do_dia}
                  onChange={(e) => handleNumberChange('saldo_do_dia', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="a_receber">A Receber</Label>
                <Input
                  type="number"
                  id="a_receber"
                  step="0.01"
                  value={formData.a_receber}
                  onChange={(e) => handleNumberChange('a_receber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vencida">Vencida</Label>
                <Input
                  type="number"
                  id="vencida"
                  step="0.01"
                  value={formData.vencida}
                  onChange={(e) => handleNumberChange('vencida', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estoque">Estoque</Label>
                <Input
                  type="number"
                  id="estoque"
                  step="0.01"
                  value={formData.estoque}
                  onChange={(e) => handleNumberChange('estoque', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="investimento">Investimento</Label>
                <Input
                  type="number"
                  id="investimento"
                  step="0.01"
                  value={formData.investimento}
                  onChange={(e) => handleNumberChange('investimento', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <div className="w-full p-3 bg-green-100 dark:bg-green-900/30 rounded">
                  <div className="text-sm text-muted-foreground">Total Ativos</div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(calcularTotalAtivos())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PASSIVOS */}
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 text-red-700 dark:text-red-400">PASSIVOS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="a_pagar">A Pagar</Label>
                <Input
                  type="number"
                  id="a_pagar"
                  step="0.01"
                  value={formData.a_pagar}
                  onChange={(e) => handleNumberChange('a_pagar', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="joia">Joia</Label>
                <Input
                  type="number"
                  id="joia"
                  step="0.01"
                  value={formData.joia}
                  onChange={(e) => handleNumberChange('joia', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="aporte">Aporte</Label>
                <Input
                  type="number"
                  id="aporte"
                  step="0.01"
                  value={formData.aporte}
                  onChange={(e) => handleNumberChange('aporte', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <div className="w-full p-3 bg-red-100 dark:bg-red-900/30 rounded">
                  <div className="text-sm text-muted-foreground">Total Passivos</div>
                  <div className="text-xl font-bold text-red-700 dark:text-red-400">
                    {formatCurrency(calcularTotalPassivos())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTADO */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">RESULTADO:</span>
              <span className={`text-2xl font-bold ${calcularResultado() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(calcularResultado())}
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Adicione observações sobre este registro..."
              rows={3}
            />
          </div>
          </form>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="assets-form"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editData ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
