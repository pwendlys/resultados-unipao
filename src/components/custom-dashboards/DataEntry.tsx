import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCustomEntriesActions } from '@/hooks/useCustomEntries';
import { useToast } from '@/hooks/use-toast';

interface DataEntryProps {
  dashboardId: string;
  onClose: () => void;
}

const DataEntry = ({ dashboardId, onClose }: DataEntryProps) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    ano: currentYear.toString(),
    mes: currentMonth.toString(),
    categoria: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: '',
    descricao: ''
  });

  const { createEntry } = useCustomEntriesActions();
  const { toast } = useToast();

  const categorias = [
    'Vendas',
    'Serviços',
    'Investimentos',
    'Salários',
    'Aluguel',
    'Fornecedores',
    'Marketing',
    'Tecnologia',
    'Operacional',
    'Administrativo',
    'Financeiro',
    'Outros'
  ];

  const meses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoria || !formData.valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const valor = parseFloat(formData.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido",
        variant: "destructive"
      });
      return;
    }

    try {
      await createEntry.mutateAsync({
        dashboard_id: dashboardId,
        ano: parseInt(formData.ano),
        mes: parseInt(formData.mes),
        categoria: formData.categoria,
        tipo: formData.tipo,
        valor: valor,
        descricao: formData.descricao || undefined
      });

      toast({
        title: "Entrada adicionada",
        description: "Dados adicionados com sucesso ao dashboard",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao adicionar entrada",
        description: "Não foi possível adicionar os dados. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Dados</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ano">Ano *</Label>
              <Select value={formData.ano} onValueChange={(value) => setFormData(prev => ({ ...prev, ano: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="mes">Mês *</Label>
              <Select value={formData.mes} onValueChange={(value) => setFormData(prev => ({ ...prev, mes: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo *</Label>
            <RadioGroup 
              value={formData.tipo} 
              onValueChange={(value: 'entrada' | 'saida') => setFormData(prev => ({ ...prev, tipo: value }))}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrada" id="entrada" />
                <Label htmlFor="entrada" className="text-green-600">Entrada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="saida" id="saida" />
                <Label htmlFor="saida" className="text-red-600">Saída</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="text"
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição opcional..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DataEntry;