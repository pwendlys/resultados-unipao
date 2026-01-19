import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ChevronDown,
  ChevronUp,
  Folder,
  Users,
  AlertCircle,
  Eye
} from 'lucide-react';
import { FiscalReview } from '@/hooks/useFiscalReviews';
import { cn } from '@/lib/utils';

interface FiscalReviewItemProps {
  review: FiscalReview;
  myStatus?: 'approved' | 'divergent';
  myDiligenceAck?: boolean;
  approvalCount?: number;
  isDiligence?: boolean;
  diligenceAckCount?: number;
  reviewCount?: number;           // NEW: How many fiscals reviewed
  diligenceCreatorName?: string;  // NEW: Who created the diligence
  diligenceCreatedAt?: string;    // NEW: When diligence was created
  diligenceObservation?: string;  // NEW: Reason/observation for diligence
  onApprove: () => void;
  onFlag: () => void;
  onConfirmDiligence?: () => void;
}

const FiscalReviewItem = ({ 
  review, 
  myStatus, 
  myDiligenceAck = false,
  approvalCount = 0, 
  isDiligence = false,
  diligenceAckCount = 0,
  reviewCount = 0,
  diligenceCreatorName,
  diligenceCreatedAt,
  diligenceObservation,
  onApprove, 
  onFlag,
  onConfirmDiligence
}: FiscalReviewItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const transaction = review.transaction;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Get status info based on the current fiscal user's review status
  const getMyStatusInfo = () => {
    switch (myStatus) {
      case 'approved':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bg: 'bg-green-50 border-green-200',
          label: 'Aprovado por você'
        };
      case 'divergent':
        return { 
          icon: AlertTriangle, 
          color: 'text-destructive', 
          bg: 'bg-red-50 border-red-200',
          label: 'Divergente'
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-muted-foreground', 
          bg: 'bg-card border-border',
          label: 'Pendente'
        };
    }
  };

  const statusInfo = getMyStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  // Has the current fiscal reviewed this item?
  const isReviewed = myStatus !== undefined;
  
  // Does the user need to confirm diligence?
  const needsDiligenceConfirmation = isDiligence && !myDiligenceAck;
  
  // Override background for diligence items that need action
  const cardBg = needsDiligenceConfirmation 
    ? 'bg-orange-50 border-orange-300' 
    : statusInfo.bg;

  return (
    <Card className={cn("transition-all", cardBg)}>
      <CardContent className="p-3 md:p-4">
        {/* Main Row */}
        <div className="flex items-start gap-3">
          {/* Entry Index */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {review.entry_index}
          </div>

          {/* Transaction Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {transaction?.date}
              </span>
              <Badge 
                variant={transaction?.type === 'entrada' ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  transaction?.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                )}
              >
                {transaction?.type === 'entrada' ? 'C' : 'D'}
              </Badge>
              
              {/* Diligence badges - shows when any fiscal marked as divergent */}
              {isDiligence && (
                <>
                  {/* Reviewed badge - counts fiscals who made a decision */}
                  <Badge 
                    variant="outline" 
                    className="text-xs flex items-center gap-1 text-blue-600 border-blue-500"
                  >
                    <Eye className="h-3 w-3" />
                    Revisado {reviewCount}/3
                  </Badge>
                  
                  {/* Diligence ack badge */}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs flex items-center gap-1",
                      diligenceAckCount >= 3 
                        ? "border-green-500 text-green-600 bg-green-50" 
                        : "border-orange-500 text-orange-600 bg-orange-50"
                    )}
                  >
                    <AlertCircle className="h-3 w-3" />
                    Ciência {diligenceAckCount}/3
                  </Badge>
                </>
              )}
              
              {/* Approval count badge - only show if not in diligence */}
              {!isDiligence && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs flex items-center gap-1",
                    approvalCount >= 3 ? "border-green-500 text-green-600" : "text-muted-foreground"
                  )}
                >
                  <Users className="h-3 w-3" />
                  {approvalCount}/3
                </Badge>
              )}
            </div>
            
            <p className="font-medium text-sm md:text-base truncate">
              {transaction?.description || 'Sem descrição'}
            </p>
            
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "font-semibold",
                transaction?.type === 'entrada' ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(transaction?.amount || 0)}
              </span>
              
              {transaction?.category && (
                <Badge variant="outline" className="text-xs">
                  <Folder className="h-3 w-3 mr-1" />
                  {transaction.category}
                </Badge>
              )}
            </div>

            {/* Diligence details block - shows who created and the reason */}
            {isDiligence && (
              <div className="mt-2 p-3 bg-orange-100 border border-orange-200 rounded-lg text-sm space-y-1">
                {/* Creator info */}
                <div className="flex items-start gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Marcado por:</span>{' '}
                    <span>{diligenceCreatorName || 'Fiscal'}</span>
                    {diligenceCreatedAt && (
                      <span className="text-orange-600 ml-1">
                        em {formatDateTime(diligenceCreatedAt).date} às {formatDateTime(diligenceCreatedAt).time}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Reason/observation */}
                {diligenceObservation && (
                  <div className="text-orange-800 pl-6">
                    <span className="font-medium">Motivo:</span>{' '}
                    <span>{diligenceObservation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Icon */}
          <StatusIcon className={cn("h-5 w-5 flex-shrink-0", statusInfo.color)} />
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Detalhes
              </>
            )}
          </Button>

          {/* Actions based on state */}
          <div className="flex gap-2 items-center">
            {/* Diligence confirmation button - priority over other actions */}
            {needsDiligenceConfirmation && onConfirmDiligence && (
              <Button
                size="sm"
                variant="outline"
                onClick={onConfirmDiligence}
                className="text-orange-600 border-orange-500 hover:bg-orange-100"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Confirmar Diligência
              </Button>
            )}
            
            {/* Diligence confirmed badge */}
            {isDiligence && myDiligenceAck && (
              <Badge variant="outline" className="text-orange-600 border-orange-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Diligência Confirmada
              </Badge>
            )}

            {/* Show action buttons if not reviewed and not in diligence mode */}
            {!isReviewed && !isDiligence && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onFlag}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Divergente
                </Button>
                <Button
                  size="sm"
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
              </>
            )}

            {/* Show status badge if reviewed and not in diligence */}
            {isReviewed && !isDiligence && (
              <Badge variant="outline" className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Descrição Original:</span>
              <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                {transaction?.description_raw || transaction?.description || '-'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Categoria:</span>
                <p>{transaction?.category || 'Não categorizado'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Índice no Extrato:</span>
                <p>#{review.entry_index}</p>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Status:</span>
              {isDiligence ? (
                <p className="text-orange-600">
                  Diligência ativa - {diligenceAckCount} de 3 fiscais confirmaram ciência
                </p>
              ) : (
                <p>{approvalCount} de 3 fiscais aprovaram este lançamento</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FiscalReviewItem;
