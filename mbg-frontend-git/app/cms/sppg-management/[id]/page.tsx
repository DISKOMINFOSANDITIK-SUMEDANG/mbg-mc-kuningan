'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  IconChefHat,
  IconBuilding,
  IconUser,
  IconCertificate,
  IconPhoto,
  IconArrowLeft,
  IconChevronRight,
  IconPhone,
  IconToolsKitchen2,
  IconMapPin,
  IconPencil,
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import SPPGFacilities from '@/components/cms/sppgs/SPPGFacilities';
import SPPGNutritionist from '@/components/cms/sppgs/SPPGNutritionist';
import SPPGSLHSCertificate from '@/components/cms/sppgs/SPPGSLHSCertificate';
import SPPGKitchenPhotos from '@/components/cms/sppgs/SPPGKitchenPhotos';
import SPPGBasicInfoForm from '@/components/cms/sppgs/SPPGBasicInfoForm';
import FileDisplay from '@/components/cms/shared/FileDisplay';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface SPPG {
  id: string;
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

type TabId = 'info' | 'facilities' | 'nutritionist' | 'slhs' | 'kitchen-photos';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'info',            label: 'Informasi Dasar', icon: IconBuilding    },
  { id: 'facilities',      label: 'Fasilitas',        icon: IconChefHat     },
  { id: 'nutritionist',    label: 'Ahli Gizi',       icon: IconUser        },
  { id: 'slhs',            label: 'Sertifikat SLHS', icon: IconCertificate },
  { id: 'kitchen-photos',  label: 'Foto Dapur',      icon: IconPhoto       },
];

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Dapur Satelit Modular': { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'Dapur Konvensional':     { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  'Dapur Pusat':            { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export default function SPPGManagementDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [sppg, setSppg] = useState<SPPG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [userSppgId, setUserSppgId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadUserAndSppg = async () => {
      setLoading(true);
      setError(null);
      try {
        const userResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), { credentials: 'include' });
        if (!userResponse.ok) throw new Error('Gagal memuat data pengguna');

        const userData = await userResponse.json();
        if (!userData.sppg_id) {
          setError('Anda tidak memiliki SPPG yang terkait dengan akun ini');
          return;
        }
        if (userData.sppg_id !== params.id) {
          setError('Anda hanya dapat mengelola SPPG yang terkait dengan akun Anda');
          return;
        }

        setUserSppgId(userData.sppg_id);

        const sppgResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${params.id}`), { credentials: 'include' });
        if (!sppgResponse.ok) throw new Error('Gagal memuat data SPPG');

        const sppgData = await sppgResponse.json();
        setSppg(sppgData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data SPPG');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadUserAndSppg();
  }, [params.id]);

  // Sync tab from URL query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams]);

  const handleEditSuccess = (updatedSppg: SPPG) => {
    setSppg(updatedSppg);
    setIsEditing(false);
  };

  const typeStyle = sppg ? (TYPE_STYLES[sppg.type] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' }) : null;

  if (loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </CMSLayout>
    );
  }

  if (error) {
    return (
      <CMSLayout>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <IconChefHat className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Dapat Mengakses SPPG</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Coba Lagi
            </button>
            <Link
              href="/cms/sppg-management"
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Kembali
            </Link>
          </div>
        </div>
      </CMSLayout>
    );
  }

  if (!sppg) return null;

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>

        {/* ── Breadcrumbs ── */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/cms" className="hover:text-gray-600 transition-colors">Dashboard</Link>
          <IconChevronRight className="h-3.5 w-3.5" />
          <Link href="/cms/sppg-management" className="hover:text-gray-600 transition-colors">Kelola SPPG</Link>
          <IconChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-700 font-medium">{sppg.name}</span>
        </nav>

        {/* ── Profile Header ── */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 shadow-sm mt-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

          <div className="relative px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

              {/* Identity */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <IconChefHat className="h-7 w-7 text-white" />
                  </div>
                  {typeStyle && (
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${typeStyle.dot}`} />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-gray-900">{sppg.name}</h1>
                    {typeStyle && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeStyle.bg} ${typeStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                        {sppg.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <IconMapPin className="h-3.5 w-3.5" />
                    <span>{sppg.location}</span>
                  </div>
                </div>
              </div>

              {/* Stat widgets */}
              <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm min-w-[160px]">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <IconToolsKitchen2 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Kapasitas</p>
                    <p className="text-base font-bold text-gray-900 leading-tight">
                      {(sppg.capacity ?? 0).toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-gray-400 ml-1">porsi/hari</span>
                    </p>
                  </div>
                </div>

                {sppg.phone && (
                  <a
                    href={`tel:${sppg.phone}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <IconPhone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>{sppg.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-2 border-b border-gray-100">
              <nav className="flex gap-1 overflow-x-auto scrollbar-none">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                        whitespace-nowrap transition-all duration-150 shrink-0
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ── Tab Content ── */}
            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {isEditing ? (
                    <SPPGBasicInfoForm
                      sppg={sppg}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">Informasi Dasar SPPG</h3>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
                        >
                          <IconPencil className="h-4 w-4" />
                          Edit Informasi
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card: Informasi Dasar */}
                        <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-5 space-y-4">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informasi Dasar</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Nama SPPG',         value: sppg.name },
                              { label: 'Tipe',              value: sppg.type },
                              { label: 'Kapasitas',        value: `${(sppg.capacity ?? 0).toLocaleString('id-ID')} porsi/hari` },
                              { label: 'Lokasi',            value: sppg.location },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card: Kontak & Operasional */}
                        <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-5 space-y-4">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Kontak &amp; Operasional</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Telepon',           value: sppg.phone || '-' },
                              { label: 'Email',             value: sppg.email || '-' },
                              {
                                label: 'Jam Operasional',
                                value: sppg.operating_hours_start && sppg.operating_hours_end
                                  ? `${sppg.operating_hours_start} – ${sppg.operating_hours_end}`
                                  : '-',
                              },
                              { label: 'Alamat',            value: sppg.address || '-' },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {sppg.kitchen_photo_url && (
                        <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-5 space-y-4">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Foto Dapur</h4>
                          <FileDisplay
                            url={sppg.kitchen_photo_url}
                            type="image"
                            className="w-full h-56 rounded-xl object-cover"
                            showDownload
                            showExternal
                          />
                        </div>
                      )}
                    </>
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
