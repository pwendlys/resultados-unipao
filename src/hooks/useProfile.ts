import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// Hook to get the current user's profile (with user-specific cache key)
export const useProfile = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile | null;
    },
    enabled: !!userId,
  });
};

// Hook to get a specific user's profile by ID (for admin/treasurer)
export const useProfileById = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile by id:', error);
        return null;
      }

      return data as Profile | null;
    },
    enabled: !!userId,
  });
};

// Hook to get multiple profiles by IDs (for PDF generation)
export const useProfilesByIds = (userIds: string[]) => {
  return useQuery({
    queryKey: ['profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching profiles:', error);
        return {};
      }

      // Build a map of id -> profile
      const profilesMap: Record<string, Profile> = {};
      for (const profile of data || []) {
        profilesMap[profile.id] = profile as Profile;
      }

      return profilesMap;
    },
    enabled: userIds.length > 0,
  });
};

// Hook to update the current user's profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ fullName }: { fullName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Try to upsert - this handles both insert and update
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    onSuccess: (_data, _vars, _ctx) => {
      // Invalidate all profile queries (including user-specific ones)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Perfil atualizado",
        description: "Seu nome foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error in useUpdateProfile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seu nome. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};
