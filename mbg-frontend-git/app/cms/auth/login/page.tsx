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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Memeriksa status Anda...</p>
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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Background Kabupaten Kuningan (60%) */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage: "url('/images/landscape-kuningan.webp')",
          }}
        >
          {/* Gradient Overlay for depth & readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-14 text-white">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 ring-1 ring-white/20">
              <Image
                src="/images/logo-kuningan.png"
                alt="Logo Kabupaten Kuningan"
                width={52}
                height={52}
                className="drop-shadow"
              />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold tracking-tight">Makan Bergizi Gratis</h1>
              <p className="text-sm text-emerald-100/90">Kabupaten Kuningan</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-emerald-50 ring-1 ring-white/20 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Program Nasional
            </span>
            <h2 className="text-5xl font-bold leading-[1.1] tracking-tight">
              Selamat Datang di
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 to-green-400 bg-clip-text text-transparent">
                Sistem Makan Bergizi Gratis
              </span>
            </h2>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              Platform manajemen program nasional untuk memastikan pemenuhan gizi
              anak sekolah di Kabupaten Kuningan.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-sm text-white/60">
            © 2026 Kabupaten Kuningan. Hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form (42%) */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-white via-white to-emerald-50/40">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on mobile) */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="bg-emerald-50 rounded-2xl p-2.5 ring-1 ring-emerald-100">
              <Image
                src="/images/logo-kuningan.png"
                alt="Logo Kabupaten Kuningan"
                width={44}
                height={44}
              />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Makan Bergizi Gratis</h1>
              <p className="text-sm text-gray-500">Kabupaten Kuningan</p>
            </div>
          </div>

          {/* Login Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Selamat Datang!</h2>
            <p className="mt-2 text-gray-500">Silakan masuk untuk mengakses dashboard sistem</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <IconMail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-11 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Masukkan Email Anda"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <IconLock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Masukkan kata sandi Anda"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-5 w-5" />
                  ) : (
                    <IconEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3.5">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                <p className="text-red-600 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3.5 px-4 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:from-emerald-700 hover:to-green-700 focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
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
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-400">
              © 2026 Kabupaten Kuningan. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}