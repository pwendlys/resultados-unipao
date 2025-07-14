
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Share2,
  Copy,
  ExternalLink,
  Calculator
} from 'lucide-react';
import { CustomReportConfig } from './CustomReports';
import { format } from 'date-fns';
import { useState } from 'react';
import { useSharedReportsActions } from '@/hooks/useSharedReports';

interface CategoryData {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  total: number;
  transactionCount: number;
  totalInterest: number;
}

interface CustomReportData {
  filteredTransactions: any[];
  categorizedTransactions: any[];
  entryTransactions: any[];
  exitTransactions: any[];
  totalEntries: number;
  totalExits: number;
  netResult: number;
}

interface ReportPreviewProps {
  config: CustomReportConfig;
  data: CustomReportData;
  categories: any[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const ReportPreview = ({ config, data, categories }: ReportPreviewProps) => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();
  const { createSharedReport } = useSharedReportsActions();

  const generateShareLink = async () => {
    if (isGeneratingLink) return;
    
    try {
      setIsGeneratingLink(true);
      const timestamp = Date.now();
      const shareId = `custom-report-${timestamp}`;
      
      // Criar dados do relatório para salvar no Supabase
      const reportData = {
        title: config.reportTitle,
        config,
        data,
        share_id: shareId,
      };
      
      // Salvar no Supabase
      await createSharedReport.mutateAsync(reportData);
      
      const newLink = `${window.location.origin}/relatorios-compartilhados/custom/${shareId}`;
      setShareLink(newLink);
      
      toast({
        title: "Link de compartilhamento criado!",
        description: "O link foi salvo no banco de dados e pode ser compartilhado com os cooperados.",
      });
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast({
        title: "Erro ao gerar link",
        description: "Ocorreu um erro ao salvar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const openShareLink = (url: string) => {
    window.open(url, '_blank');
  };

  // Calcular totais de juros
  const totalInterestEntries = data.entryTransactions.reduce((sum, t) => sum + (Number(t.juros) || 0), 0);
  const totalInterestExits = data.exitTransactions.reduce((sum, t) => sum + (Number(t.juros) || 0), 0);
  const totalInterest = totalInterestEntries + totalInterestExits;

  // Calcular categorias por tipo incluindo juros
  const getCategoriesByType = (type: 'entrada' | 'saida') => {
    const categoryTotals = data.categorizedTransactions
      .filter(t => t.type === type)
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Sem Categoria';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            type: transaction.type,
            total: 0,
            count: 0,
            totalInterest: 0
          };
        }
        acc[category].total += Number(transaction.amount);
        acc[category].totalInterest += Number(transaction.juros) || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, any>);

    return Object.values(categoryTotals).sort((a: any, b: any) => b.total - a.total).slice(0, 5);
  };

  const entryCategories = getCategoriesByType('entrada');
  const exitCategories = getCategoriesByType('saida');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Preview do Relatório: {config.reportTitle}
        </CardTitle>
        <CardDescription>
          Visualização prévia dos dados que serão incluídos no relatório
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Relatório */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Período</div>
            <div className="font-medium">
              {config.dateFrom && config.dateTo 
                ? `${format(config.dateFrom, 'dd/MM/yyyy')} até ${format(config.dateTo, 'dd/MM/yyyy')}`
                : config.dateFrom 
                ? `A partir de ${format(config.dateFrom, 'dd/MM/yyyy')}`
                : config.dateTo 
                ? `Até ${format(config.dateTo, 'dd/MM/yyyy')}`
                : 'Todos os períodos'
              }
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Contas Selecionadas</div>
            <div className="font-medium">
              {config.selectedAccounts.length === 0 ? 'Todas as contas' : `${config.selectedAccounts.length} conta(s)`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Transações</div>
            <div className="font-medium">{data.categorizedTransactions.length} categorizadas</div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {config.includeEntries && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Receitas</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalEntries)}</p>
                    <p className="text-xs text-muted-foreground">{data.entryTransactions.length} transações</p>
                    {totalInterestEntries > 0 && (
                      <p className="text-xs text-blue-600">Juros: {formatCurrency(totalInterestEntries)}</p>
                    )}
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {config.includeExits && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Despesas</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExits)}</p>
                    <p className="text-xs text-muted-foreground">{data.exitTransactions.length} transações</p>
                    {totalInterestExits > 0 && (
                      <p className="text-xs text-blue-600">Juros: {formatCurrency(totalInterestExits)}</p>
                    )}
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {config.includeEntries && config.includeExits && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resultado Líquido</p>
                    <p className={`text-2xl font-bold ${data.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.netResult)}
                    </p>
                    <Badge variant={data.netResult >= 0 ? 'default' : 'destructive'}>
                      {data.netResult >= 0 ? 'Superávit' : 'Déficit'}
                    </Badge>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {totalInterest > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Juros</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInterest)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.categorizedTransactions.filter(t => (Number(t.juros) || 0) > 0).length} com juros
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Transações</p>
                  <p className="text-2xl font-bold">{data.filteredTransactions.length}</p>
                  <p className="text-xs text-muted-foreground">{data.categorizedTransactions.length} categorizadas</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categorias */}
        {data.categorizedTransactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {config.includeEntries && entryCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Receitas por Categoria</CardTitle>
                  <CardDescription>Distribuição das receitas pelas principais categorias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entryCategories.map((category: any, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {category.count} transações
                            {data.totalEntries > 0 && ` • ${((category.total / data.totalEntries) * 100).toFixed(1)}%`}
                            {category.totalInterest > 0 && (
                              <span className="text-blue-600"> • Juros: {formatCurrency(category.totalInterest)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(category.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {config.includeExits && exitCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Despesas por Categoria</CardTitle>
                  <CardDescription>Distribuição das despesas pelas principais categorias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exitCategories.map((category: any, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {category.count} transações
                            {data.totalExits > 0 && ` • ${((category.total / data.totalExits) * 100).toFixed(1)}%`}
                            {category.totalInterest > 0 && (
                              <span className="text-blue-600"> • Juros: {formatCurrency(category.totalInterest)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{formatCurrency(category.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Seção de Compartilhamento */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Share2 className="h-5 w-5" />
              Compartilhar com Cooperados
            </CardTitle>
            <CardDescription>
              Gere um link permanente salvo no banco de dados para que os cooperados possam visualizar este relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={generateShareLink} 
                disabled={isGeneratingLink}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {isGeneratingLink ? 'Gerando Link...' : shareLink ? 'Gerar Novo Link' : 'Gerar Link de Compartilhamento'}
              </Button>
            </div>

            {shareLink && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white border rounded-lg text-sm font-mono">
                  <span className="flex-1 truncate">{shareLink}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareLink)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openShareLink(shareLink)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Testar Acesso
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground bg-white p-3 rounded border">
                  <strong>Como funciona:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Link permanente salvo no banco de dados Supabase</li>
                    <li>• Acesso somente leitura para cooperados</li>
                    <li>• Link pode ser enviado para qualquer pessoa</li>
                    <li>• Dados ficam seguros e sempre disponíveis</li>
                    <li>• Você pode gerar um novo link a qualquer momento</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {data.categorizedTransactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação encontrada com os critérios selecionados.</p>
            <p className="text-sm">Ajuste os filtros para ver o preview do relatório.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportPreview;
