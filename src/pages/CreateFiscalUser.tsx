import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield, UserPlus, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateFiscalUser = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset password form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-fiscal-user', {
        body: { email, password },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Usuário fiscal criado!",
        description: `Conta criada para ${email}. O usuário pode acessar em /fiscal/login`,
      });

      setEmail('');
      setPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error('Erro ao criar usuário fiscal:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !resetPassword || !resetConfirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (resetPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      const { data, error } = await supabase.functions.invoke('reset-fiscal-password', {
        body: { email: resetEmail, password: resetPassword },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao resetar senha');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Senha atualizada!",
        description: `A senha de ${resetEmail} foi atualizada com sucesso.`,
      });

      setResetEmail('');
      setResetPassword('');
      setResetConfirmPassword('');

    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Gerenciar Usuários Fiscais</CardTitle>
          <CardDescription>
            Crie ou gerencie contas com acesso à área fiscal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Usuário
              </TabsTrigger>
              <TabsTrigger value="reset">
                <KeyRound className="mr-2 h-4 w-4" />
                Resetar Senha
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="fiscal@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? "Criando..." : "Criar Conta Fiscal"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email do Usuário</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="fiscal@exemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isResetting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resetPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="resetPassword"
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      disabled={isResetting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resetConfirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="resetConfirmPassword"
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    disabled={isResetting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isResetting}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {isResetting ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Sistema
          </Button>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Usuários fiscais acessam a área fiscal através de{' '}
              <code className="bg-background px-1 rounded">/fiscal/login</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateFiscalUser;
