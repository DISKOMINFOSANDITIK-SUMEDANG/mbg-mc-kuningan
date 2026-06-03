'use client';

import { useState, useEffect } from 'react';
import { IconChefHat, IconUsers, IconSchool, IconUsersGroup, IconInfoCircle } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import ServedEntitiesList from '@/components/cms/sppgs/ServedEntitiesList';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
interface SPPGData {
  id: string;
  name: string;
  type: string;
  schools: any[];
  groups: any[];
}

export default function ServedEntitiesPage() {
  const [sppgData, setSppgData] = useState<SPPGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSPPGData();
  }, []);

  const loadSPPGData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load served entities data for the current user
      // Using credentials: 'include' to send HTTP-only cookies
      const response = await fetch('/api/cms/served-entities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch served entities: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setSppgData({
        id: data.sppg.id,
        name: data.sppg.name,
        type: data.sppg.type,
        schools: data.schools || [],
        groups: data.groups || []
      });
      
    } catch (err) {
      console.error('Error loading served entities data:', err);
      setError('Gagal memuat data entitas yang dilayani. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconChefHat className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadSPPGData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </CMSLayout>
    );
  }

  if (!sppgData) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconChefHat className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-600">Tidak ada data SPPG yang tersedia</p>
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
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <IconChefHat className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{sppgData.name}</h1>
                <p className="text-blue-100">{sppgData.type}</p>
              </div>
            </div>
            <p className="text-blue-100">Kelola dan lihat entitas yang dilayani oleh SPPG ini</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <IconSchool className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sekolah yang Dilayani</p>
                  <p className="text-2xl font-bold text-gray-900">{sppgData.schools.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <IconUsersGroup className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kelompok yang Dilayani</p>
                  <p className="text-2xl font-bold text-gray-900">{sppgData.groups.length}</p>
                </div>
              </div>
            </div>
          </div>


          {/* Served Entities List */}
          <ServedEntitiesList
            sppgId={sppgData.id}
            rawSchools={sppgData.schools}
            rawGroups={sppgData.groups}
          />
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
