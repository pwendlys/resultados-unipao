import { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Eraser, Check, X, Save, History } from 'lucide-react';

interface FiscalSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (signatureData: string) => void;
  isSubmitting?: boolean;
  hasAlreadySigned?: boolean;
  savedSignature?: string | null;
  onSaveAsDefault?: (signatureData: string) => void;
}

const FiscalSignatureModal = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  hasAlreadySigned = false,
  savedSignature = null,
  onSaveAsDefault,
}: FiscalSignatureModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [useSavedSignature, setUseSavedSignature] = useState(false);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      setHasSignature(false);
      setSaveAsDefault(false);
      setUseSavedSignature(false);
    }
  }, [open]);

  // Load saved signature into canvas when user toggles useSavedSignature
  useEffect(() => {
    if (useSavedSignature && savedSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Center the image
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          ) * 0.9;
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          setHasSignature(true);
        };
        img.src = savedSignature;
      }
    }
  }, [useSavedSignature, savedSignature]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // If using saved signature, clear and start fresh
    if (useSavedSignature) {
      setUseSavedSignature(false);
      clearCanvas();
    }

    setIsDrawing(true);
    setHasSignature(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setUseSavedSignature(false);
  };

  const handleUseSaved = () => {
    setUseSavedSignature(true);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    
    // If user wants to save as default and callback is provided
    if (saveAsDefault && onSaveAsDefault) {
      onSaveAsDefault(signatureData);
    }
    
    onSubmit(signatureData);
  };

  if (hasAlreadySigned) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinatura Digital</DialogTitle>
            <DialogDescription>
              Você já assinou este relatório.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Sua assinatura já foi registrada para este relatório.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinatura Digital</DialogTitle>
          <DialogDescription>
            Desenhe sua assinatura no campo abaixo para confirmar a revisão do relatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saved signature option */}
          {savedSignature && !useSavedSignature && (
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseSaved}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Usar assinatura salva
              </Button>
            </div>
          )}

          {useSavedSignature && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Usando assinatura salva
            </div>
          )}

          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-2 bg-white">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {useSavedSignature 
              ? 'Clique no canvas para desenhar uma nova assinatura'
              : 'Use o mouse ou toque para desenhar sua assinatura'}
          </p>

          {/* Save as default option */}
          {onSaveAsDefault && !savedSignature && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveDefault"
                checked={saveAsDefault}
                onCheckedChange={(checked) => setSaveAsDefault(checked === true)}
              />
              <Label htmlFor="saveDefault" className="text-sm cursor-pointer">
                Salvar como minha assinatura padrão
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={clearCanvas}
            disabled={isSubmitting}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasSignature || isSubmitting}
          >
            <Check className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Salvando...' : 'Confirmar Assinatura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalSignatureModal;
