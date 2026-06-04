'use client';

import { useState, useEffect } from 'react';
import { IconEye, IconEyeOff, IconLock, IconMail } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check authentication status via API endpoint
        const response = await fetch('/api/cms/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies in request
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            console.log('🔄 User already authenticated, redirecting...');
            
            // Get redirect URL from query params or use default
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect') || '/cms/sppgs';
            
            // Validate redirect URL to prevent open redirect attacks
            const allowedRedirects = [
              '/cms/dashboard',
              '/cms/sppgs',
              '/cms/schools',
              '/cms/users',
              '/cms/groups',
              '/cms/menus',
              '/cms/menu-items',
              '/cms/files',
              '/cms/distributions'
            ];
            
            const finalRedirect = allowedRedirects.includes(redirectTo) ? redirectTo : '/cms/sppgs';
            
            // Use router.replace to avoid adding to history
            router.replace(finalRedirect);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa status Anda...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('🔄 Login attempt:', { email, password: '***' });

    try {
      const response = await fetch('/api/auth/login-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        redirect: 'follow' // Allow automatic redirect following
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is a redirect (3xx status codes)
      if (response.redirected) {
        console.log('🔄 Redirected to:', response.url);
        // Force navigation to the redirected URL
        router.push(response.url);
        return;
      }

      if (response.ok) {
        console.log('✅ Login successful, checking for redirect...');
        // If no automatic redirect happened, manually redirect to dashboard
        router.push('/cms/dashboard');
        return;
      } else {
        console.error('❌ Login failed with status:', response.status);
        const errorData = await response.json();
        console.error('❌ Error data:', errorData);
        setError(errorData.error || 'Login gagal');
      }
    } catch (error) {
      console.error('❌ Network error during login:', error);
      setError('Maaf, terjadi kesalahan. Silakan coba lagi atau periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Kabupaten Kuningan (70%) */}
      <div className="hidden lg:flex lg:w-[70%] relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/landscape-kuningan.jpeg')"
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <Image
                src="/images/logo-kuningan.png"
                alt="Logo Kabupaten Kuningan"
                width={64}
                height={64}
                className="mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold">Makan Bergizi Gratis</h1>
                <p className="text-lg opacity-90">Kabupaten Kuningan</p>
              </div>
            </div>
            
            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Selamat Datang di
                <span className="block text-green-400">
                  Sistem Makan Bergizi Gratis
                </span>
              </h2>
              <p className="text-xl opacity-90 leading-relaxed">
                Platform manajemen program nasional untuk memastikan pemenuhan gizi 
                anak sekolah di Kabupaten Kuningan.
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (30%) */}
      <div className="w-full lg:w-[30%] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/images/logo-kuningan.png"
                alt="Logo Kabupaten Kuningan"
                width={48}
                height={48}
                className="mr-3"
              />
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">Makan Bergizi Gratis</h1>
                <p className="text-sm text-gray-600">Kabupaten Kuningan</p>
              </div>
            </div>
          </div>

          {/* Login Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang!</h2>
            <p className="text-gray-600">Silakan masuk untuk mengakses dashboard sistem</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan Email Anda"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan kata sandi Anda"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <IconEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Memproses...
                </div>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Kabupaten Kuningan. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}