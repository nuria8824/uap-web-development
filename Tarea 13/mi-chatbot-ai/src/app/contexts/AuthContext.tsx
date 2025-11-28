"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, User } from '@/app/types/auth';
import { getToken, removeToken, saveToken, getCurrentUser, isAuthenticated } from '@/app/utils/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Verificar autenticación al cargar la página
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user) {
          setAuthState({
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        } else {
          // Token inválido, limpiar
          removeToken();
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      removeToken();
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: 'Error al verificar autenticación'
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        saveToken(data.token);
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return true;
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: data.error || 'Error al iniciar sesión'
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      });
      return false;
    }
  };

  const register = async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        saveToken(data.token);
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return true;
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: data.error || 'Error al registrar usuario'
        });
        return false;
      }
    } catch (error) {
      console.error('Register error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      });
      return false;
    }
  };

  const logout = () => {
    removeToken();
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}