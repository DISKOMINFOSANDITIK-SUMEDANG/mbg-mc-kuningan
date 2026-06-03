'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { IconChefHat, IconBuilding, IconUser, IconCertificate, IconPhoto, IconPlus, IconEdit, IconTrash, IconArrowLeft } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import SPPGFacilities from '@/components/cms/sppgs/SPPGFacilities';
import SPPGNutritionist from '@/components/cms/sppgs/SPPGNutritionist';
import SPPGSLHSCertificate from '@/components/cms/sppgs/SPPGSLHSCertificate';
import SPPGKitchenPhotos from '@/components/cms/sppgs/SPPGKitchenPhotos';
import FileDisplay from '@/components/cms/shared/FileDisplay';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
interface SPPG {
  id: string;
  id_sppg?: string;
  name: string;
  type: string;
  capacity?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  address?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
  kitchen_photo_url?: string;
  foundation_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function SPPGDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [sppg, setSppg] = useState<SPPG | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'facilities' | 'nutritionist' | 'slhs' | 'kitchen-photos'>('info');

  useEffect(() => {
    const loadSppg = async () => {
      if (!params.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${params.id}`));
        if (!response.ok) {
          throw new Error('Failed to fetch SPPG');
        }
        const data = await response.json();
        setSppg(data);
      } catch (error) {
        console.error('Error loading SPPG:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSppg();
  }, [params.id]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'facilities', 'nutritionist', 'slhs', 'kitchen-photos'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dapur Satelit Modular':
        return 'bg-blue-100 text-blue-800';
      case 'Dapur Konvensional':
        return 'bg-green-100 text-green-800';
      case 'Dapur Pusat':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data..." />
      </CMSLayout>
    );
  }

  if (!sppg) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">SPPG Tidak Ditemukan</h3>
        <p className="text-gray-600">SPPG yang Anda cari tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sppg.name}</h1>
                <p className="text-gray-600">Kelola detail SPPG dan data terkait</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(sppg.type)}`}>
              {sppg.type}
            </span>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconBuilding className="h-5 w-5 inline mr-2" />
                  Informasi Dasar
                </button>
                <button
                  onClick={() => setActiveTab('facilities')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'facilities'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconChefHat className="h-5 w-5 inline mr-2" />
                  Fasilitas
                </button>
                <button
                  onClick={() => setActiveTab('nutritionist')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'nutritionist'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconUser className="h-5 w-5 inline mr-2" />
                  Ahli Gizi
                </button>
                <button
                  onClick={() => setActiveTab('slhs')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'slhs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconCertificate className="h-5 w-5 inline mr-2" />
                  Sertifikat SLHS
                </button>
                <button
                  onClick={() => setActiveTab('kitchen-photos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'kitchen-photos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconPhoto className="h-5 w-5 inline mr-2" />
                  Foto Dapur
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Informasi Dasar</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">ID SPPG</label>
                          <p className="text-gray-900 font-mono">{sppg.id_sppg || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nama SPPG</label>
                          <p className="text-gray-900">{sppg.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tipe</label>
                          <p className="text-gray-900">{sppg.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Kapasitas</label>
                          <p className="text-gray-900">{(sppg.capacity || 0).toLocaleString()} porsi/hari</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Lokasi</label>
                          <p className="text-gray-900">{sppg.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Kontak & Operasional</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Telepon</label>
                          <p className="text-gray-900">{sppg.phone || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{sppg.email || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Jam Operasional</label>
                          <p className="text-gray-900">
                            {sppg.operating_hours_start && sppg.operating_hours_end
                              ? `${sppg.operating_hours_start} - ${sppg.operating_hours_end}`
                              : '-'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Alamat</label>
                          <p className="text-gray-900">{sppg.address || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {sppg.kitchen_photo_url && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Foto Dapur</h3>
                      <FileDisplay
                        url={sppg.kitchen_photo_url}
                        type="image"
                        className="w-full h-64"
                        showDownload={true}
                        showExternal={true}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'facilities' && (
                <SPPGFacilities sppgId={sppg.id} />
              )}

              {activeTab === 'nutritionist' && (
                <SPPGNutritionist sppgId={sppg.id} />
              )}

              {activeTab === 'slhs' && (
                <SPPGSLHSCertificate sppgId={sppg.id} />
              )}

              {activeTab === 'kitchen-photos' && (
                <SPPGKitchenPhotos sppgId={sppg.id} />
              )}
            </div>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
