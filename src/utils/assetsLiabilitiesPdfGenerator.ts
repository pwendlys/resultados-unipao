import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AssetsLiabilities } from '@/hooks/useAssetsLiabilities';

export async function generateAssetsLiabilitiesPDF(records: AssetsLiabilities[], chartElements: HTMLElement[] = []) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  if (!records || records.length === 0) {
    pdf.text('Nenhum registro encontrado', pageWidth / 2, yPosition, { align: 'center' });
    pdf.save('ativos-passivos.pdf');
    return;
  }

  const latestRecord = records[0];

  // Função auxiliar para formatar data corretamente (evita problema de fuso horário)
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função auxiliar para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular totais
  const totalAtivos = Number(latestRecord.saldo_do_dia) + Number(latestRecord.a_receber) + 
                     Number(latestRecord.vencida) + Number(latestRecord.estoque) + Number(latestRecord.investimento);
  const totalPassivos = Number(latestRecord.a_pagar) + Number(latestRecord.joia) + Number(latestRecord.aporte) + Number(latestRecord.balanco);
  const resultado = totalAtivos - totalPassivos;

  // Cabeçalho
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório de Ativos e Passivos', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Data de Referência: ${formatDate(latestRecord.data_referencia)}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  // Seção de ATIVOS
  pdf.setFillColor(34, 197, 94); // Verde
  pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ATIVOS', 20, yPosition);
  
  yPosition += 10;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const ativosData = [
    { label: 'Saldo do Dia', value: Number(latestRecord.saldo_do_dia) },
    { label: 'A Receber', value: Number(latestRecord.a_receber) },
    { label: 'Vencida', value: Number(latestRecord.vencida) },
    { label: 'Estoque', value: Number(latestRecord.estoque) },
    { label: 'Investimento', value: Number(latestRecord.investimento) }
  ];

  ativosData.forEach(item => {
    pdf.text(item.label, 20, yPosition);
    pdf.text(formatCurrency(item.value), pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
  });

  yPosition += 2;
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL ATIVOS', 20, yPosition);
  pdf.setTextColor(34, 197, 94);
  pdf.text(formatCurrency(totalAtivos), pageWidth - 20, yPosition, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  yPosition += 15;

  // Seção de PASSIVOS
  pdf.setFillColor(239, 68, 68); // Vermelho
  pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PASSIVOS', 20, yPosition);
  
  yPosition += 10;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const passivosData = [
    { label: 'A Pagar', value: Number(latestRecord.a_pagar) },
    { label: 'Joia', value: Number(latestRecord.joia) },
    { label: 'Aporte', value: Number(latestRecord.aporte) },
    { label: 'Balanço', value: Number(latestRecord.balanco) }
  ];

  passivosData.forEach(item => {
    pdf.text(item.label, 20, yPosition);
    pdf.text(formatCurrency(item.value), pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
  });

  yPosition += 2;
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL PASSIVOS', 20, yPosition);
  pdf.setTextColor(239, 68, 68);
  pdf.text(formatCurrency(totalPassivos), pageWidth - 20, yPosition, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  yPosition += 15;

  // Resultado
  pdf.setFillColor(59, 130, 246); // Azul
  pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESULTADO', 20, yPosition);
  pdf.text(formatCurrency(resultado), pageWidth - 20, yPosition, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  yPosition += 15;

  // Observações
  if (latestRecord.observacoes) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Observações:', 20, yPosition);
    yPosition += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const splitObservacoes = pdf.splitTextToSize(latestRecord.observacoes, pageWidth - 40);
    pdf.text(splitObservacoes, 20, yPosition);
    yPosition += splitObservacoes.length * 6;
  }

  // Adicionar página de gráficos se houver elementos
  if (chartElements.length > 0) {
    pdf.addPage();
    yPosition = 20;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Análise Gráfica', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Capturar e adicionar cada gráfico
    for (const element of chartElements) {
      // Verificar se há espaço na página
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30; // Margem de 15mm em cada lado
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Limitar altura máxima
        const maxHeight = 80;
        const finalHeight = Math.min(imgHeight, maxHeight);
        const finalWidth = (canvas.width * finalHeight) / canvas.height;

        pdf.addImage(imgData, 'PNG', 15, yPosition, finalWidth, finalHeight);
        yPosition += finalHeight + 10;
      } catch (error) {
        console.error('Erro ao capturar gráfico:', error);
      }
    }
  }

  // Histórico (se houver mais de um registro)
  if (records.length > 1) {
    pdf.addPage();
    yPosition = 20;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Histórico de Registros', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Cabeçalho da tabela
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Data', 20, yPosition);
    pdf.text('Ativos', 60, yPosition, { align: 'right' });
    pdf.text('Passivos', 110, yPosition, { align: 'right' });
    pdf.text('Resultado', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 2;
    pdf.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 5;

    // Linhas da tabela
    pdf.setFont('helvetica', 'normal');
    records.forEach((record, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      const recTotalAtivos = Number(record.saldo_do_dia) + Number(record.a_receber) + 
                            Number(record.vencida) + Number(record.estoque) + Number(record.investimento);
      const recTotalPassivos = Number(record.a_pagar) + Number(record.joia) + Number(record.aporte) + Number(record.balanco);
      const recResultado = recTotalAtivos - recTotalPassivos;

      pdf.text(formatDate(record.data_referencia), 20, yPosition);
      pdf.text(formatCurrency(recTotalAtivos), 60, yPosition, { align: 'right' });
      pdf.text(formatCurrency(recTotalPassivos), 110, yPosition, { align: 'right' });
      
      if (recResultado >= 0) {
        pdf.setTextColor(34, 197, 94); // Verde
      } else {
        pdf.setTextColor(239, 68, 68); // Vermelho
      }
      pdf.text(formatCurrency(recResultado), pageWidth - 20, yPosition, { align: 'right' });
      pdf.setTextColor(0, 0, 0);

      yPosition += 7;
    });
  }

  // Rodapé em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  pdf.save(`ativos-passivos-${new Date().toISOString().split('T')[0]}.pdf`);
}
