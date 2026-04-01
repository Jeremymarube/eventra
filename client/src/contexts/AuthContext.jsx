'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api';

const AuthContext = createContext(undefined);
const AUTH_USER_KEY = 'auth-user';

const readCachedUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedUser = (user) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export function AuthProvider({ children }) {
  const cachedUser = readCachedUser();
  const [user, setUser] = useState(cachedUser);
  const [isLoading, setIsLoading] = useState(Boolean(typeof window !== 'undefined' && localStorage.getItem('token') && !cachedUser));
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      writeCachedUser(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      verifyToken({ silent: true });
      return;
    }

    verifyToken();
  }, []);

  const verifyToken = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      writeCachedUser(res.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      writeCachedUser(null);
      setUser(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', access_token);
      }
      setUser(user);
      writeCachedUser(user);
      const redirectPath = typeof window !== 'undefined' ? localStorage.getItem('redirectAfterLogin') : null;
      if (typeof window !== 'undefined') localStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath || '/events');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ name, full_name, email, password, phone }) => {
    setIsLoading(true);
    try {
      const resolvedFullName = full_name || name;
      const response = await api.post('/auth/register', {
        full_name: resolvedFullName,
        email,
        password,
        ...(phone ? { phone } : {}),
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    writeCachedUser(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
