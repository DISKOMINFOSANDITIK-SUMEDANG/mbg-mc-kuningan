'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IconMenu2, 
  IconLogout,
  IconUser,
  IconBell,
  IconChefHat,
  IconSchool,
  IconShield,
  IconSettings,
  IconChevronDown
} from '@tabler/icons-react';
import { clearAuthData, setUserData } from '@/lib/auth/cookies';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import CMSSidebar from './CMSSidebar';
import UserProfileModal from '../shared/UserProfileModal';

interface User {
  id: string;
  email: string;
  role: 'administrator' | 'sekolah' | 'sppg' | 'pemasok' | 'offtaker' | 'dinas_pertanian';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  school_id: string;
  school_name: string;
  school_level: string;
  school_district: string;
  position: string;
  sppg_id: string;
  sppg_name: string;
  sppg_type: string;
  sppg_location: string;
  supplier_id?: string;
  supplier_name?: string;
}

interface CMSLayoutProps {
  children: React.ReactNode;
}

export default function CMSLayout({ children }: CMSLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const router = useRouter();

  // Global fetch interceptor: redirect to login on 401/429 for any /api/ call
  useEffect(() => {
    let redirecting = false;
    const originalFetch = window.fetch;

    window.fetch = async function (...args: Parameters<typeof fetch>) {
      const response = await originalFetch.apply(this, args);

      if (!redirecting && (response.status === 401 || response.status === 429)) {
        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
        if (url.includes('/api/') && !url.includes('/api/auth/login')) {
          redirecting = true;
          console.log(`[Auth] Session expired (${response.status}), redirecting to login`);
          localStorage.clear();
          clearAuthData();
          window.location.href = '/cms/auth/login';
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    // Only load user data on initial mount
    loadUserData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isUserDropdownOpen && !target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const loadUserData = async (showLoading = true) => {
    try {
      // Only show loading if we don't have user data yet and this is the initial load
      if (showLoading && !userDataLoaded && !user) {
        setLoading(true);
      }
      
      console.log('[CMSLayout] Loading user data...');
      
      // Always fetch from backend to ensure fresh data
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[CMSLayout] User data received:', {
          userId: userData.userId,
          role: userData.role,
          offtakerId: userData.offtakerId,
          email: userData.email
        });
        
        setUser(userData);
        // Cache user snapshot for fast initial paint; do not fail auth flow if storage is full.
        const cacheSaved = setUserData(userData);
        if (!cacheSaved) {
          console.warn('[CMSLayout] user_data cache was not updated, continuing with in-memory session');
        }
        setUserDataLoaded(true);
      } else if (response.status === 401 || response.status === 429) {
        console.log(`[CMSLayout] Auth error (${response.status}), redirecting to login`);
        localStorage.clear();
        clearAuthData();
        router.push('/cms/auth/login');
        return;
      } else {
        console.error('[CMSLayout] Failed to load user data:', response.status);
      }
    } catch (error) {
      console.error('[CMSLayout] Error loading user data:', error);
      const isQuotaExceeded =
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);

      // Storage quota errors are non-auth errors; keep session alive.
      if (isQuotaExceeded) {
        console.warn('[CMSLayout] Storage quota exceeded while caching user data, keeping user logged in');
        setUserDataLoaded(true);
        return;
      }

      // Clear cache and redirect to login on error
      localStorage.clear();
      clearAuthData();
      router.push('/cms/auth/login');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log('[Logout] Starting logout process...');
      
      // 1. Clear localStorage FIRST before API call
      if (typeof window !== 'undefined') {
        console.log('[Logout] Clearing localStorage...');
        localStorage.clear(); // Clear everything
        console.log('[Logout] localStorage cleared successfully');
      }

      // 2. Clear all client-side authentication data
      clearAuthData();
      
      // 3. Call server-side logout endpoint to invalidate token
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH_LOGOUT), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('[Logout] Server-side logout successful');
        } else {
          console.warn('[Logout] Server-side logout failed, but continuing');
        }
      } catch (error) {
        console.error('[Logout] Error during server-side logout:', error);
      }

      // 4. Reset component state
      setUser(null);
      setUserDataLoaded(false);
      setLoading(false);

      // 5. Redirect to login page
      console.log('[Logout] Redirecting to login...');
      router.push('/cms/auth/login');
      
    } catch (error) {
      console.error('[Logout] Error during logout:', error);
      // Even if cleanup fails, still redirect to login
      router.push('/cms/auth/login');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator':
        return <IconShield className="h-4 w-4" />;
      case 'sekolah':
        return <IconSchool className="h-4 w-4" />;
      case 'sppg':
        return <IconChefHat className="h-4 w-4" />;
      default:
        return <IconUser className="h-4 w-4" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator';
      case 'sekolah':
        return 'Sekolah';
      case 'sppg':
        return 'SPPG';
      default:
        return role;
    }
  };

  const getInstitutionInfo = (user: User) => {
    if (user.role === 'sekolah' && user.school_name) {
      return `${user.school_name} (${user.school_level})`;
    } else if (user.role === 'sppg' && user.sppg_name) {
      return `${user.sppg_name} (${user.sppg_type})`;
    }
    return null;
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Belum pernah login';
    return new Date(lastLogin).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProfileSuccess = () => {
    loadUserData(false); // Reload user data after profile update without showing loading
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <CMSSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        userRole={user?.role as 'administrator' | 'sekolah' | 'sppg'}
        isLoading={loading}
      />

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu2 className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
              >
                <IconBell className="h-6 w-6" />
              </button>

              {/* User menu */}
              <div className="flex items-center gap-x-4">
                {loading ? (
                  <div className="flex items-center gap-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="hidden lg:block">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ) : user ? (
                  <div className="relative user-dropdown">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-x-2 text-sm text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          getRoleIcon(user.role)
                        )}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || user.email}
                        </p>
                        <div className="flex items-center gap-x-1">
                          {getRoleIcon(user.role)}
                          <p className="text-xs text-gray-500">
                            {getRoleDisplayName(user.role)}
                          </p>
                        </div>
                      </div>
                      <IconChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                        <div className="py-1">
                          {/* User info header */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-x-3">
                              <div className="flex-1 min-w-0">
                                {getInstitutionInfo(user) && (
                                  <p className="text-xs text-gray-400 truncate">
                                    {getInstitutionInfo(user)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Last Login:</span> {formatLastLogin(user.last_login)}
                              </p>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setIsUserDropdownOpen(false);
                                setIsProfileModalOpen(true);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <IconSettings className="h-4 w-4 mr-3" />
                              Pengaturan
                            </button>
                            <button
                              onClick={() => {
                                setIsUserDropdownOpen(false);
                                handleLogout();
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <IconLogout className="h-4 w-4 mr-3" />
                              Keluar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <IconUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-gray-900">Guest</p>
                      <p className="text-xs text-gray-500">Not logged in</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={handleProfileSuccess}
      />
    </div>
  );
}
