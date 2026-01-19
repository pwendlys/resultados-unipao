import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Login no AuthContext (mantém compatibilidade com sistema existente)
      const success = login(email, password);
      
      if (success) {
        // Para admin, também fazer login no Supabase Auth para operações de Storage/RLS
        if (email === 'adm@adm.com') {
          try {
            await supabase.auth.signInWithPassword({ email, password });
          } catch (err) {
            console.warn('Supabase auth login failed, continuing with local auth');
          }
        }
      } else {
        setError('Email ou senha incorretos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center space-y-4">
          <img 
            src="/lovable-uploads/3b6ec21e-315a-4a7a-9cd4-b5287d85c49d.png" 
            alt="Unipão Logo" 
            className="h-24 w-auto mx-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-primary">Resultados Unipão</h1>
            <p className="text-muted-foreground mt-2">Sistema Financeiro</p>
          </div>
        </div>

        {/* Formulário de Login */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Faça login para acessar o sistema de resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link para área fiscal */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            É um usuário fiscal?{' '}
            <Link 
              to="/fiscal/login" 
              className="text-primary hover:underline font-medium"
            >
              Acessar área fiscal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
