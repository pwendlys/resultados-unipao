import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, DollarSign } from 'lucide-react';
import { useCustomEntriesActions, EntradaPersonalizada } from '@/hooks/useCustomEntries';
import { useToast } from '@/hooks/use-toast';

interface DataTableProps {
  entries: EntradaPersonalizada[];
  open: boolean;
  onClose: () => void;
  dashboardName: string;
}

const DataTable = ({ entries, open, onClose, dashboardName }: DataTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { deleteEntry } = useCustomEntriesActions();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteEntry.mutateAsync(id);
      toast({
        title: "Entrada excluída",
        description: "A entrada foi excluída com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a entrada. Tente novamente.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatMes = (mes: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1] || '';
  };

  const formatValue = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Sort entries by year and month (most recent first)
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerenciar Dados - {dashboardName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma entrada encontrada</h3>
              <p className="text-muted-foreground">
                Adicione algumas entradas para visualizá-las aqui
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">
                        {formatMes(entry.mes)} {entry.ano}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.categoria}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={entry.tipo === 'entrada' ? 'default' : 'secondary'}
                        className={
                          entry.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }
                      >
                        {entry.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={entry.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                        {formatValue(entry.valor)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={entry.descricao || ''}>
                        {entry.descricao || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            disabled={deletingId === entry.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.
                              <div className="mt-2 p-3 bg-muted rounded-md">
                                <div className="font-medium">
                                  {entry.categoria} - {formatMes(entry.mes)} {entry.ano}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatValue(entry.valor)} ({entry.tipo})
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total: {sortedEntries.length} entrada(s)
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTable;