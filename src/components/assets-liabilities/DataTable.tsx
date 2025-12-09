import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { AssetsLiabilities } from '@/hooks/useAssetsLiabilities';
import { useDeleteAssetsLiabilities } from '@/hooks/useAssetsLiabilitiesActions';
import DataForm from './DataForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DataTableProps {
  data?: AssetsLiabilities[];
}

export default function DataTable({ data }: DataTableProps) {
  const [editingRecord, setEditingRecord] = useState<AssetsLiabilities | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteMutation = useDeleteAssetsLiabilities();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum registro encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Total Ativos</TableHead>
                  <TableHead className="text-right">Total Passivos</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((record) => {
                  const totalAtivos = Number(record.saldo_do_dia) + Number(record.a_receber) + 
                                     Number(record.vencida) + Number(record.estoque) + Number(record.investimento);
                  const totalPassivos = Number(record.a_pagar) + Number(record.joia) + Number(record.aporte) + Number(record.balanco);
                  const resultado = totalAtivos - totalPassivos;

                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.data_referencia).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(totalAtivos)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {formatCurrency(totalPassivos)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(resultado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingId(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {editingRecord && (
        <DataForm
          editData={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => setEditingRecord(null)}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
