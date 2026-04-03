
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalUser {
  userId: string;
  fullName: string;
  email: string;
}

export const useFiscalUsersFromRoles = () => {
  return useQuery({
    queryKey: ['fiscal-users-from-roles'],
    queryFn: async () => {
      // Get users with fiscal role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'fiscal');

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map(p => ({
        userId: p.id,
        fullName: p.full_name || p.email || 'Sem nome',
        email: p.email || '',
      })) as FiscalUser[];
    },
  });
};
