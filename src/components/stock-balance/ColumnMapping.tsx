import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ColumnMapping as ColumnMappingType } from '@/utils/stockBalanceProcessor';

interface ColumnMappingProps {
  headers: string[];
  detectedMapping: ColumnMappingType;
  detectedType: 'estoque' | 'perdas';
  onComplete: (mapping: ColumnMappingType, periodo: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const REQUIRED_FIELDS = {
  codigo: 'Código',
  descricao: 'Descrição',
  quantidade_sistema: 'Quantidade no Sistema',
  quantidade_real: 'Quantidade Real',
  unitario: 'Preço Unitário'
};

const OPTIONAL_FIELDS = {
  diferenca_quantidade: 'Diferença (Qtd vs Real)',
  valor_sistema: 'Valor Sistema',
  valor_real: 'Valor Real',
  diferenca_monetaria: 'Diferença Monetária'
};

const ColumnMapping = ({ headers, detectedMapping, detectedType, onComplete, onBack, isProcessing }: ColumnMappingProps) => {
  const [mapping, setMapping] = useState<ColumnMappingType>(detectedMapping);
  const [periodo, setPeriodo] = useState('');

  const handleFieldChange = (field: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header === 'none' ? undefined : header
    }));
  };

  const handleSubmit = () => {
    if (!periodo.trim()) {
      return;
    }
    onComplete(mapping, periodo.trim());
  };

  const getUnmappedHeaders = () => {
    const mappedHeaders = Object.values(mapping).filter(Boolean);
    return headers.filter(header => !mappedHeaders.includes(header));
  };

  const canProceed = () => {
    return periodo.trim() && (mapping.quantidade_sistema || mapping.quantidade_real);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Mapeamento de Colunas</h2>
          <p className="text-muted-foreground">
            Configure como as colunas do arquivo devem ser interpretadas
          </p>
          <p className="text-sm text-primary font-medium mt-1">
            Tipo detectado: {detectedType === 'perdas' ? 'Perdas/Avarias' : 'Estoque Normal'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Balanço</CardTitle>
            <CardDescription>Configure as informações básicas do balanço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Período do Balanço *</Label>
              <Input
                id="periodo"
                placeholder="Ex: Janeiro 2024"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos Principais</CardTitle>
            <CardDescription>Mapeie as colunas principais do seu arquivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(REQUIRED_FIELDS).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Select
                  value={mapping[field] || 'none'}
                  onValueChange={(value) => handleFieldChange(field, value)}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não mapear</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos Opcionais</CardTitle>
            <CardDescription>Campos calculados automaticamente se não mapeados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(OPTIONAL_FIELDS).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Select
                  value={mapping[field] || 'none'}
                  onValueChange={(value) => handleFieldChange(field, value)}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Calcular automaticamente</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colunas Não Mapeadas</CardTitle>
            <CardDescription>Colunas que não serão importadas</CardDescription>
          </CardHeader>
          <CardContent>
            {getUnmappedHeaders().length > 0 ? (
              <div className="text-sm text-muted-foreground">
                {getUnmappedHeaders().map(header => (
                  <div key={header} className="py-1">{header}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Todas as colunas foram mapeadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!canProceed() || isProcessing}
          className="min-w-32"
        >
          {isProcessing ? (
            "Processando..."
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Processar Balanço
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ColumnMapping;