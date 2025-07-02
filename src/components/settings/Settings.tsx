import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories, useCategoriesActions } from '@/hooks/useCategories';
import ShareReports from './ShareReports';

const Settings = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'entrada' | 'saida'>('saida');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string, type: 'entrada' | 'saida'} | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'entrada' | 'saida'>('saida');
  
  const { toast } = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const { createCategory, updateCategory, deleteCategory } = useCategoriesActions();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        type: newCategoryType
      });
      
      setNewCategoryName('');
      setNewCategoryType('saida');
      
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: {id: string, name: string, type: 'entrada' | 'saida'}) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditType(category.type);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim()) return;

    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: editName.trim(),
        type: editType
      });
      
      setEditingCategory(null);
      setEditName('');
      
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    try {
      await deleteCategory.mutateAsync(categoryId);
      
      toast({
        title: "Sucesso",
        description: `Categoria "${categoryName}" foi excluída com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  const entryCategories = categories.filter(cat => cat.type === 'entrada');
  const exitCategories = categories.filter(cat => cat.type === 'saida');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações e Compartilhar</h1>
        <p className="text-muted-foreground">
          Gerencie as categorias e compartilhe relatórios com os cooperados
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="share">Compartilhar Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-6">
          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Categoria</CardTitle>
              <CardDescription>
                Adicione uma nova categoria para classificar transações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nome da Categoria</Label>
                  <Input
                    id="category-name"
                    placeholder="Ex: Material de Escritório"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-type">Tipo</Label>
                  <Select value={newCategoryType} onValueChange={(value: 'entrada' | 'saida') => setNewCategoryType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateCategory}
                    disabled={createCategory.isPending || !newCategoryName.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createCategory.isPending ? 'Criando...' : 'Criar Categoria'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entry Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Categorias de Entrada
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {entryCategories.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Categorias para receitas e entradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Carregando categorias...
                  </div>
                ) : entryCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria de entrada cadastrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entryCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        {editingCategory?.id === category.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1"
                            />
                            <Select value={editType} onValueChange={(value: 'entrada' | 'saida') => setEditType(value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="entrada">Entrada</SelectItem>
                                <SelectItem value="saida">Saída</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">Entrada</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a categoria "{category.name}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category.id, category.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exit Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Categorias de Saída
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {exitCategories.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Categorias para despesas e saídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Carregando categorias...
                  </div>
                ) : exitCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria de saída cadastrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exitCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        {editingCategory?.id === category.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1"
                            />
                            <Select value={editType} onValueChange={(value: 'entrada' | 'saida') => setEditType(value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="entrada">Entrada</SelectItem>
                                <SelectItem value="saida">Saída</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">Saída</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a categoria "{category.name}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category.id, category.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="share">
          <ShareReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
