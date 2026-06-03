'use client';

import { useState, useEffect, useCallback } from 'react';
import { IconUsers, IconBuilding, IconCalendar, IconTrendingUp, IconSchool } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import { setUserData } from '@/lib/auth/cookies';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
interface DashboardStats {
  totalDistributions: number;
  distributionsThisMonth: number;
  totalPortions: number;
  recentDistributions: any[];
  schoolInfo: any;
}

export default function SekolahDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDistributions: 0,
    distributionsThisMonth: 0,
    totalPortions: 0,
    recentDistributions: [],
    schoolInfo: null
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get user data from localStorage first for quick display
      const cachedUserData = localStorage.getItem('user_data');
      if (cachedUserData) {
        try {
          setUser(JSON.parse(cachedUserData));
        } catch (parseError) {
          console.warn('Invalid cached user_data, clearing cache:', parseError);
          localStorage.removeItem('user_data');
        }
      }

      // Then fetch fresh data from backend
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setUserData(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.school_id) {
        console.error('No school_id found for user');
        return;
      }

      // Load distributions for this specific school
      const distributionsResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_DISTRIBUTIONS), {
        credentials: 'include'
      });
      const distributionsResult = distributionsResponse.ok ? await distributionsResponse.json() : [];
      const allDistributions = Array.isArray(distributionsResult) ? distributionsResult : (distributionsResult.data ?? []);

      // Filter distributions for this school only
      const distributions = allDistributions.filter((dist: any) => 
        dist.recipient_type === 'school' && dist.recipient_id === user.school_id
      );

      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const distributionsThisMonth = distributions.filter((dist: any) => {
        const distDate = new Date(dist.distribution_date);
        return distDate.getMonth() === currentMonth && distDate.getFullYear() === currentYear;
      });

      const totalPortions = distributions.reduce((sum: number, dist: any) => sum + (dist.portions || 0), 0);

      // Get recent distributions (last 10)
      const recentDistributions = distributions
        .sort((a: any, b: any) => new Date(b.distribution_date).getTime() - new Date(a.distribution_date).getTime())
        .slice(0, 10);

      // Use school info from user data
      const schoolInfo = {
        name: user.school_name || "Nama Sekolah",
        level: user.school_level || "Level",
        district: user.school_district || "Distrik",
        address: "Alamat Sekolah" // This might need to be fetched separately
      };

      setStats({
        totalDistributions: distributions.length,
        distributionsThisMonth: distributionsThisMonth.length,
        totalPortions,
        recentDistributions,
        schoolInfo
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Sekolah</h1>
            <p className="text-gray-600">Pantau distribusi makanan bergizi untuk sekolah</p>
          </div>

          {/* School Info */}
          {stats.schoolInfo && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <IconSchool className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">{stats.schoolInfo.name}</h2>
                  <p className="text-gray-600">{stats.schoolInfo.level} - {stats.schoolInfo.district}</p>
                  <p className="text-sm text-gray-500">{stats.schoolInfo.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Distribusi</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDistributions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IconCalendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bulan Ini</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.distributionsThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <IconTrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Porsi</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPortions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Distributions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Distribusi Terbaru</h3>
            </div>
            <div className="p-6">
              {stats.recentDistributions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Menu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Porsi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SPPG
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentDistributions.map((distribution: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(distribution.distribution_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distribution.menu_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distribution.total_portions} porsi
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distribution.sppg_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Selesai
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <IconUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Belum ada distribusi</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/cms/distributions"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconUsers className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Lihat Distribusi</p>
                  <p className="text-xs text-gray-500">Pantau distribusi makanan</p>
                </div>
              </a>

              <a
                href="/search"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <IconBuilding className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Cari Sekolah</p>
                  <p className="text-xs text-gray-500">Temukan sekolah lain</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
