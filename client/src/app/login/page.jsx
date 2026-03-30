'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const error = searchParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      router.push('/home');
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    window.location.href = `${base}/api/auth/google/login`;
  };

  return (
     <div className="min-h-screen flex items-center justify-center bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button - Top Left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-blue-300/80 hover:text-white text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-lg">
        {/* Dark Blue Card - Perfect Fit */}
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 backdrop-blur-sm">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-700/90 to-blue-600/90 py-6 px-6 sm:px-8 text-center">
            {/* Perfectly Fitted Logo */}
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100/90">
              Sign in to your Eventra account
            </p>
          </div>

          {/* Card Content */}
          <div className="p-6 sm:p-8">
            {/* Error Message */}
            {error === 'google_oauth_not_configured' && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                Google sign-in is not configured. Please use email and password to sign in.
              </div>
            )}

            {/* Google Sign In Button */}
            <Button
              variant="google"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 text-sm sm:text-base font-medium mb-6 shadow hover:shadow-md transition-all duration-200"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-blue-700/40"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-slate-900 text-blue-300/80 text-xs sm:text-sm font-medium">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-blue-200/90 font-medium text-xs sm:text-sm uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400/80 group-focus-within:text-blue-300 transition-colors" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 sm:pl-10 pr-3 py-2.5 text-sm sm:text-base bg-blue-800/30 border-blue-700/40 text-white placeholder:text-blue-400/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-blue-200/90 font-medium text-xs sm:text-sm uppercase tracking-wider">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs sm:text-sm font-medium text-blue-300/80 hover:text-blue-200 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400/80 group-focus-within:text-blue-300 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 sm:pl-10 pr-10 py-2.5 text-sm sm:text-base bg-blue-800/30 border-blue-700/40 text-white placeholder:text-blue-400/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400/80 hover:text-blue-300 transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400/80 hover:text-blue-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full py-3 text-sm sm:text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-500 hover:border-blue-400 shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </form>

            {/* Register Link */}
            <div className="mt-6 pt-5 border-t border-blue-800/40 text-center">
              <p className="text-blue-300/80 text-xs sm:text-sm">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="font-semibold text-white hover:text-blue-200 transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}