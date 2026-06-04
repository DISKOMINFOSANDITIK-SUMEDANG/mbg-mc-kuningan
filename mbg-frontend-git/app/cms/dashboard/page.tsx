'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import { 
  IconBuilding, 
  IconChefHat, 
  IconUsers, 
  IconCalendar,
  IconAlertCircle,
  IconCircleCheck
} from '@tabler/icons-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalSPPGs: 0,
    totalUsers: 0,
    activeMenus: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    status: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      
      // Redirect based on role
      if (parsedUser.role === 'sekolah') {
        router.push('/cms/dashboard/sekolah');
        return;
      } else if (parsedUser.role === 'sppg') {
        router.push('/cms/dashboard/sppg');
        return;
      }
    }

    // Simulate loading data
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalSchools: 5,
        totalSPPGs: 2,
        totalUsers: 8,
        activeMenus: 4,
      });

      setRecentActivities([
        {
          id: '1',
          type: 'menu',
          message: 'Menu harian untuk SDN Sirah Cai telah diperbarui',
          time: '2 jam yang lalu',
          status: 'success'
        },
        {
          id: '2',
          type: 'school',
          message: 'Data sekolah SDN Tanjungsari 1 telah diperbarui',
          time: '4 jam yang lalu',
          status: 'success'
        },
        {
          id: '3',
          type: 'sppg',
          message: 'Dapur SPPG Sirah Cai memerlukan verifikasi',
          time: '6 jam yang lalu',
          status: 'warning'
        },
        {
          id: '4',
          type: 'user',
          message: 'User baru telah mendaftar sebagai staff SPPG',
          time: '1 hari yang lalu',
          status: 'info'
        },
      ]);

      setIsLoading(false);
    };

    loadDashboardData();
  }, [router]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'menu':
        return <IconChefHat className="h-5 w-5" />;
      case 'school':
        return <IconBuilding className="h-5 w-5" />;
      case 'sppg':
        return <IconChefHat className="h-5 w-5" />;
      case 'user':
        return <IconUsers className="h-5 w-5" />;
      default:
        return <IconCalendar className="h-5 w-5" />;
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-blue-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Selamat datang di CMS Makan Bergizi Gratis
          </h1>
          <p className="text-blue-100">
            Kelola program makan bergizi gratis di Kabupaten Kuningan dengan mudah dan efisien.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <IconBuilding className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sekolah</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <IconChefHat className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total SPPG</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSPPGs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <IconUsers className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <IconCalendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menu Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeMenus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getActivityStatusColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Cepat</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sekolah Aktif</span>
                  <span className="text-sm font-medium text-green-600">5/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SPPG Beroperasi</span>
                  <span className="text-sm font-medium text-green-600">2/2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Menu Hari Ini</span>
                  <span className="text-sm font-medium text-blue-600">4 Menu</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Online</span>
                  <span className="text-sm font-medium text-purple-600">3 Users</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Sistem</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <IconCircleCheck className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="text-xs text-green-600 ml-auto">Online</span>
                </div>
                <div className="flex items-center space-x-3">
                  <IconCircleCheck className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">API</span>
                  <span className="text-xs text-green-600 ml-auto">Online</span>
                </div>
                <div className="flex items-center space-x-3">
                  <IconCircleCheck className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-xs text-green-600 ml-auto">Online</span>
                </div>
                <div className="flex items-center space-x-3">
                  <IconAlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-gray-600">Backup</span>
                  <span className="text-xs text-yellow-600 ml-auto">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CMSLayout>
  );
}
