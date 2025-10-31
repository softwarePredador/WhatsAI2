/**
 * useAuth Hook
 * Hook para gerenciar autenticação do usuário
 */

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
}
