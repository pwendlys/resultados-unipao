import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useCreateAssetsLiabilities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('ativos_passivos')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-liabilities'] });
      toast({
        title: "Sucesso!",
        description: "Registro criado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar registro",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateAssetsLiabilities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('ativos_passivos')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-liabilities'] });
      toast({
        title: "Sucesso!",
        description: "Registro atualizado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteAssetsLiabilities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ativos_passivos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-liabilities'] });
      toast({
        title: "Sucesso!",
        description: "Registro excluído com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir registro",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
