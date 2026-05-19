import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PenLine, Eraser, Save, Loader2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  useFiscalUserProfile,
  useSaveDefaultSignature,
} from '@/hooks/useFiscalUserProfile';
import { useToast } from '@/hooks/use-toast';

const MySignatureCard = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  const { data: profile, isLoading } = useFiscalUserProfile(userId);
  const saveSignature = useSaveDefaultSignature();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
    }
  }, [open]);

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
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasSignature(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = () => {
    if (!userId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');
    saveSignature.mutate(
      { userId, signatureData },
      {
        onSuccess: () => {
          toast({
            title: 'Assinatura salva',
            description: 'Sua assinatura padrão foi atualizada com sucesso.',
          });
          setOpen(false);
        },
        onError: () => {
          toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar a assinatura. Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const hasSaved = !!profile?.default_signature_data;
  const updatedAt = profile?.default_signature_updated_at
    ? new Date(profile.default_signature_updated_at).toLocaleString('pt-BR')
    : null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Minha Assinatura Digital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasSaved ? (
            <>
              <div className="border rounded-md bg-white p-2 flex items-center justify-center">
                <img
                  src={profile!.default_signature_data!}
                  alt="Assinatura padrão"
                  className="max-h-32 object-contain"
                />
              </div>
              {updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Atualizada em {updatedAt}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Esta assinatura será exibida ao final das assinaturas de
                relatórios e atas.
              </p>
              <Button
                onClick={() => setOpen(true)}
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!userId}
              >
                <PenLine className="h-4 w-4 mr-2" />
                Editar assinatura
              </Button>
            </>
          ) : (
            <>
              <div className="border border-dashed rounded-md py-8 text-center text-sm text-muted-foreground">
                Nenhuma assinatura padrão salva ainda.
              </div>
              <Button
                onClick={() => setOpen(true)}
                size="sm"
                className="w-full"
                disabled={!userId}
              >
                <PenLine className="h-4 w-4 mr-2" />
                Criar assinatura
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {hasSaved ? 'Editar assinatura padrão' : 'Criar assinatura padrão'}
            </DialogTitle>
            <DialogDescription>
              Desenhe sua nova assinatura abaixo. Ela substituirá a anterior e
              será usada nas próximas assinaturas de relatórios e atas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
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
              Use o mouse ou toque para desenhar sua assinatura
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={clearCanvas}
              disabled={saveSignature.isPending}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saveSignature.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasSignature || saveSignature.isPending}
            >
              {saveSignature.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {saveSignature.isPending ? 'Salvando...' : 'Salvar assinatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MySignatureCard;
