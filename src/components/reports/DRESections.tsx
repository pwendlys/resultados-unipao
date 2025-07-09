
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: string;
  total: number;
  totalInterest: number;
  transactionCount: number;
  transactions: any[];
}

interface DRESectionsProps {
  entryCategories: Category[];
  exitCategories: Category[];
  totalEntries: number;
  totalExits: number;
  totalInterest: number;
  netResult: number;
  selectedAccount: string;
}

export const DRESections = ({
  entryCategories,
  exitCategories,
  totalEntries,
  totalExits,
  totalInterest,
  netResult,
  selectedAccount,
}: DRESectionsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Receitas (Entradas) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-600">
            Receitas (Entradas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entryCategories.length > 0 ? (
              entryCategories.map((category) => (
                <div key={category.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.transactionCount} transações
                    </Badge>
                    {category.totalInterest > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        <Calculator className="h-3 w-3 mr-1" />
                        R$ {category.totalInterest.toFixed(2)} juros
                      </Badge>
                    )}
                  </div>
                  <span className="font-semibold text-green-600">
                    R$ {category.total.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma receita encontrada para o período selecionado
              </p>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center font-semibold text-green-600">
                <span>Total de Receitas</span>
                <span>R$ {totalEntries.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Despesas (Saídas) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-red-600">
            Despesas (Saídas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exitCategories.length > 0 ? (
              exitCategories.map((category) => (
                <div key={category.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.transactionCount} transações
                    </Badge>
                    {category.totalInterest > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        <Calculator className="h-3 w-3 mr-1" />
                        R$ {category.totalInterest.toFixed(2)} juros
                      </Badge>
                    )}
                  </div>
                  <span className="font-semibold text-red-600">
                    R$ {category.total.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma despesa encontrada para o período selecionado
              </p>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center font-semibold text-red-600">
                <span>Total de Despesas</span>
                <span>R$ {totalExits.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Resumo do Resultado - {selectedAccount !== 'ALL' ? selectedAccount : 'Todas as Contas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-600">Total de Receitas</span>
              <span className="font-semibold text-green-600">R$ {totalEntries.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600">Total de Despesas</span>
              <span className="font-semibold text-red-600">R$ {totalExits.toFixed(2)}</span>
            </div>
            {totalInterest > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-orange-600 flex items-center gap-1">
                  <Calculator className="h-4 w-4" />
                  Total de Juros
                </span>
                <span className="font-semibold text-orange-600">R$ {totalInterest.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className={`font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Resultado Líquido
                </span>
                <span className={`font-bold text-lg ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {netResult.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
