'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api';

const AuthContext = createContext(undefined);

// helper to get base url (used in cases we still need fetch)
const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      // Verify token with your backend
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      // Call your API to verify token
      // reuse axios instance for consistency
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    } finally {
      setIsLoading(false);
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

      // Axios responses use `data`
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