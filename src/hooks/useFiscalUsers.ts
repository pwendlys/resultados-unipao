import { useState, useEffect } from 'react';

export interface FiscalUser {
  id: string;
  email: string;
  name: string;
}

// Lista de usuários fiscais disponíveis
// Em uma implementação completa, isso viria de uma tabela no Supabase
const FISCAL_USERS: FiscalUser[] = [
  { id: '1', email: 'fiscal1@unipao.coop.br', name: 'Fiscal 1' },
  { id: '2', email: 'fiscal2@unipao.coop.br', name: 'Fiscal 2' },
  { id: '3', email: 'fiscal3@unipao.coop.br', name: 'Fiscal 3' },
];

export const useFiscalUsers = () => {
  const [users, setUsers] = useState<FiscalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setUsers(FISCAL_USERS);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    data: users,
    isLoading,
  };
};

export const addFiscalUser = (email: string, name: string) => {
  // Em uma implementação completa, isso salvaria no Supabase
  const newUser: FiscalUser = {
    id: String(FISCAL_USERS.length + 1),
    email,
    name,
  };
  FISCAL_USERS.push(newUser);
  return newUser;
};
