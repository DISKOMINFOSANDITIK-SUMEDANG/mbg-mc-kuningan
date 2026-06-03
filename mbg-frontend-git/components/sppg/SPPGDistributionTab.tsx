'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { IconSearch, IconCalendar, IconBuilding, IconMapPin, IconChevronDown, IconChevronUp, IconChefHat, IconNotes, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { SPPG } from '@/lib/data';
import Image from 'next/image';

interface MenuItem {
  name: string;
  description?: string;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Distribution {
  id: string;
  distribution_date: string;
  portions: number;
  school_id: string;
  school_name: string;
  school_level: string;
  school_address: string;
  menu_name: string;
  menu_image?: string;
  total_calories: number;
  notes?: string;
  menu_items?: MenuItem[];
}

interface SPPGDistributionTabProps {
  sppg: SPPG;
}

export default function SPPGDistributionTab({ sppg }: SPPGDistributionTabProps) {
  // Get today's date in YYYY-MM-DD format - Indonesia timezone (UTC+7)
  const getTodayDate = () => {
    const today = new Date();
    const indonesiaTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
    const year = indonesiaTime.getUTCFullYear();
    const month = String(indonesiaTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(indonesiaTime.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(() => getTodayDate());
  const [error, setError] = useState<string | null>(null);
  const [expandedDistributionId, setExpandedDistributionId] = useState<string | null>(null);
  // State for photo lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxLabels, setLightboxLabels] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const openPhotoLightbox = (images: (string | null | undefined)[], title: string, startIndex = 0, customLabels?: string[]) => {
    const labels = customLabels || ['Foto Menu'];
    const validImages: string[] = [];
    const validLabels: string[] = [];
    images.forEach((img, i) => {
      if (img) {
        validImages.push(img);
        validLabels.push(labels[i] || `Foto ${i + 1}`);
      }
    });
    if (validImages.length === 0) return;
    setLightboxImages(validImages);
    setLightboxLabels(validLabels);
    setLightboxIndex(Math.min(startIndex, validImages.length - 1));
    setLightboxTitle(title);
    setLightboxOpen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setLightboxLabels([]);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const fetchDistributions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/sppgs/${sppg.id}/distributions`);
      if (!response.ok) {
        throw new Error('Failed to fetch distributions');
      }
      
      const data = await response.json();
      setDistributions(data);
    } catch (err) {
      console.error('Error fetching distributions:', err);
      setError('Gagal memuat data distribusi');
    } finally {
      setLoading(false);
    }
  }, [sppg.id]);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  const filterDistributions = useMemo(() => {
    return () => {
      let filtered = distributions;

      if (searchTerm) {
        filtered = filtered.filter(dist =>
          dist.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dist.menu_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (dateFilter) {
        filtered = filtered.filter(dist =>
          dist.distribution_date.startsWith(dateFilter)
        );
      }

      setFilteredDistributions(filtered);
    };
  }, [distributions, searchTerm, dateFilter]);

  useEffect(() => {
    filterDistributions();
  }, [filterDistributions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSchoolLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'sd':
        return 'bg-blue-100 text-blue-800';
      case 'smp':
        return 'bg-green-100 text-green-800';
      case 'sma':
        return 'bg-purple-100 text-purple-800';
      case 'smk':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleDistribution = (distributionId: string) => {
    setExpandedDistributionId(expandedDistributionId === distributionId ? null : distributionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data distribusi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchDistributions}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Distribusi</h2>
        <p className="text-gray-600">
          Riwayat distribusi makanan dari {sppg.name} ke sekolah-sekolah yang dilayani
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Sekolah atau Menu
            </label>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Masukkan nama sekolah atau menu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Tanggal
            </label>
            <div className="relative">
              <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || dateFilter !== getTodayDate()) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter(getTodayDate());
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Menampilkan {filteredDistributions.length} dari {distributions.length} distribusi
        </p>
        {filteredDistributions.length > 0 && (
          <p className="text-sm text-gray-600">
            Total porsi: {filteredDistributions.reduce((sum, dist) => sum + dist.portions, 0).toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* Distribution List */}
      {filteredDistributions.length > 0 ? (
        <div className="space-y-4">
          {filteredDistributions.map((distribution) => (
            <div
              key={distribution.id}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleDistribution(distribution.id)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <IconBuilding className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-900">{distribution.school_name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getSchoolLevelColor(distribution.school_level)}`}>
                        {distribution.school_level}
                      </span>
                      <span className="text-sm text-gray-600">{formatShortDate(distribution.distribution_date)}</span>
                      <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                        {distribution.portions} porsi
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {expandedDistributionId === distribution.id ? (
                    <IconChevronUp className="h-6 w-6 text-gray-400" />
                  ) : (
                    <IconChevronDown className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              {expandedDistributionId === distribution.id && (
                <div className="border-t-2 border-blue-100 bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
                  {/* School Info Section */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <IconBuilding className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{distribution.school_name}</h4>
                        <p className="text-sm text-gray-600">{distribution.school_address}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <IconMapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Sekolah {distribution.school_level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(distribution.distribution_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Section */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50/30 rounded-2xl p-6 border-2 border-orange-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <IconChefHat className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">Menu</h4>
                    </div>

                    {/* Menu Image, Nama Menu, dan Ringkasan Nutrisi */}
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      {/* Menu Image with Lightbox */}
                      <div className="flex-shrink-0 flex justify-center md:justify-start">
                        <div 
                          className="relative w-64 h-64 rounded-xl overflow-hidden border-2 border-orange-200 shadow-lg cursor-zoom-in group"
                          onClick={() => {
                            if (distribution.menu_image) {
                              openPhotoLightbox(
                                [distribution.menu_image],
                                distribution.school_name,
                                0,
                                ['Foto Menu']
                              );
                            }
                          }}
                        >
                          <Image
                            src={distribution.menu_image || 'https://placehold.co/400x300/4f46e5/ffffff?text=Menu+Sehat'}
                            alt={distribution.menu_name || 'Menu'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://placehold.co/256x256/cccccc/666666?text=Menu+Sehat';
                            }}
                          />
                          {distribution.menu_image && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <IconZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right column: Nama Menu + Ringkasan Nutrisi */}
                      <div className="flex-1 space-y-4">
                        {distribution.menu_name && (
                          <h5 className="text-xl font-semibold text-gray-900 mb-3">{distribution.menu_name}</h5>
                        )}

                        {/* Ringkasan Nutrisi (Totals) */}
                        <div className="bg-indigo-50 rounded-lg p-6">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Nutrisi</h5>
                          {(() => {
                            const items = distribution.menu_items || [];
                            const totals = items.reduce((acc, it) => {
                              acc.calories += it.nutritionInfo?.calories || 0;
                              acc.protein += Number(it.nutritionInfo?.protein || 0);
                              acc.carbs += Number(it.nutritionInfo?.carbs || 0);
                              acc.fat += Number(it.nutritionInfo?.fat || 0);
                              return acc;
                            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
                            return (
                              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="rounded-lg bg-white border border-indigo-100 p-4 text-center">
                                  <div className="text-xs uppercase tracking-wide text-indigo-600 mb-1">Total Kalori</div>
                                  <div className="text-2xl font-bold text-indigo-700">{totals.calories || distribution.total_calories}</div>
                                </div>
                                <div className="rounded-lg bg-white border border-green-100 p-4 text-center">
                                  <div className="text-xs uppercase tracking-wide text-green-600 mb-1">Total Protein</div>
                                  <div className="text-2xl font-bold text-green-700">{Math.round(totals.protein)}g</div>
                                </div>
                                <div className="rounded-lg bg-white border border-blue-100 p-4 text-center">
                                  <div className="text-xs uppercase tracking-wide text-blue-600 mb-1">Total Karbo</div>
                                  <div className="text-2xl font-bold text-blue-700">{Math.round(totals.carbs)}g</div>
                                </div>
                                <div className="rounded-lg bg-white border border-orange-100 p-4 text-center">
                                  <div className="text-xs uppercase tracking-wide text-orange-600 mb-1">Total Lemak</div>
                                  <div className="text-2xl font-bold text-orange-700">{Math.round(totals.fat)}g</div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Daftar Menu Items */}
                    {distribution.menu_items && distribution.menu_items.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">Detail Makanan <span className="text-gray-500 text-sm">(Total Item: {distribution.menu_items.length})</span></h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {distribution.menu_items.map((item, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <h6 className="font-medium text-gray-900">{item.name}</h6>
                                <span className="text-sm text-gray-600">{item.nutritionInfo.calories} kkal</span>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                                <span>Protein: {item.nutritionInfo.protein}g</span>
                                <span>Karbohidrat: {item.nutritionInfo.carbs}g</span>
                                <span>Lemak: {item.nutritionInfo.fat}g</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Catatan */}
                  {distribution.notes && (
                    <div className="bg-yellow-50 rounded-lg p-4 mt-6">
                      <div className="flex items-start space-x-2">
                        <IconNotes className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Catatan:</h4>
                          <p className="text-sm text-gray-700">{distribution.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconSearch className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data Distribusi</h3>
          <p className="text-gray-600">
            {searchTerm || dateFilter
              ? 'Tidak ditemukan distribusi yang sesuai dengan filter yang dipilih.'
              : 'Belum ada data distribusi untuk SPPG ini.'}
          </p>
          {(searchTerm || dateFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter(getTodayDate());
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Hapus Filter
            </button>
          )}
        </div>
      )}

      {/* Lightbox Modal - rendered via portal to cover everything */}
      {lightboxOpen && lightboxImages.length > 0 && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black" onClick={closeLightbox}>
          <div className="relative w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/50">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-none">{lightboxTitle}</h3>
                <span className="text-white/70 text-xs bg-white/10 px-2 py-1 rounded-full">
                  {lightboxLabels[lightboxIndex] || 'Foto'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <IconZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
                  className="px-2 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs font-medium"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <IconZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={closeLightbox}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
                  title="Tutup"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image Area */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                if (zoom > 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && zoom > 1) {
                  setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt={lightboxLabels[lightboxIndex] || 'Foto'}
                  className="max-w-[95vw] max-h-[calc(100vh-120px)] object-contain select-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Navigation */}
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={() => {
                    setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setLightboxIndex(i => (i + 1) % lightboxImages.length);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {lightboxImages.length > 1 && (
              <div className="flex items-center justify-center gap-3 px-4 py-3 bg-black/50">
                {lightboxImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLightboxIndex(i);
                      setZoom(1);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === lightboxIndex ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-medium">
                      {lightboxLabels[i]?.replace('Foto ', '') || ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
