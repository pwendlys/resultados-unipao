
const numberToWords: Record<number, string> = {
  1: 'primeiro', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
  6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
  11: 'onze', 12: 'doze', 13: 'treze', 14: 'quatorze', 15: 'quinze',
  16: 'dezesseis', 17: 'dezessete', 18: 'dezoito', 19: 'dezenove',
  20: 'vinte', 21: 'vinte e um', 22: 'vinte e dois', 23: 'vinte e três',
  24: 'vinte e quatro', 25: 'vinte e cinco', 26: 'vinte e seis',
  27: 'vinte e sete', 28: 'vinte e oito', 29: 'vinte e nove',
  30: 'trinta', 31: 'trinta e um',
};

const monthNames: Record<number, string> = {
  0: 'janeiro', 1: 'fevereiro', 2: 'março', 3: 'abril',
  4: 'maio', 5: 'junho', 6: 'julho', 7: 'agosto',
  8: 'setembro', 9: 'outubro', 10: 'novembro', 11: 'dezembro',
};

const yearToWords = (year: number): string => {
  if (year === 2024) return 'dois mil e vinte e quatro';
  if (year === 2025) return 'dois mil e vinte e cinco';
  if (year === 2026) return 'dois mil e vinte e seis';
  if (year === 2027) return 'dois mil e vinte e sete';
  if (year === 2028) return 'dois mil e vinte e oito';
  return String(year);
};

export interface MinutesTemplateParams {
  meetingDate: Date;
  meetingType: string;
  fiscaisNomes: string[];
  tesoureiroNome: string;
  convidadosNomes: string[];
  competenciasTexto: string;
  hasDiligencias: boolean;
  diligencesSummary?: string;
}

export const generateMinutesText = (params: MinutesTemplateParams): string => {
  const {
    meetingDate,
    meetingType,
    fiscaisNomes,
    tesoureiroNome,
    convidadosNomes,
    competenciasTexto,
    hasDiligencias,
  } = params;

  const day = meetingDate.getDate();
  const month = meetingDate.getMonth();
  const year = meetingDate.getFullYear();

  const dayWritten = numberToWords[day] || String(day);
  const monthWritten = monthNames[month] || '';
  const yearWritten = yearToWords(year);
  const dateBr = meetingDate.toLocaleDateString('pt-BR');

  const fiscaisListText = formatNameList(fiscaisNomes);

  const convidadosClause = convidadosNomes.length > 0
    ? ` e dos seguintes convidados: ${formatNameList(convidadosNomes)}`
    : '';

  const resultadoDiligencias = hasDiligencias
    ? (params.diligencesSummary
        ? `houve diligências e observações no período analisado, conforme descrito a seguir: ${params.diligencesSummary}. Ainda assim, deliberou-se pela APROVAÇÃO dos relatórios relacionados nesta ata, ficando as diligências registradas para acompanhamento`
        : 'na reunião, foram registradas diligências e observações, devidamente consolidadas nesta ata')
    : 'na reunião, não foi identificada qualquer alteração ou divergência relevante';

  return `ATA DA REUNIÃO DO CONSELHO FISCAL DA COOPERATIVA UNIPÃO

Aos ${dayWritten} dias do mês de ${monthWritten} do ano de ${yearWritten} (${dateBr}), reuniram-se os membros do Conselho Fiscal da Cooperativa Unipão, senhores ${fiscaisListText}, com a presença do Tesoureiro ${tesoureiroNome}${convidadosClause}, para a realização da reunião ${meetingType} do Conselho Fiscal, com o objetivo de analisar as contas da cooperativa referentes à competência ${competenciasTexto}.

O Tesoureiro ${tesoureiroNome} deu início à reunião, agradecendo a presença de todos os participantes e informou que o objetivo principal do encontro seria a apreciação e validação das movimentações financeiras, das compras realizadas no período mencionado e do balanço, com base nos relatórios fiscais emitidos pelo sistema e nos extratos correspondentes.

Após análise, o Conselho Fiscal registrou que ${resultadoDiligencias}, deliberando pela APROVAÇÃO dos relatórios relacionados nesta ata.

Nada mais havendo a tratar, foi lavrada a presente ata, que após lida e aprovada, será assinada por todos os presentes.`;
};

const formatNameList = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return `${rest.join(', ')} e ${last}`;
};
