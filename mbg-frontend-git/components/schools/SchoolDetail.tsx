'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IconMapPin, IconUsers, IconCalendar, IconChefHat, IconTools, IconTruck, IconPhoto } from '@tabler/icons-react';
import { School, SPPG, DailyMenu, getSPPGById, getMenus } from '@/lib/api-client';
import SPPGDetail from './SPPGDetail';
import DistributionDetail from './DistributionDetail';
import SchoolReportsTab from './SchoolReportsTab';
import MapView from '@/components/shared/MapView';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/shared/Skeleton';

interface SchoolDetailProps {
  school: School;
}

export default function SchoolDetail({ school }: SchoolDetailProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'sppg' | 'distribution' | 'reports'>('distribution');
  const [sppg, setSppg] = useState<SPPG | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'sppg', 'distribution', 'reports'].includes(tab)) {
      setActiveTab(tab as 'info' | 'sppg' | 'distribution' | 'reports');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!school.sppgId) {
          setLoading(false);
          return;
        }
        
        const [sppgData] = await Promise.all([
          getSPPGById(school.sppgId),
        ]);
        
        setSppg(sppgData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (school.sppgId) {
      loadData();
    }
  }, [school.sppgId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pilot':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="space-y-2">
                  <Skeleton variant="text" className="w-64" />
                  <Skeleton variant="text" className="w-40" />
                </div>
              </div>
              <Skeleton variant="text" className="w-2/3" />
            </div>
            <div className="flex space-x-2">
              <Skeleton variant="rectangular" width={80} height={28} />
              <Skeleton variant="rectangular" width={100} height={28} />
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-4">
            <Skeleton variant="text" className="w-48" />
            <Skeleton variant="rectangular" height={240} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* School Header */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 px-8 py-10 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                  <IconUsers className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-white tracking-tight">{school.name}</h1>
                  <p className="text-indigo-100 text-xl font-semibold mt-1">{school.level} - {school.district}</p>
                </div>
              </div>
              <p className="text-indigo-100 text-base max-w-3xl">{school.address}</p>
            </div>
            <div className="flex gap-3">
              <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getLevelColor(school.level)}`}>
                {school.level}
              </span>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(school.status)}`}>
                {school.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* School Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <IconUsers className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Jumlah Siswa</h3>
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{school.studentCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 font-medium">siswa terdaftar</p>
                </div>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <IconMapPin className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Kecamatan</h3>
                  <p className="text-lg font-bold text-gray-800">{school.district}</p>
                  <p className="text-xs text-gray-600 font-medium mt-1">wilayah sekolah</p>
                </div>
              </div>
            </div>
          </div>

          {/* SPPG Preview */}
          {sppg && (
            <div className="bg-gradient-to-br from-orange-50 via-white to-red-50/30 rounded-2xl p-7 border-2 border-orange-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center space-x-4 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  <IconChefHat className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Dapur Penyedia (SPPG)</h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{sppg.name}</h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-semibold border border-orange-200">
                      {sppg.type}
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold border border-blue-200">
                      {(sppg.capacity || 0).toLocaleString()} porsi/hari
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/sppg-info/${sppg.id}`)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                >
                  <span>Lihat Detail</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        <div className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <nav className="flex space-x-2 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-5 border-b-3 font-semibold text-sm transition-all duration-300 ${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600 bg-white/70'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Informasi Sekolah
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`py-4 px-5 border-b-3 font-semibold text-sm transition-all duration-300 ${
                activeTab === 'distribution'
                  ? 'border-indigo-500 text-indigo-600 bg-white/70'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Distribusi Porsi
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-5 border-b-3 font-semibold text-sm transition-all duration-300 ${
                activeTab === 'reports'
                  ? 'border-indigo-500 text-indigo-600 bg-white/70'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Laporan Sekolah
            </button>
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-8 border-2 border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <IconMapPin className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Informasi Kontak</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                        <IconMapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">Alamat Lengkap</h4>
                        <p className="text-gray-700 leading-relaxed">{school.address}</p>
                      </div>
                    </div>
                  </div>
                  {school.coordinates && (
                    <div className="bg-white rounded-2xl p-6 border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                          <IconMapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-2">Koordinat GPS</h4>
                          <p className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {school.coordinates.lat}, {school.coordinates.lng}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map View */}
              {school.coordinates && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl p-8 border-2 border-green-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <IconMapPin className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Lokasi Sekolah</h3>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-green-200">
                    <MapView
                      latitude={school.coordinates.lat}
                      longitude={school.coordinates.lng}
                      title={school.name}
                      description={`${school.level} - ${school.district}`}
                      height="400px"
                      className=""
                    />
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-2xl p-8 border-2 border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <IconCalendar className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Status Program</h3>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Program Makan Bergizi Gratis</h4>
                        <p className="text-sm text-gray-600 font-medium">
                          Aktif sejak {formatDate(school.programStartDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(school.status)}`}>
                      {school.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* {activeTab === 'sppg' && sppg && (
            <SPPGDetail sppg={sppg} />
          )} */}


          {activeTab === 'distribution' && school.sppgId && (
            <DistributionDetail sppgId={school.sppgId} schoolId={school.id} />
          )}

          {activeTab === 'distribution' && !school.sppgId && (
            <div className="text-center py-12">
              <IconTruck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">SPPG Tidak Terhubung</h3>
              <p className="text-gray-600">
                Sekolah ini belum terhubung dengan SPPG, sehingga tidak ada data distribusi.
              </p>
            </div>
          )}

          {activeTab === 'reports' && (
            <SchoolReportsTab schoolId={school.id} />
          )}
        </div>
      </div>
    </div>
  );
}
