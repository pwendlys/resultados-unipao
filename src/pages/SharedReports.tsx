
import { useParams } from 'react-router-dom';
import Reports from '@/components/reports/Reports';
import { useEffect, useState } from 'react';

const SharedReports = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [isValidLink, setIsValidLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular validação do link compartilhado
    // Em um cenário real, você validaria o shareId no backend
    if (shareId && shareId.length > 0) {
      setTimeout(() => {
        setIsValidLink(true);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            O link compartilhado não é válido ou expirou.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a administração da Unipão para obter um novo link de acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header específico para visualização compartilhada */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Unipão</h1>
              <p className="text-sm text-muted-foreground">Visualização Compartilhada - Somente Leitura</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Acesso Cooperado
            </div>
          </div>
        </div>
      </header>
      
      {/* Conteúdo dos relatórios */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Reports />
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Unipão - Visualização compartilhada para cooperados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SharedReports;
