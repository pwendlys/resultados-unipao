import { ComparisonData } from '@/hooks/useBalanceComparison';

export interface ChartConfig {
  width: number;
  height: number;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

const defaultConfig: ChartConfig = {
  width: 600,
  height: 400,
  backgroundColor: '#ffffff',
  primaryColor: '#3b82f6',
  secondaryColor: '#ef4444',
  textColor: '#1f2937'
};

// Função para criar canvas
const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

// Função para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Gráfico de evolução do resultado monetário
export const generateResultEvolutionChart = (data: ComparisonData, config = defaultConfig): HTMLCanvasElement => {
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, config.width, config.height);
  
  // Configurações do gráfico
  const padding = 60;
  const chartWidth = config.width - 2 * padding;
  const chartHeight = config.height - 2 * padding - 40;
  
  // Dados
  const values = data.balances.map(b => b.resultado_monetario || 0);
  const labels = data.balances.map(b => b.periodo);
  
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  
  // Título
  ctx.fillStyle = config.textColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Evolução do Resultado Monetário', config.width / 2, 30);
  
  // Eixos
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  // Eixo Y
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.stroke();
  
  // Eixo X
  ctx.beginPath();
  ctx.moveTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();
  
  // Linhas de grade horizontais
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight * i) / 5;
    const value = maxValue - (valueRange * i) / 5;
    
    ctx.strokeStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
    
    // Labels do eixo Y
    ctx.fillStyle = config.textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(value), padding - 10, y + 4);
  }
  
  // Linha do gráfico
  ctx.strokeStyle = config.primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  values.forEach((value, index) => {
    const x = padding + (chartWidth * index) / (values.length - 1);
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Pontos
  values.forEach((value, index) => {
    const x = padding + (chartWidth * index) / (values.length - 1);
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    
    ctx.fillStyle = config.primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Labels do eixo X
    ctx.fillStyle = config.textColor;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labels[index], x, padding + chartHeight + 20);
  });
  
  return canvas;
};

// Gráfico de pizza para distribuição de itens
export const generateItemDistributionChart = (data: ComparisonData, config = defaultConfig): HTMLCanvasElement => {
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, config.width, config.height);
  
  // Dados
  const melhorou = data.kpis.top_melhorias.length;
  const piorou = data.kpis.top_pioras.length;
  const manteve = data.itemsComparison.length - melhorou - piorou;
  const total = melhorou + piorou + manteve;
  
  if (total === 0) return canvas;
  
  // Título
  ctx.fillStyle = config.textColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Distribuição dos Itens por Tendência', config.width / 2, 30);
  
  // Configurações do gráfico
  const centerX = config.width / 2;
  const centerY = config.height / 2 + 10;
  const radius = Math.min(config.width, config.height) / 4;
  
  // Cores
  const colors = ['#10b981', '#ef4444', '#6b7280']; // Verde, Vermelho, Cinza
  const labels = ['Melhoraram', 'Pioraram', 'Mantiveram'];
  const values = [melhorou, piorou, manteve];
  
  let currentAngle = -Math.PI / 2; // Começar no topo
  
  values.forEach((value, index) => {
    if (value > 0) {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Fatia
      ctx.fillStyle = colors[index];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Label da fatia
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), labelX, labelY);
      
      currentAngle += sliceAngle;
    }
  });
  
  // Legenda
  const legendX = centerX + radius + 30;
  let legendY = centerY - 40;
  
  values.forEach((value, index) => {
    if (value > 0) {
      // Quadrado colorido
      ctx.fillStyle = colors[index];
      ctx.fillRect(legendX, legendY - 8, 12, 12);
      
      // Texto da legenda
      ctx.fillStyle = config.textColor;
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${labels[index]}: ${value} (${((value / total) * 100).toFixed(1)}%)`, legendX + 20, legendY);
      
      legendY += 20;
    }
  });
  
  return canvas;
};

// Gráfico de barras para top variações
export const generateTopVariationsChart = (data: ComparisonData, config = defaultConfig): HTMLCanvasElement => {
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, config.width, config.height);
  
  // Título
  ctx.fillStyle = config.textColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Top 5 Variações Monetárias', config.width / 2, 30);
  
  // Configurações do gráfico
  const padding = 60;
  const chartWidth = config.width - 2 * padding;
  const chartHeight = config.height - 2 * padding - 40;
  
  // Dados (top 5 de cada)
  const topMelhorias = data.kpis.top_melhorias.slice(0, 5).map(item => ({
    label: (item.descricao || item.codigo || 'N/A').substring(0, 15),
    value: Math.abs(item.variacao_monetaria || 0),
    color: '#10b981'
  }));
  
  const topPioras = data.kpis.top_pioras.slice(0, 5).map(item => ({
    label: (item.descricao || item.codigo || 'N/A').substring(0, 15),
    value: Math.abs(item.variacao_monetaria || 0),
    color: '#ef4444'
  }));
  
  const allItems = [...topMelhorias, ...topPioras];
  if (allItems.length === 0) return canvas;
  
  const maxValue = Math.max(...allItems.map(item => item.value));
  const barHeight = Math.min(25, chartHeight / allItems.length - 5);
  
  // Eixos
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  // Eixo Y
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.stroke();
  
  // Eixo X
  ctx.beginPath();
  ctx.moveTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();
  
  // Barras
  allItems.forEach((item, index) => {
    const y = padding + index * (barHeight + 5);
    const barWidth = (item.value / maxValue) * chartWidth;
    
    // Barra
    ctx.fillStyle = item.color;
    ctx.fillRect(padding + 1, y, barWidth, barHeight);
    
    // Label do item
    ctx.fillStyle = config.textColor;
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, padding + 5, y + barHeight / 2 + 3);
    
    // Valor
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(item.value), padding + chartWidth - 5, y + barHeight / 2 + 3);
  });
  
  return canvas;
};

// Função principal para gerar todos os gráficos
export const generateAllCharts = (data: ComparisonData, config = defaultConfig) => {
  return [
    {
      canvas: generateResultEvolutionChart(data, config),
      width: config.width,
      height: config.height
    },
    {
      canvas: generateItemDistributionChart(data, config),
      width: config.width,
      height: config.height
    },
    {
      canvas: generateTopVariationsChart(data, config),
      width: config.width,
      height: config.height
    }
  ];
};