'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Success message and redirect
      alert('Account created successfully! Welcome to Eventra.');
      router.push('/home');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    window.location.href = `${base}/api/auth/google/login`;
  };

  // Password validation checks
  const passwordChecks = {
    length: formData.password.length >= 6,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-8 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button - Top Left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-400 hover:text-white text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Dark Blue Card on Black BG */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 backdrop-blur-sm">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-700/90 to-blue-600/90 py-8 px-6 sm:px-8 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Create Account
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100/90">
              Join Eventra and start creating amazing events
            </p>
          </div>

          {/* Card Content */}
          <div className="p-6 sm:p-8 bg-gray-900/50">
            {/* Google Sign Up Button */}
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
              Sign up with Google
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-gray-900/50 text-gray-400 text-xs sm:text-sm font-medium">
                  Or register with email
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-gray-300 font-medium text-xs sm:text-sm uppercase tracking-wider">
                  Full Name
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-9 sm:pl-10 pr-3 py-2.5 text-sm sm:text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-300 font-medium text-xs sm:text-sm uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9 sm:pl-10 pr-3 py-2.5 text-sm sm:text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-300 font-medium text-xs sm:text-sm uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-9 sm:pl-10 pr-10 py-2.5 text-sm sm:text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-blue-400 transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-blue-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium text-xs sm:text-sm uppercase tracking-wider">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-9 sm:pl-10 pr-10 py-2.5 text-sm sm:text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-blue-400 transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-blue-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    {passwordChecks.length ? (
                      <Check className="h-3 w-3 text-green-400 mr-2" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 mr-2" />
                    )}
                    <span className={`text-xs ${passwordChecks.length ? 'text-green-300' : 'text-gray-400'}`}>
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasUpperCase ? (
                      <Check className="h-3 w-3 text-green-400 mr-2" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 mr-2" />
                    )}
                    <span className={`text-xs ${passwordChecks.hasUpperCase ? 'text-green-300' : 'text-gray-400'}`}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasLowerCase ? (
                      <Check className="h-3 w-3 text-green-400 mr-2" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 mr-2" />
                    )}
                    <span className={`text-xs ${passwordChecks.hasLowerCase ? 'text-green-300' : 'text-gray-400'}`}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasNumber ? (
                      <Check className="h-3 w-3 text-green-400 mr-2" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 mr-2" />
                    )}
                    <span className={`text-xs ${passwordChecks.hasNumber ? 'text-green-300' : 'text-gray-400'}`}>
                      One number
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.passwordsMatch ? (
                      <Check className="h-3 w-3 text-green-400 mr-2" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 mr-2" />
                    )}
                    <span className={`text-xs ${passwordChecks.passwordsMatch ? 'text-green-300' : 'text-gray-400'}`}>
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="terms" className="text-xs sm:text-sm text-gray-400">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              {/* Create Account Button */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full py-3 text-sm sm:text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-600 hover:border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <p className="text-gray-400 text-xs sm:text-sm">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}