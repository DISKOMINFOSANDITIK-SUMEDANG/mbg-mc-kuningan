'use client';

import { useState, useEffect } from 'react';
import { IconUsers, IconClipboardList, IconChefHat, IconCalendar, IconTrendingUp, IconSchool, IconUsersGroup } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
interface DashboardStats {
  totalMenus: number;
  totalMenuItems: number;
  totalDistributions: number;
  distributionsThisMonth: number;
  totalSchools: number;
  totalGroups: number;
  recentDistributions: any[];
  recentMenus: any[];
}

export default function SPPGDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMenus: 0,
    totalMenuItems: 0,
    totalDistributions: 0,
    distributionsThisMonth: 0,
    totalSchools: 0,
    totalGroups: 0,
    recentDistributions: [],
    recentMenus: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load served entities data to get schools and groups count
      const servedEntitiesResponse = await fetch('/api/cms/served-entities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!servedEntitiesResponse.ok) {
        const errorData = await servedEntitiesResponse.json().catch(() => ({}));
        console.error('Served entities error:', errorData);
        throw new Error(`Failed to fetch served entities: ${servedEntitiesResponse.status} - ${errorData.error || servedEntitiesResponse.statusText}`);
      }
      const servedEntities = await servedEntitiesResponse.json();

      // Load menus for this SPPG
      const menusResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_MENUS), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!menusResponse.ok) {
        throw new Error(`Failed to fetch menus: ${menusResponse.status} ${menusResponse.statusText}`);
      }
      const menusResult = await menusResponse.json();
      const menus = Array.isArray(menusResult) ? menusResult : (menusResult.data ?? []);

      // Load menu items for this SPPG
      const menuItemsResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_MENU_ITEMS), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!menuItemsResponse.ok) {
        throw new Error(`Failed to fetch menu items: ${menuItemsResponse.status} ${menuItemsResponse.statusText}`);
      }
      const menuItemsResult = await menuItemsResponse.json();
      const menuItems = Array.isArray(menuItemsResult) ? menuItemsResult : (menuItemsResult.data ?? []);

      // Load distributions for this SPPG
      const distributionsResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_DISTRIBUTIONS), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!distributionsResponse.ok) {
        throw new Error(`Failed to fetch distributions: ${distributionsResponse.status} ${distributionsResponse.statusText}`);
      }
      const distributionsResult = await distributionsResponse.json();
      const distributions = Array.isArray(distributionsResult) ? distributionsResult : (distributionsResult.data ?? []);

      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const distributionsThisMonth = distributions.filter((dist: any) => {
        const distDate = new Date(dist.distribution_date);
        return distDate.getMonth() === currentMonth && distDate.getFullYear() === currentYear;
      }).length;

      // Get recent distributions (last 5)
      const recentDistributions = distributions
        .sort((a: any, b: any) => new Date(b.distribution_date).getTime() - new Date(a.distribution_date).getTime())
        .slice(0, 5);

      // Get recent menus (last 5)
      const recentMenus = menus
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalMenus: menus.length || 0,
        totalMenuItems: menuItems.length || 0,
        totalDistributions: distributions.length || 0,
        distributionsThisMonth,
        totalSchools: servedEntities.schools?.length || 0,
        totalGroups: servedEntities.groups?.length || 0,
        recentDistributions,
        recentMenus
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      // Set default values on error
      setStats({
        totalMenus: 0,
        totalMenuItems: 0,
        totalDistributions: 0,
        distributionsThisMonth: 0,
        totalSchools: 0,
        totalGroups: 0,
        recentDistributions: [],
        recentMenus: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data dashboard...</p>
          </div>
        </div>
      </CMSLayout>
    );
  }

  if (error) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Data</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard SPPG</h1>
            <p className="text-gray-600">Kelola menu dan distribusi makanan bergizi</p>
          </div>

          {/* Stats Cards */}
          <div className="space-y-6">
            {/* Menu & Distribusi Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu & Distribusi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <IconClipboardList className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Menu</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalMenus}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <IconChefHat className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Item Menu</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalMenuItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <IconUsers className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Distribusi</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDistributions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <IconTrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Bulan Ini</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.distributionsThisMonth}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Entitas yang Dilayani Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Entitas yang Dilayani</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <IconSchool className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Sekolah Dilayani</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
                      <p className="text-xs text-gray-500 mt-1">Sekolah yang dilayani SPPG</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <IconUsersGroup className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Kelompok Dilayani</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
                      <p className="text-xs text-gray-500 mt-1">Kelompok masyarakat yang dilayani</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Distributions */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Distribusi Terbaru</h3>
              </div>
              <div className="p-6">
                {stats.recentDistributions.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentDistributions.map((distribution: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <IconCalendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {distribution.recipient_type === 'school' ? 'Sekolah' : 'Kelompok'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(distribution.distribution_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {distribution.total_portions} porsi
                          </p>
                          <p className="text-xs text-gray-500">
                            {distribution.menu_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <IconCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>Belum ada distribusi</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Menus */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Menu Terbaru</h3>
              </div>
              <div className="p-6">
                {stats.recentMenus.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentMenus.map((menu: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <IconClipboardList className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {menu.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(menu.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {menu.menu_items?.length || 0} item
                          </p>
                          <p className="text-xs text-gray-500">
                            {menu.sppg_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <IconClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>Belum ada menu</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
