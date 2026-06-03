'use client';

import { useState, useEffect } from 'react';
import { IconSchool, IconBuilding, IconUsers, IconMapPin, IconCalendar, IconEdit, IconEye, IconArrowRight } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
interface School {
  id: string;
  name: string;
  level: string;
  address: string;
  district: string;
  village: string;
  student_count: number;
  program_start_date: string;
  status: string;
  latitude?: number;
  longitude?: number;
  sppg_id?: string;
  sppgs?: {
    id: string;
    name: string;
    type: string;
  };
  created_at?: string;
  updated_at?: string;
}

export default function SchoolManagementPage() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMySchool = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        if (!userData.school_id) {
          setError('Anda tidak memiliki sekolah yang terkait dengan akun ini');
          return;
        }

        // Fetch school details
        const schoolResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SCHOOLS}/${userData.school_id}`), {
          credentials: 'include'
        });
        if (!schoolResponse.ok) {
          throw new Error('Failed to fetch school data');
        }
        
        const schoolData = await schoolResponse.json();
        setSchool(schoolData);
      } catch (err) {
        console.error('Error loading school:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data sekolah');
      } finally {
        setLoading(false);
      }
    };

    loadMySchool();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SD':
        return 'bg-blue-100 text-blue-800';
      case 'SMP':
        return 'bg-green-100 text-green-800';
      case 'SMA':
        return 'bg-purple-100 text-purple-800';
      case 'SMK':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-800';
      case 'Tidak Aktif':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconSchool className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Dapat Memuat Data Sekolah</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </CMSLayout>
    );
  }

  if (!school) {
    return (
      <CMSLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconSchool className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sekolah Tidak Ditemukan</h3>
          <p className="text-gray-600">Sekolah yang terkait dengan akun Anda tidak ditemukan.</p>
        </div>
      </CMSLayout>
    );
  }

  const managementSections = [
    {
      id: 'info',
      title: 'Informasi Dasar',
      description: 'Kelola informasi dasar sekolah seperti nama, level, alamat, dan kontak',
      icon: IconBuilding,
      color: 'bg-blue-50 text-blue-600',
      href: `/cms/school-management/${school.id}?tab=info`
    },
    {
      id: 'students',
      title: 'Data Siswa',
      description: 'Kelola data siswa dan jumlah peserta program',
      icon: IconUsers,
      color: 'bg-green-50 text-green-600',
      href: `/cms/school-management/${school.id}?tab=students`
    },
    {
      id: 'location',
      title: 'Lokasi & Peta',
      description: 'Kelola informasi lokasi dan koordinat geografis sekolah',
      icon: IconMapPin,
      color: 'bg-purple-50 text-purple-600',
      href: `/cms/school-management/${school.id}?tab=location`
    },
    {
      id: 'program',
      title: 'Program & Jadwal',
      description: 'Kelola jadwal program dan tanggal mulai program',
      icon: IconCalendar,
      color: 'bg-yellow-50 text-yellow-600',
      href: `/cms/school-management/${school.id}?tab=program`
    },
    {
      id: 'sppg',
      title: 'SPPG Terkait',
      description: 'Lihat informasi SPPG yang melayani sekolah ini',
      icon: IconSchool,
      color: 'bg-orange-50 text-orange-600',
      href: `/cms/school-management/${school.id}?tab=sppg`
    }
  ];

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kelola Sekolah Saya</h1>
                <p className="text-gray-600 mt-1">Kelola informasi dan data sekolah yang Anda kelola</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(school.level)}`}>
                  {school.level}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(school.status)}`}>
                  {school.status}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{school.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Alamat:</span> {school.address}
                </div>
                <div>
                  <span className="font-medium">Distrik:</span> {school.district}, {school.village}
                </div>
                <div>
                  <span className="font-medium">Jumlah Siswa:</span> {school.student_count?.toLocaleString() || 0} siswa
                </div>
              </div>
              {school.sppgs && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <IconSchool className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <span className="font-medium text-blue-900">SPPG Terkait:</span>
                      <p className="text-sm text-blue-700">{school.sppgs.name} ({school.sppgs.type})</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <a
                  key={section.id}
                  href={section.href}
                  className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {section.description}
                      </p>
                      <div className="flex items-center mt-3 text-blue-600 text-sm font-medium">
                        <span>Kelola</span>
                        <IconArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
