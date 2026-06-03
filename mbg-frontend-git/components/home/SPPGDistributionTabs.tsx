'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSPPGDistributionDetails, SPPGDistributionDetail, getSPPGDistributionRecap, SPPGDistributionRecap } from '@/lib/api-client';
import { IconSearch, IconX, IconCalendar, IconDownload, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import * as XLSX from 'xlsx';

interface SPPGDistributionTabsProps {
  className?: string;
  focusNotReportedSppgSignal?: number;
}

// Utility function to get today's date in YYYY-MM-DD format (Indonesia timezone)
const getTodayDate = (): string => {
  const today = new Date();
  // Get date in Indonesia timezone (UTC+7)
  const indonesiaTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
  const year = indonesiaTime.getUTCFullYear();
  const month = String(indonesiaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(indonesiaTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SPPGDistributionTabs({ className = '', focusNotReportedSppgSignal }: SPPGDistributionTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'distributed' | 'notDistributed' | 'recap'>('distributed');
  
  // Initialize with today's date using the utility function
  const todayDate = getTodayDate();
  
  const [distributionData, setDistributionData] = useState<{
    distributed: SPPGDistributionDetail[];
    notDistributed: SPPGDistributionDetail[];
    selectedDate: string;
  }>({
    distributed: [],
    notDistributed: [],
    selectedDate: todayDate
  });

  // State for recap tab
  const [recapData, setRecapData] = useState<SPPGDistributionRecap[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapError, setRecapError] = useState<string | null>(null);
  
  // Get default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDate);

  useEffect(() => {
    if (!focusNotReportedSppgSignal) return;
    setActiveTab('notDistributed');
  }, [focusNotReportedSppgSignal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSPPGDistributionDetails(selectedDate);
        setDistributionData(data);
      } catch (err) {
        setError('Gagal memuat data laporan SPPG');
        console.error('Error fetching SPPG distribution details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab !== 'recap') {
      fetchData();
    }
  }, [selectedDate, activeTab]);

  // Fetch recap data when recap tab is active
  useEffect(() => {
    const fetchRecapData = async () => {
      if (activeTab !== 'recap') return;
      
      try {
        setRecapLoading(true);
        setRecapError(null);
        const data = await getSPPGDistributionRecap(dateRange.start, dateRange.end);
        setRecapData(data);
      } catch (err) {
        setRecapError('Gagal memuat data rekap laporan');
        console.error('Error fetching recap data:', err);
      } finally {
        setRecapLoading(false);
      }
    };

    fetchRecapData();
  }, [activeTab, dateRange]);

  const filteredData = useMemo(() => {
    if (activeTab === 'recap') {
      if (!searchQuery.trim()) {
        return recapData;
      }
      const query = searchQuery.toLowerCase();
      return recapData.filter(sppg => 
        sppg.name.toLowerCase().includes(query) ||
        sppg.type.toLowerCase().includes(query) ||
        sppg.location.toLowerCase().includes(query)
      );
    }

    const data = activeTab === 'distributed' ? distributionData.distributed : distributionData.notDistributed;
    
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter(sppg => 
      sppg.name.toLowerCase().includes(query) ||
      sppg.type.toLowerCase().includes(query) ||
      sppg.location.toLowerCase().includes(query) ||
      (sppg.capacity && sppg.capacity.toString().includes(query))
    );
  }, [activeTab, distributionData, searchQuery, recapData]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const toggleRowExpansion = (sppgId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sppgId)) {
        newSet.delete(sppgId);
      } else {
        newSet.add(sppgId);
      }
      return newSet;
    });
  };

  const handleExportToExcel = () => {
    if (recapData.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    // Prepare data for Excel
    const excelData = recapData.map((sppg, index) => ({
      'No': index + 1,
      'Nama SPPG': sppg.name,
      'Lokasi': sppg.location,
      'Jumlah Sekolah': sppg.totalReportingSchools,
      'Waktu Update Terakhir': sppg.lastUpdateTime ? new Date(sppg.lastUpdateTime).toLocaleString('id-ID') : '-',
      'Sekolah Pelapor': sppg.reportingSchools?.join(', ') || '-',
      'Jumlah Berapa Kali SPPG Update Distribusi': sppg.update_count,
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Laporan SPPG');

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama SPPG
      { wch: 25 },  // Lokasi
      { wch: 15 },  // Jumlah Sekolah
      { wch: 20 },  // Waktu Update Terakhir
      { wch: 50 },  // Sekolah Pelapor
      { wch: 15 },  // Jumlah Hari
    ];

    // Generate filename with date range
    const filename = `Rekap_Laporan_SPPG_${dateRange.start}_to_${dateRange.end}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
  };

  const handleRowClick = (sppgId: string) => {
    // Navigate to SPPG info page with reports tab as default when coming from "Sudah Terima Laporan" tab
    if (activeTab === 'distributed') {
      router.push(`/sppg-info/${sppgId}?tab=reports`);
    } else {
      router.push(`/sppg-info/${sppgId}`);
    }
  };

  if (loading && activeTab !== 'recap') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex space-x-4 mb-6">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Tab Headers dengan gradient */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('distributed')}
            className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'distributed'
                ? 'border-blue-600 text-blue-600 bg-blue-50 shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sudah Melaporkan ({distributionData.distributed.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notDistributed')}
            className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'notDistributed'
                ? 'border-orange-600 text-orange-600 bg-orange-50 shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {/* Belum Melaporkan ({distributionData.notDistributed.length}) */}
              Belum Melaporkan
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'recap'
                ? 'border-purple-600 text-purple-600 bg-purple-50 shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Rekap Update
            </div>
          </button>
        </div>
      </div>

      {/* Filters dengan design lebih modern */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter for distributed/notDistributed tabs */}
          {activeTab !== 'recap' && (
            <div className="relative group">
              <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
              />
            </div>
          )}

          {/* Date Range Filter for recap tab */}
          {activeTab === 'recap' && (
            <>
              <div className="relative group">
                <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
                  placeholder="Tanggal Mulai"
                />
              </div>
              <span className="flex items-center text-gray-400 font-medium">s/d</span>
              <div className="relative group">
                <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
                  placeholder="Tanggal Akhir"
                />
              </div>
              <button
                onClick={handleExportToExcel}
                disabled={recapData.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <IconDownload className="h-5 w-5" />
                Export Excel
              </button>
            </>
          )}

          {/* Search Filter */}
          <div className="relative flex-1 group">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari SPPG berdasarkan nama atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {searchQuery && (
          <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Menampilkan {filteredData.length} dari {
              activeTab === 'recap' 
                ? recapData.length 
                : activeTab === 'distributed' 
                  ? distributionData.distributed.length 
                  : distributionData.notDistributed.length
            } SPPG
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="p-6">
        {recapLoading && activeTab === 'recap' ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data rekap...</p>
          </div>
        ) : recapError && activeTab === 'recap' ? (
          <div className="text-center py-8">
            <p className="text-red-600">{recapError}</p>
          </div>
        ) : filteredData.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {activeTab === 'recap' ? (
                (filteredData as SPPGDistributionRecap[]).map((sppg, index) => (
                  <div key={sppg.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-sm font-bold text-blue-600 mb-1 cursor-pointer hover:text-blue-800 line-clamp-2"
                            onClick={() => handleRowClick(sppg.id)}
                          >
                            {index + 1}. {sppg.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {sppg.location}
                          </div>
                        </div>
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 whitespace-nowrap">
                          {sppg.totalReportingSchools} sekolah
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Waktu Update</div>
                          <div className="text-xs font-medium text-gray-900">
                            {sppg.lastUpdateTime ? (
                              <>
                                {new Date(sppg.lastUpdateTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                {' '}
                                {new Date(sppg.lastUpdateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Jumlah Update</div>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {sppg.update_count}x
                          </div>
                        </div>
                      </div>

                      {/* Reporting Schools */}
                      {sppg.reportingSchools && sppg.reportingSchools.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Sekolah Pelapor:</div>
                          <div className="flex flex-wrap gap-1">
                            {sppg.reportingSchools.slice(0, 2).map((school, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                title={school}
                              >
                                {school.length > 15 ? school.substring(0, 15) + '...' : school}
                              </span>
                            ))}
                            {sppg.totalReportingSchools > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">
                                +{sppg.totalReportingSchools - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Detail Button */}
                      {sppg.update_count > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(sppg.id);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            {expandedRows.has(sppg.id) ? (
                              <>
                                <IconChevronUp className="h-4 w-4" />
                                Tutup Detail
                              </>
                            ) : (
                              <>
                                <IconChevronDown className="h-4 w-4" />
                                Lihat Detail Distribusi
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Expanded Detail */}
                      {expandedRows.has(sppg.id) && sppg.distribution_dates && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Detail Distribusi:</div>
                          <div className="space-y-2">
                            {sppg.distribution_dates.map((dist, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                <span className="text-xs text-gray-700">
                                  {new Date(dist.date).toLocaleDateString('id-ID', { 
                                    day: '2-digit', 
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-xs font-semibold text-gray-900">
                                  {dist.portions.toLocaleString('id-ID')} porsi
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                (filteredData as SPPGDistributionDetail[]).map((sppg) => (
                  <div 
                    key={sppg.id} 
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleRowClick(sppg.id)}
                  >
                    <div className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                            {sppg.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {sppg.location}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Sekolah Melapor (MBG)</div>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {sppg.totalMBGReportingSchools} sekolah
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">SPPG Distribusikan</div>
                          {sppg.totalDistributedSchools > 0 ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {sppg.totalDistributedSchools} sekolah
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">Belum ada</div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Porsi (SPPG)</div>
                          {sppg.totalDistributions > 0 ? (
                            <div className="text-sm font-semibold text-gray-900">
                              {sppg.totalDistributions.toLocaleString('id-ID')}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">Belum ada</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Waktu Update</div>
                          <div className="text-xs font-medium text-gray-900">
                            {sppg.lastUpdateTime ? (
                              <>
                                {new Date(sppg.lastUpdateTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                {' '}
                                {new Date(sppg.lastUpdateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : '-'}
                          </div>
                        </div>
                      </div>

                      {/* MBG Reporting Schools */}
                      {sppg.mbgReportingSchools && sppg.mbgReportingSchools.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Sekolah MBG Reports:</div>
                          <div className="flex flex-wrap gap-1">
                            {sppg.mbgReportingSchools.slice(0, 2).map((school, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                title={school}
                              >
                                {school.length > 15 ? school.substring(0, 15) + '...' : school}
                              </span>
                            ))}
                            {sppg.totalMBGReportingSchools > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">
                                +{sppg.totalMBGReportingSchools - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Distributed Schools */}
                      {sppg.distributedSchools && sppg.distributedSchools.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Sekolah Distribusi SPPG:</div>
                          <div className="flex flex-wrap gap-1">
                            {sppg.distributedSchools.slice(0, 2).map((school, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                title={school}
                              >
                                {school.length > 15 ? school.substring(0, 15) + '...' : school}
                              </span>
                            ))}
                            {sppg.totalDistributedSchools > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-semibold">
                                +{sppg.totalDistributedSchools - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
            <div className="max-h-[700px] overflow-y-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {activeTab === 'recap' && (
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16 border-b-2 border-gray-300">
                        No
                      </th>
                    )}
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[300px] border-b-2 border-gray-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Nama SPPG</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider max-w-[180px] border-b-2 border-gray-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Lokasi</span>
                      </div>
                    </th>
                    {activeTab !== 'recap' ? (
                      <>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Sekolah Melapor<br/>(MBG Reports)</span>
                          </div>
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>SPPG<br/>Distribusikan</span>
                          </div>
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Total Porsi</span>
                          </div>
                        </th>
                      </>
                    ) : (
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>Jumlah Sekolah<br/>Yang Melapor</span>
                        </div>
                      </th>
                    )}
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Waktu Update</span>
                      </div>
                    </th>
                    {activeTab === 'recap' ? (
                      <>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px] border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Sekolah Pelapor</span>
                          </div>
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Jumlah Update<br/>Distribusi</span>
                          </div>
                        </th>
                       
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Detail</span>
                          </div>
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px] border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Daftar Sekolah<br/>MBG Reports</span>
                          </div>
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px] border-b-2 border-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Daftar Sekolah<br/>Distribusi SPPG</span>
                          </div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === 'recap' ? (
                  (filteredData as SPPGDistributionRecap[]).map((sppg, index) => (
                    <React.Fragment key={sppg.id}>
                      <tr className="hover:bg-blue-50/30 transition-all duration-200 group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{index + 1}</div>
                        </td>
                        <td 
                          className="px-6 py-5 cursor-pointer min-w-[300px]"
                          onClick={() => handleRowClick(sppg.id)}
                        >
                          <div className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors">{sppg.name}</div>
                        </td>
                        <td className="px-6 py-5 max-w-[180px]">
                          <div className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{sppg.location}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-bold bg-purple-100 text-purple-800 shadow-sm">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {sppg.totalReportingSchools}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {sppg.lastUpdateTime ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-gray-900">
                                  {new Date(sppg.lastUpdateTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(sppg.lastUpdateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ) : <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                            {sppg.reportingSchools && sppg.reportingSchools.length > 0 ? (
                              <>
                                {sppg.reportingSchools.slice(0, 2).map((school, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                    title={school}
                                  >
                                    {school.length > 18 ? school.substring(0, 18) + '...' : school}
                                  </span>
                                ))}
                                {sppg.totalReportingSchools > 2 && (
                                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    +{sppg.totalReportingSchools - 2} lagi
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Belum ada laporan</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {sppg.update_count > 0 ? (
                            <div className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-800 shadow-sm">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {sppg.update_count}x
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500">
                              0x
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {sppg.update_count > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(sppg.id);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200"
                            >
                              {expandedRows.has(sppg.id) ? (
                                <>
                                  <IconChevronUp className="h-4 w-4" />
                                  Tutup
                                </>
                              ) : (
                                <>
                                  <IconChevronDown className="h-4 w-4" />
                                  Lihat
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                      {expandedRows.has(sppg.id) && sppg.distribution_dates && (
                        <tr>
                          <td colSpan={8} className="px-6 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-t border-blue-100">
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Detail Distribusi:
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {sppg.distribution_dates.map((dist, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-sm font-medium text-gray-700">
                                        {new Date(dist.date).toLocaleDateString('id-ID', { 
                                          day: '2-digit', 
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                      {dist.portions.toLocaleString('id-ID')} porsi
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  (filteredData as SPPGDistributionDetail[]).map((sppg) => (
                    <tr 
                      key={sppg.id} 
                      className="hover:bg-blue-50/30 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleRowClick(sppg.id)}
                    >
                      <td className="px-6 py-5 min-w-[300px]">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{sppg.name}</div>
                      </td>
                      <td className="px-6 py-5 max-w-[180px]">
                        <div className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{sppg.location}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {sppg.totalMBGReportingSchools > 0 ? (
                          <div className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-bold bg-green-100 text-green-800 shadow-sm border border-green-200">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {sppg.totalMBGReportingSchools}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            0
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 max-w-[200px]">
                        {sppg.totalDistributedSchools > 0 ? (
                          <div className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-800 shadow-sm border border-blue-200">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {sppg.totalDistributedSchools}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic leading-relaxed">
                            SPPG belum memperbarui laporan distribusi
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 max-w-[200px]">
                        {sppg.totalDistributions > 0 ? (
                          <div className="text-base font-bold text-gray-900 bg-purple-50 px-3 py-2 rounded-lg inline-block border border-purple-200">
                            {sppg.totalDistributions.toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic leading-relaxed">
                            SPPG belum memperbarui laporan distribusi
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {sppg.lastUpdateTime ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-gray-900">
                                {new Date(sppg.lastUpdateTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(sppg.lastUpdateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                          {sppg.mbgReportingSchools && sppg.mbgReportingSchools.length > 0 ? (
                            <>
                              {sppg.mbgReportingSchools.slice(0, 2).map((school, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                  title={school}
                                >
                                  {school.length > 18 ? school.substring(0, 18) + '...' : school}
                                </span>
                              ))}
                              {sppg.totalMBGReportingSchools > 2 && (
                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  +{sppg.totalMBGReportingSchools - 2} lagi
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Tidak ada</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                          {sppg.distributedSchools && sppg.distributedSchools.length > 0 ? (
                            <>
                              {sppg.distributedSchools.slice(0, 2).map((school, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                  title={school}
                                >
                                  {school.length > 18 ? school.substring(0, 18) + '...' : school}
                                </span>
                              ))}
                              {sppg.totalDistributedSchools > 2 && (
                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  +{sppg.totalDistributedSchools - 2} lagi
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">SPPG belum memperbarui laporan distribusi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery 
                ? `Tidak ada SPPG yang cocok dengan pencarian "${searchQuery}"`
                : activeTab === 'recap'
                  ? `Tidak ada data SPPG tersedia`
                  : `Tidak ada SPPG yang ${activeTab === 'distributed' ? 'sudah' : 'belum'} terima laporan pada tanggal ${new Date(selectedDate).toLocaleDateString('id-ID')}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
