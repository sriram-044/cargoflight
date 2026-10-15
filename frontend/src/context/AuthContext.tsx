import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  refreshDemoSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('aerotrace_user');
    return savedUser
      ? JSON.parse(savedUser)
      : {
          username: 'admin',
          fullName: 'Karthik Subramanian',
          role: 'SYSTEM_ADMIN',
          airport: 'MAA',
        };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('aerotrace_token');
  });

  const hasInitRun = useRef(false);

  // Auto-connect to backend demo session once on mount if token is absent
  useEffect(() => {
    if (hasInitRun.current) return;
    hasInitRun.current = true;

    const initDemoSession = async () => {
      const existingToken = localStorage.getItem('aerotrace_token');
      if (existingToken) {
        setToken(existingToken);
        return;
      }

      try {
        const res = await api.getDemoSession();
        const authUser: User = {
          username: res.username,
          fullName: res.fullName,
          role: res.role,
          airport: res.airport,
        };
        setUser(authUser);
        setToken(res.token);
        localStorage.setItem('aerotrace_token', res.token);
        localStorage.setItem('aerotrace_user', JSON.stringify(authUser));
      } catch (err) {
        console.info('CARGOFLIGHT Demo Session initialization note:', err);
      }
    };

    initDemoSession();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    const authUser: User = {
      username: res.username,
      fullName: res.fullName,
      role: res.role,
      airport: res.airport,
    };
    setUser(authUser);
    setToken(res.token);
    localStorage.setItem('aerotrace_token', res.token);
    localStorage.setItem('aerotrace_user', JSON.stringify(authUser));
  };

  const refreshDemoSession = async () => {
    try {
      const res = await api.getDemoSession();
      const authUser: User = {
        username: res.username,
        fullName: res.fullName,
        role: res.role,
        airport: res.airport,
      };
      setUser(authUser);
      setToken(res.token);
      localStorage.setItem('aerotrace_token', res.token);
      localStorage.setItem('aerotrace_user', JSON.stringify(authUser));
    } catch {
      // Preserve active operator state
    }
  };

  const logout = () => {
    refreshDemoSession();
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return true;
    return roles.includes(user.role) || user.role === 'SYSTEM_ADMIN';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: true,
        hasRole,
        refreshDemoSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
