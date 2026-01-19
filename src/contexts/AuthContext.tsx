import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'cooperado' | 'fiscal' | 'tesoureiro';

interface UserInfo {
  email: string;
  role: UserRole;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAuthenticated') === 'true';
    const storedUser = localStorage.getItem('user');
    setIsAuthenticated(isLoggedIn);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as UserInfo);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    if (email === 'adm@adm.com' && password === 'adm@2025') {
      const info: UserInfo = { email, role: 'admin' };
      setIsAuthenticated(true);
      setUser(info);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(info));
      return true;
    }

    if (email === 'cooperativa@unipao.com' && password === 'unipao123') {
      const info: UserInfo = { email, role: 'cooperado' };
      setIsAuthenticated(true);
      setUser(info);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(info));
      return true;
    }

    if (email === 'arthur@tesoureiro.com' && password === 'tesoureiro@2025') {
      const info: UserInfo = { email, role: 'tesoureiro' };
      setIsAuthenticated(true);
      setUser(info);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(info));
      return true;
    }

    return false;
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Também fazer logout do Supabase Auth (para admin)
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

