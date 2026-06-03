'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconUsers, IconCalendar, IconChefHat, IconTruck } from '@tabler/icons-react';
import { Group, SPPG, getGroupSPPGs } from '@/lib/api-client';
import GroupSPPGDetail from './GroupSPPGDetail';
import GroupDistributionDetail from './GroupDistributionDetail';
import MapView from '@/components/shared/MapView';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/shared/Skeleton';

interface GroupDetailProps {
  group: Group;
}

export default function GroupDetail({ group }: GroupDetailProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'info' | 'sppg' | 'distribution'>('info');
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [selectedSppg, setSelectedSppg] = useState<SPPG | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'sppg', 'distribution'].includes(tab)) {
      setActiveTab(tab as 'info' | 'sppg' | 'distribution');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const sppgData = await getGroupSPPGs(group.id);
        setSppgs(sppgData);
        // Set first SPPG as selected by default
        if (sppgData.length > 0) {
          setSelectedSppg(sppgData[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [group.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-4">
            <Skeleton variant="text" className="w-48" />
            <Skeleton variant="rectangular" height={180} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Group Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-green-600 px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <IconUsers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                  <p className="text-green-100 text-lg">Kelompok Masyarakat</p>
                </div>
              </div>
              {group.description && (
                <p className="text-green-100">{group.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Kelompok
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Group Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <IconUsers className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Jenis</h3>
                <p className="text-gray-600">Kelompok Masyarakat</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <IconCalendar className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Status Program</h3>
                <p className="text-gray-600">Aktif</p>
              </div>
            </div>
          </div>

          {/* SPPG Preview */}
          {sppgs.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconChefHat className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Dapur Penyedia (SPPG)</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {sppgs.length} SPPG
                </span>
              </div>
              
              {/* SPPG List */}
              <div className="space-y-3">
                {sppgs.map((sppg) => (
                  <div key={sppg.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{sppg.name}</h4>
                        <p className="text-sm text-gray-600">{sppg.type} • {(sppg.capacity || 0).toLocaleString()} porsi/hari</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSppg(sppg);
                          setActiveTab('sppg');
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSppg(sppg);
                          setActiveTab('distribution');
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Distribusi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Informasi Kelompok
            </button>
            <button
              onClick={() => setActiveTab('sppg')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sppg'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detail SPPG
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'distribution'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Distribusi Porsi
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kelompok</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <IconUsers className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Jenis</h4>
                      <p className="text-gray-600">Kelompok Masyarakat</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <IconCalendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Status Program</h4>
                      <p className="text-gray-600">Aktif</p>
                    </div>
                  </div>
                </div>
                {group.description && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Deskripsi</h4>
                    <p className="text-gray-600">{group.description}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Makan Bergizi Gratis</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Kelompok Penerima Manfaat</h4>
                      <p className="text-sm text-gray-600">Menerima program makan bergizi gratis</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sppg' && selectedSppg && (
            <GroupSPPGDetail sppg={selectedSppg} />
          )}

          {activeTab === 'sppg' && !selectedSppg && sppgs.length === 0 && (
            <div className="text-center py-12">
              <IconChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">SPPG Tidak Terhubung</h3>
              <p className="text-gray-600">
                Kelompok ini belum terhubung dengan SPPG.
              </p>
            </div>
          )}

          {activeTab === 'distribution' && selectedSppg && (
            <GroupDistributionDetail sppgId={selectedSppg.id} groupId={group.id} />
          )}

          {activeTab === 'distribution' && !selectedSppg && sppgs.length === 0 && (
            <div className="text-center py-12">
              <IconTruck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">SPPG Tidak Terhubung</h3>
              <p className="text-gray-600">
                Kelompok ini belum terhubung dengan SPPG, sehingga tidak ada data distribusi.
              </p>
            </div>
          )}

          {activeTab === 'distribution' && sppgs.length > 0 && !selectedSppg && (
            <div className="text-center py-12">
              <IconChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih SPPG</h3>
              <p className="text-gray-600">
                Pilih SPPG dari daftar di atas untuk melihat data distribusi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
