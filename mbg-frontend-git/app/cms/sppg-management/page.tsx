'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconChefHat,
  IconBuilding,
  IconUser,
  IconCertificate,
  IconPhoto,
  IconArrowRight,
  IconChevronRight,
  IconPhone,
  IconToolsKitchen2,
  IconMapPin,
  IconCheck,
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

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
  foundation_id?: string;
  email?: string;
  address?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
  kitchen_photo_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Dapur Satelit Modular': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Dapur Konvensional':   { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Dapur Pusat':          { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const MANAGEMENT_SECTIONS = [
  {
    id: 'info',
    title: 'Informasi Dasar',
    description: 'Kelola informasi dasar SPPG seperti nama, tipe, kapasitas, dan kontak',
    icon: IconBuilding,
    color: { container: 'bg-blue-100', icon: 'text-blue-600', border: 'hover:border-blue-300 hover:shadow-blue-100' },
    badge: null,
    href: '',
  },
  {
    id: 'facilities',
    title: 'Fasilitas',
    description: 'Kelola fasilitas dan peralatan yang tersedia di SPPG',
    icon: IconChefHat,
    color: { container: 'bg-green-100', icon: 'text-green-600', border: 'hover:border-green-300 hover:shadow-green-100' },
    badge: null,
    href: '',
  },
  {
    id: 'nutritionist',
    title: 'Ahli Gizi',
    description: 'Kelola data ahli gizi yang bertugas di SPPG',
    icon: IconUser,
    color: { container: 'bg-purple-100', icon: 'text-purple-600', border: 'hover:border-purple-300 hover:shadow-purple-100' },
    badge: null,
    href: '',
  },
  {
    id: 'slhs',
    title: 'Sertifikat SLHS',
    description: 'Kelola sertifikat Sanitasi, Higienis, dan Keamanan Pangan',
    icon: IconCertificate,
    color: { container: 'bg-amber-100', icon: 'text-amber-600', border: 'hover:border-amber-300 hover:shadow-amber-100' },
    badge: null,
    href: '',
  },
  {
    id: 'kitchen-photos',
    title: 'Foto Dapur',
    description: 'Kelola foto-foto dapur dan dokumentasi visual',
    icon: IconPhoto,
    color: { container: 'bg-pink-100', icon: 'text-pink-600', border: 'hover:border-pink-300 hover:shadow-pink-100' },
    badge: null,
    href: '',
  },
];

export default function SPPGManagementPage() {
  const [sppg, setSppg] = useState<SPPG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    const loadMySppg = async () => {
      setLoading(true);
      setError(null);
      try {
        const userResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), {
          credentials: 'include',
        });
        if (!userResponse.ok) throw new Error('Gagal memuat data pengguna');

        const userData = await userResponse.json();
        if (!userData.sppg_id) {
          setError('Anda tidak memiliki SPPG yang terkait dengan akun ini');
          return;
        }

        const sppgResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${userData.sppg_id}`), {
          credentials: 'include',
        });
        if (!sppgResponse.ok) throw new Error('Gagal memuat data SPPG');

        const sppgData = await sppgResponse.json();
        setSppg(sppgData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data SPPG');
      } finally {
        setLoading(false);
      }
    };
    loadMySppg();
  }, []);

  const handleToggleSPPGStatus = async () => {
    if (!sppg || statusUpdating) return;

    const nextStatus = !(sppg.is_active ?? true);
    setStatusUpdating(true);
    setStatusError(null);

    try {
      const payload = {
        id_sppg: sppg.id_sppg,
        name: sppg.name,
        type: sppg.type,
        capacity: sppg.capacity,
        location: sppg.location,
        latitude: sppg.latitude,
        longitude: sppg.longitude,
        phone: sppg.phone,
        email: sppg.email,
        address: sppg.address,
        operating_hours_start: sppg.operating_hours_start,
        operating_hours_end: sppg.operating_hours_end,
        foundation_id: sppg.foundation_id,
        is_active: nextStatus,
      };

      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppg.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sanitizedPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memperbarui status SPPG');
      }

      const updatedSPPG = await response.json();
      setSppg((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...updatedSPPG,
          is_active: typeof updatedSPPG?.is_active === 'boolean' ? updatedSPPG.is_active : nextStatus,
        };
      });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui status SPPG');
    } finally {
      setStatusUpdating(false);
    }
  };

  const typeStyle = sppg ? (TYPE_STYLES[sppg.type] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' }) : null;

  // Enrich sections with dynamic hrefs after sppg loads
  const sections = MANAGEMENT_SECTIONS.map((s) => ({
    ...s,
    href: sppg ? `/cms/sppg-management/${sppg.id}?tab=${s.id}` : '#',
  }));

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Dapat Memuat Data SPPG</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      </CMSLayout>
    );
  }

  if (!sppg) return null;

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">

          {/* ── Breadcrumbs ── */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/cms" className="hover:text-gray-600 transition-colors">Dashboard</Link>
            <IconChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-700 font-medium">Kelola SPPG</span>
          </nav>

          {/* ── Profile Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            {/* Subtle decorative blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

            <div className="relative px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                {/* Left: identity */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
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

                {/* Right: stat widgets + CTA */}
                <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
                  {/* Active/Inactive toggle */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm min-w-[190px]">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Status SPPG</p>
                      <p className={`text-sm font-semibold ${(sppg.is_active ?? true) ? 'text-emerald-700' : 'text-red-700'}`}>
                        {(sppg.is_active ?? true) ? 'Aktif' : 'Nonaktif'}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sppg.is_active ?? true}
                      aria-label="Ubah status aktif SPPG"
                      onClick={handleToggleSPPGStatus}
                      disabled={statusUpdating}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        disabled:cursor-not-allowed disabled:opacity-70
                        ${(sppg.is_active ?? true) ? 'bg-emerald-500' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm
                          ${(sppg.is_active ?? true) ? 'translate-x-5' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Capacity stat */}
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

                  {/* Phone CTA */}
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

          {statusError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{statusError}</p>
            </div>
          )}

          {/* ── Section Title ── */}
          <div>
            <h2 className="text-base font-semibold text-gray-900">Manajemen Dapur</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pilih kategori untuk mengelola data SPPG Anda</p>
          </div>

          {/* ── Management Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sections.map((section) => {
              const IconComponent = section.icon;
              const { container, icon, border } = section.color;

              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`
                    group relative flex items-start gap-4
                    bg-white rounded-2xl border border-gray-200 p-5
                    hover:shadow-lg ${border}
                    hover:scale-[1.015] hover:-translate-y-0.5
                    transition-all duration-200 cursor-pointer
                  `}
                >
                  {/* Icon bubble */}
                  <div className={`w-12 h-12 rounded-2xl ${container} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                    <IconComponent className={`h-6 w-6 ${icon}`} />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {section.title}
                      </h3>
                      {section.badge && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                          <IconCheck className="h-3 w-3" />
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {section.description}
                    </p>
                  </div>

                  {/* Arrow button */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:shadow-md transition-all duration-200">
                      <IconArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
