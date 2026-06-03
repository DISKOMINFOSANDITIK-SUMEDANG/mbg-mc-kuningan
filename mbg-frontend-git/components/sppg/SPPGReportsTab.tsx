'use client';

import React, { useState, useEffect } from 'react';
import { 
  IconCalendar, 
  IconSchool, 
  IconChevronDown, 
  IconChevronUp,
  IconMapPin,
  IconClock,
  IconPhoto,
  IconUsers,
  IconAlertCircle,
  IconDownload,
  IconZoomIn
} from '@tabler/icons-react';
import Image from 'next/image';

interface School {
  id: string;
  name: string;
  level: string;
  address: string;
  district: string;
  village: string;
  student_count: number;
}

interface MBGReport {
  id: string;
  report_date: string;
  menu_photo_url: string;
  students_photo_url: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  device_timestamp: string;
  created_at: string;
  schools: School;
  is_rapel?: boolean;
  rapel_start_date?: string;
  rapel_end_date?: string;
}

interface SPPGReportsTabProps {
  sppgId: string;
}

// Utility function to get today's date in YYYY-MM-DD format (Indonesia timezone)
const getTodayDate = (): string => {
  const today = new Date();
  const indonesiaTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
  const year = indonesiaTime.getUTCFullYear();
  const month = String(indonesiaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(indonesiaTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SPPGReportsTab({ sppgId }: SPPGReportsTabProps) {
  const [reports, setReports] = useState<MBGReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/sppg/${sppgId}/reports?date=${selectedDate}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        
        const data = await response.json();
        setReports(data.reports || []);

        // Fetch location names for reports with coordinates
        const reportsWithCoords = (data.reports || []).filter(
          (r: MBGReport) => r.latitude && r.longitude
        );
        
        if (reportsWithCoords.length > 0) {
          const locations: Record<string, string> = {};
          
          for (const report of reportsWithCoords) {
            try {
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.latitude}&lon=${report.longitude}&accept-language=id`
              );
              const geoData = await geoResponse.json();
              
              if (geoData && geoData.display_name) {
                locations[report.id] = geoData.display_name;
              }
            } catch (error) {
              console.error('Error fetching location name:', error);
            }
          }
          
          setLocationNames(locations);
        }
      } catch (err) {
        console.error('Error fetching SPPG reports:', err);
        setError('Gagal memuat data laporan');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [sppgId, selectedDate]);

  const toggleReport = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const openLightbox = (images: string[], index: number) => {
    setCurrentImages(images);
    setPhotoIndex(index);
    setLightboxOpen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const changePhoto = (newIndex: number) => {
    setPhotoIndex(newIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `foto-laporan-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <IconSchool className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Laporan Harian Sekolah</h3>
            </div>
            <p className="text-sm text-gray-600 ml-12">
              Daftar sekolah yang sudah melaporkan pada tanggal yang dipilih
            </p>
          </div>
          <div className="relative group">
            <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5 group-hover:text-blue-600 transition-colors" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold bg-white hover:border-blue-300 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <IconAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconSchool className="h-10 w-10 text-gray-400" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-3">Tidak Ada Laporan</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            Belum ada sekolah yang melaporkan pada tanggal {formatDate(selectedDate)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{reports.length}</span>
            </div>
            <span className="text-sm font-semibold text-blue-900">Laporan ditemukan pada tanggal ini</span>
          </div>
          
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleReport(report.id)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                    <IconSchool className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">
                      {report.schools.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                        <IconMapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{report.schools.district}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                        <IconClock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatTime(report.created_at)}</span>
                      </span>
                      {report.is_rapel && report.rapel_start_date && report.rapel_end_date && (
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm">
                          <IconCalendar className="h-3.5 w-3.5" />
                          Rapel: {formatDate(report.rapel_start_date)} - {formatDate(report.rapel_end_date)}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                        {report.schools.level}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  {expandedReportId === report.id ? (
                    <IconChevronUp className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  ) : (
                    <IconChevronDown className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              {expandedReportId === report.id && (
                <div className="border-t-2 border-blue-100 bg-gradient-to-br from-gray-50 to-blue-50/30">
                  <div className="p-8 space-y-6">
                    {/* Rapel Information Banner */}
                    {report.is_rapel && report.rapel_start_date && report.rapel_end_date && (
                      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
                            <IconCalendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-orange-900 text-lg mb-2 flex items-center gap-2">
                              Laporan Menu Rapel (Periode Tertentu)
                            </h5>
                            <div className="space-y-2 text-sm text-orange-800">
                              <p className="font-semibold">
                                Periode: <span className="text-orange-900 font-bold">{formatDate(report.rapel_start_date)}</span> sampai <span className="text-orange-900 font-bold">{formatDate(report.rapel_end_date)}</span>
                              </p>
                              <p className="text-orange-700 leading-relaxed">
                                Laporan ini mencakup menu untuk rentang waktu di atas. Tidak ada laporan harian terpisah untuk tanggal-tanggal tersebut.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* School Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <IconSchool className="h-5 w-5 text-white" />
                          </div>
                          <h5 className="font-bold text-gray-900 text-lg">Informasi Sekolah</h5>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Alamat:</span>
                            <p className="text-gray-900 font-medium">{report.schools.address}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Kecamatan:</span>
                            <p className="text-gray-900 font-medium">{report.schools.district}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Desa:</span>
                            <p className="text-gray-900 font-medium">{report.schools.village}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconUsers className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-900 font-medium">
                              {report.schools.student_count} siswa
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 border-2 border-green-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                            <IconClock className="h-5 w-5 text-white" />
                          </div>
                          <h5 className="font-bold text-gray-900 text-lg">Waktu Laporan</h5>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Tanggal:</span>
                            <p className="text-gray-900 font-medium">{formatDate(report.report_date)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Waktu Upload:</span>
                            <p className="text-gray-900 font-medium">
                              {formatTime(report.created_at)}
                            </p>
                          </div>
                          {report.latitude && report.longitude && (
                            <div>
                              <span className="text-gray-600">Koordinat:</span>
                              <p className="text-gray-900 font-medium text-xs">
                                {Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}
                              </p>
                              {report.location_accuracy && (
                                <p className="text-gray-500 text-xs">
                                  Akurasi: ±{Number(report.location_accuracy).toFixed(0)}m
                                </p>
                              )}
                              {locationNames[report.id] && (
                                <div className="mt-2">
                                  <span className="text-gray-600">Lokasi:</span>
                                  <p className="text-gray-900 font-medium text-xs leading-relaxed">
                                    {locationNames[report.id]}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photos */}
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                          <IconPhoto className="h-5 w-5 text-white" />
                        </div>
                        <h5 className="font-bold text-gray-900 text-lg">Foto Laporan</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Menu Photo */}
                        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-3 border-b-2 border-purple-100">
                            <p className="text-sm font-bold text-purple-900 flex items-center gap-2">
                              <IconPhoto className="h-4 w-4" />
                              Foto Menu
                            </p>
                          </div>
                          <div 
                            className="relative w-full h-80 bg-gray-100 cursor-pointer overflow-hidden"
                            onClick={() => openLightbox([report.menu_photo_url, report.students_photo_url], 0)}
                          >
                            <Image
                              src={report.menu_photo_url}
                              alt="Foto Menu"
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                              <div className="flex gap-3">
                                <div className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2">
                                  <IconZoomIn className="h-4 w-4" />
                                  Lihat
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(report.menu_photo_url);
                                  }}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                  <IconDownload className="h-4 w-4" />
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Students Photo */}
                        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-3 border-b-2 border-purple-100">
                            <p className="text-sm font-bold text-purple-900 flex items-center gap-2">
                              <IconUsers className="h-4 w-4" />
                              Foto Siswa
                            </p>
                          </div>
                          <div 
                            className="relative w-full h-80 bg-gray-100 cursor-pointer overflow-hidden"
                            onClick={() => openLightbox([report.menu_photo_url, report.students_photo_url], 1)}
                          >
                            <Image
                              src={report.students_photo_url}
                              alt="Foto Siswa"
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                              <div className="flex gap-3">
                                <div className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2">
                                  <IconZoomIn className="h-4 w-4" />
                                  Lihat
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(report.students_photo_url);
                                  }}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                  <IconDownload className="h-4 w-4" />
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Lightbox Modal */}
      {lightboxOpen && currentImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm z-50"
            >
              <span className="text-2xl">×</span>
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={zoom >= 3}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm shadow-lg"
              >
                <IconZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={zoom <= 1}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm shadow-lg"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-medium backdrop-blur-sm">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImage(currentImages[photoIndex]);
              }}
              className="absolute top-4 right-20 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm z-50 shadow-lg"
            >
              <IconDownload className="h-5 w-5" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              {photoIndex + 1} / {currentImages.length}
            </div>

            {/* Previous Button */}
            {currentImages.length > 1 && photoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changePhoto(photoIndex - 1);
                }}
                className="absolute left-4 bottom-1/2 transform translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm"
              >
                <IconChevronUp className="h-6 w-6 rotate-[-90deg]" />
              </button>
            )}

            {/* Image Container */}
            <div 
              className="relative max-w-full max-h-[85vh] flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
            >
              <img
                src={currentImages[photoIndex]}
                alt={`Preview ${photoIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                draggable={false}
              />
            </div>

            {/* Next Button */}
            {currentImages.length > 1 && photoIndex < currentImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changePhoto(photoIndex + 1);
                }}
                className="absolute right-4 bottom-1/2 transform translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm"
              >
                <IconChevronUp className="h-6 w-6 rotate-90" />
              </button>
            )}

            {/* Image Title */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm max-w-md text-center">
              {photoIndex === 0 ? 'Foto Menu' : 'Foto Siswa'}
              {zoom > 1 && <span className="ml-2 text-xs opacity-75">(Drag untuk menggeser)</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
