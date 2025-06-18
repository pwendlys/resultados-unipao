
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types para categorias
export interface Category {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  created_at: string;
}

// Hook para buscar categorias
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories from database...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      console.log('Categories fetched:', data?.length || 0);
      return data as Category[];
    },
  });
};

// Hook para mutações de categorias
export const useCategoriesActions = () => {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at'>) => {
      console.log('Creating category:', category);
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating category:', error);
        throw error;
      }
      console.log('Category created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating categories queries after creating category:', data.id);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      console.log('Updating category:', id, updates);
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }
      console.log('Category updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating categories queries after updating category:', data.id);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting category:', id);
      const { data, error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
      console.log('Category deleted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating categories queries after deleting category:', data.id);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return { createCategory, updateCategory, deleteCategory };
};
