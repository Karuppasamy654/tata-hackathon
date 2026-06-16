'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  safety_score: number;
  driving_sessions: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async (authToken: string) => {
    try {
      if (authToken === 'mock-token-for-local-testing') {
        setUser({ id: 1, name: 'Guest Pilot', email: 'guest@example.com', safety_score: 100, driving_sessions: 0 });
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).catch(() => null);

      if (res && res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Fallback for demo
        setUser({ id: 1, name: 'Guest Pilot', email: 'guest@example.com', safety_score: 100, driving_sessions: 0 });
      }
    } catch (_err) {
      // Fallback for demo
      setUser({ id: 1, name: 'Guest Pilot', email: 'guest@example.com', safety_score: 100, driving_sessions: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const t = setTimeout(() => {
        setToken(storedToken);
      }, 0);
      fetchUser(storedToken);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    fetchUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
