"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { DataPageSkeleton } from "@/components/shared/PageSkeletons";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("@/components/shared/BarChart"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
  ),
});

const SPPGMapView = dynamic(() => import("@/components/shared/SPPGMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
  ),
});

interface SPPGData {
  id: string;
  sppg: string;
  kecamatan: string;
  yayasan: string;
  sekolah: number;
  siswa: number;
}

interface SPPGLocationData {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  address: string;
  operating_hours_start: string;
  operating_hours_end: string;
  kitchen_photo_url: string | null;
  created_at: string;
  updated_at: string;
  foundation_id: string;
}

interface BarChartData {
  kecamatan: string;
  count: number;
}

interface SPPGDataFromDB {
  id: string;
  id_sppg: string;
  sppg_name: string;
  type: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  address: string | null;
  operating_hours_start: string | null;
  operating_hours_end: string | null;
  foundation_name: string | null;
  total_schools: number;
  total_districts: number;
  total_students: number | null;
}

export default function SPPGPage() {
  const [sppgData, setSppgData] = useState<SPPGData[]>([]);
  const [sppgLocations, setSppgLocations] = useState<SPPGLocationData[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    const loadSPPGData = async () => {
      try {
        // Fetch data from API with statistics
        const response = await fetch('/api/sppgs?include_stats=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch SPPG data');
        }
        
        const sppgDataFromDB: SPPGDataFromDB[] = await response.json();
        
        // Validate response is an array
        if (!Array.isArray(sppgDataFromDB)) {
          console.error('Invalid response format:', sppgDataFromDB);
          throw new Error('Invalid data format received from API');
        }

        // Transform data for table - show all SPPGs from database
        const data1: SPPGData[] = sppgDataFromDB.map((item) => ({
          id: item.id,
          sppg: item.sppg_name,
          kecamatan: extractKecamatan(item.location || item.address || ''),
          yayasan: item.foundation_name || '-',
          sekolah: item.total_schools || 0,
          siswa: item.total_students || 0,
        }));

        // Transform data for locations/map
        const data2: SPPGLocationData[] = sppgDataFromDB
          .filter(item => item.latitude && item.longitude)
          .map((item) => ({
            id: item.id,
            name: item.sppg_name,
            type: item.type || 'Dapur Pusat',
            capacity: null,
            location: item.location || '',
            latitude: parseFloat(item.latitude || '0'),
            longitude: parseFloat(item.longitude || '0'),
            phone: item.phone || '',
            email: '',
            address: item.address || '',
            operating_hours_start: item.operating_hours_start || '07:00:00',
            operating_hours_end: item.operating_hours_end || '15:00:00',
            kitchen_photo_url: null,
            created_at: '',
            updated_at: '',
            foundation_id: '',
          }));

        // Generate bar chart data from table data
        const kecamatanCounts = data1.reduce((acc, item) => {
          const kec = item.kecamatan;
          if (kec && kec !== 'Tidak Diketahui') {
            acc[kec] = (acc[kec] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const data3: BarChartData[] = Object.entries(kecamatanCounts)
          .map(([kecamatan, count]) => ({
            kecamatan,
            count,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setSppgData(data1);
        setSppgLocations(data2);
        setBarChartData(data3);
      } catch (error) {
        console.error("Error loading SPPG data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSPPGData();
  }, []);

  // Helper function to extract kecamatan from location/address
  const extractKecamatan = (text: string): string => {
    if (!text) return 'Tidak Diketahui';
    
    // Pattern 1: "Kec. [Name]" or "Kecamatan [Name]"
    const kecPattern1 = /Kec(?:amatan)?\.?\s+([A-Za-z\s]+?)(?:,|\s+Kab|\s+Kabupaten|$)/i;
    const match1 = text.match(kecPattern1);
    if (match1 && match1[1]) {
      return match1[1].trim();
    }
    
    // Pattern 2: Location starts with place name before "Kec."
    const kecPattern2 = /([A-Za-z\s]+)\s+Kec\./i;
    const match2 = text.match(kecPattern2);
    if (match2 && match2[1]) {
      const name = match2[1].trim();
      // Make sure it's not too long and looks like a place name
      if (name.length < 30 && !name.toLowerCase().includes('jl.') && !name.toLowerCase().includes('jalan')) {
        return name;
      }
    }
    
    // Pattern 3: "Kecamatan [Name], Kabupaten Kuningan"
    const kecPattern3 = /Kec(?:amatan)?\s+([A-Za-z\s]+)/i;
    const match3 = text.match(kecPattern3);
    if (match3 && match3[1]) {
      const name = match3[1].split(',')[0].trim();
      if (name.length < 30) {
        return name;
      }
    }
    
    // Pattern 4: Extract from comma-separated (improved)
    const parts = text.split(',').map(p => p.trim());
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Check if contains "Kec" or looks like a kecamatan name
      if (part.toLowerCase().includes('kec')) {
        const cleaned = part.replace(/kec(?:amatan)?\.?\s*/gi, '').trim();
        if (cleaned && cleaned.length < 30) {
          return cleaned;
        }
      }
    }
    
    // If no kecamatan found but location has content, return first meaningful part
    if (text.length > 0 && text.length < 50 && !text.toLowerCase().includes('jl.') && !text.toLowerCase().includes('jalan')) {
      const firstPart = text.split(',')[0].trim();
      if (firstPart.length < 30) {
        return firstPart;
      }
    }
    
    return 'Tidak Diketahui';
  };

  const totalStats = {
    totalSekolah: sppgData.reduce((acc, item) => acc + item.sekolah, 0),
    totalSiswa: sppgData.reduce((acc, item) => acc + item.siswa, 0),
    totalKecamatan: barChartData.length,
    totalSppg: sppgData.length,
  };

  // Filter SPPG based on search query
  const filteredSppgData = sppgData.filter(
    (sppg) =>
      sppg.sppg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sppg.kecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sppg.yayasan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to page 1 when search query changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Pagination logic for filtered data
  const totalPages = Math.ceil(filteredSppgData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSppgData = filteredSppgData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <DataPageSkeleton heroTitle="SPPG Data" statCount={3} />;
  }

  return (
    <AppLayout className="bg-white">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50/30 py-20 sm:py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-green-500/30">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              Program Makan Bergizi Gratis
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Sentra Pangan
              <span className="block bg-gradient-to-r from-green-600 via-green-700 to-blue-600 bg-clip-text text-transparent mt-2">
                Pendidikan Gizi
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed font-medium">
              Pusat produksi dan distribusi makanan bergizi gratis
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              untuk mendukung tumbuh kembang optimal siswa di Kabupaten Kuningan
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-blue-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Data Lengkap</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Data SPPG per Kecamatan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Informasi detail SPPG berdasarkan lokasi kecamatan
            </p>
          </div>

          {/* Search Filter */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-focus-within:scale-110 transition-transform duration-300">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Cari SPPG, kecamatan, atau yayasan..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-16 pr-12 py-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-xl bg-white font-medium placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                  >
                    <div className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            </div>
            
            {searchQuery && (
              <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ditemukan {filteredSppgData.length} SPPG untuk &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SPPG
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kecamatan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yayasan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSppgData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="max-w-xs truncate" title={item.sppg}>
                          {item.sppg}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.kecamatan}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={item.yayasan}>
                          {item.yayasan}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-700 font-medium">
                Halaman <span className="font-bold text-blue-600">{currentPage}</span> dari <span className="font-bold">{totalPages}</span> •{" "}
                <span className="font-bold text-green-600">{filteredSppgData.length}</span> data
                {searchQuery && ` (dari ${sppgData.length} total)`}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-blue-400"
                >
                  ««
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-blue-400"
                >
                  ‹
                </button>

                <div className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-600 rounded-lg shadow-lg">
                  {currentPage}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-blue-400"
                >
                  ›
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-blue-400"
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Charts and Map Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-purple-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Visualisasi Data</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Visualisasi Data SPPG
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Diagram batang distribusi SPPG per kecamatan dan peta sebaran lokasi
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
            {/* Bar Chart */}
            <div className="group">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <BarChart
                  data={barChartData}
                  title="Distribusi SPPG Berdasarkan Lokasi"
                  height="400px"
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 border border-green-100/50 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                {sppgLocations.length}
              </div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Lokasi SPPG Terdata</div>
              <div className="text-xs text-gray-500">Dengan koordinat GPS</div>
            </div>

            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 border border-blue-100/50 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                {barChartData.length}
              </div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Kecamatan Terlayani</div>
              <div className="text-xs text-gray-500">Jangkauan program</div>
            </div>

            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 border border-purple-100/50 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                {barChartData.length > 0 ? (Math.round((sppgLocations.length / barChartData.length) * 10) / 10) : 0}
              </div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Rata-rata SPPG/Kecamatan</div>
              <div className="text-xs text-gray-500">Densitas pelayanan</div>
            </div>
          </div> */}
        </div>
      </section>

    </AppLayout>
  );
}
