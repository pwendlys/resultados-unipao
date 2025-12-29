import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from './LoginPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';

interface FiscalProtectedRouteProps {
  children: React.ReactNode;
}

const FiscalProtectedRoute: React.FC<FiscalProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Permitir acesso para admin e fiscal
  const userRole = user?.role as string | undefined;
  if (userRole !== 'admin' && userRole !== 'fiscal') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para usuários fiscais.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Se você é um fiscal, entre em contato com o administrador para obter acesso.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default FiscalProtectedRoute;
