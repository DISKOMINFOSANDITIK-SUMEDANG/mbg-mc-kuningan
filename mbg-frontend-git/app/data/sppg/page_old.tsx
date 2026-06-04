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
        // Load SPPG location data first
        const response2 = await fetch("/data/sppgs_fixed.csv");
        const csvText2 = await response2.text();
        const lines2 = csvText2.split("\n");

        const data2: SPPGLocationData[] = lines2
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            // Manual parsing untuk data yang lebih akurat
            const parts = line.split(",");

            // Find latitude and longitude (they should be negative numbers)
            let latIndex = -1;
            let lngIndex = -1;

            for (let i = 0; i < parts.length; i++) {
              const part = parts[i].trim();
              if (part.startsWith("-6.") || part.startsWith("-7.")) {
                latIndex = i;
                break;
              }
            }

            for (let i = latIndex + 1; i < parts.length; i++) {
              const part = parts[i].trim();
              if (part.startsWith("107.") || part.startsWith("108.")) {
                lngIndex = i;
                break;
              }
            }

            // Find phone number (starts with 08 or 81)
            let phoneIndex = -1;
            for (let i = lngIndex + 1; i < parts.length; i++) {
              const part = parts[i].trim();
              if (part.startsWith("08") || part.startsWith("81")) {
                phoneIndex = i;
                break;
              }
            }

            const id = parts[0] || "";
            const name = parts[1] || "";
            const type = parts[2] || "Dapur Pusat";
            const latitude = latIndex >= 0 ? parseFloat(parts[latIndex]) : 0;
            const longitude = lngIndex >= 0 ? parseFloat(parts[lngIndex]) : 0;
            const phone = phoneIndex >= 0 ? parts[phoneIndex] : "";

            // Extract address from the parts between type and latitude
            const addressParts = [];
            for (let i = 4; i < latIndex; i++) {
              if (parts[i] && parts[i].trim()) {
                addressParts.push(parts[i].trim());
              }
            }
            const address = addressParts.join(", ").replace(/^"|"$/g, "");

            return {
              id,
              name,
              type,
              capacity: null,
              location: address,
              latitude,
              longitude,
              phone,
              email: "",
              address,
              operating_hours_start: "07:00",
              operating_hours_end: "15:00",
              kitchen_photo_url: null,
              created_at: "",
              updated_at: "",
              foundation_id: "",
            };
          });

        // Load SPPG summary data for table
        const response3 = await fetch("/data/Visualisasi MBG_SPPG_Tabel.csv");
        const csvText3 = await response3.text();
        const lines3 = csvText3.split("\n");

        const data1: SPPGData[] = lines3
          .slice(1)
          .filter((line) => line.trim())
          .map((line, index) => {
            const values = line.split(",");
            return {
              id: `sppg-table-${index}`,
              sppg: values[0]?.trim() || "",
              kecamatan: values[1]?.trim() || "",
              yayasan: values[2]?.trim() || "",
              sekolah: parseInt(values[3]?.trim() || "0") || 0,
              siswa: parseInt(values[4]?.trim() || "0") || 0,
            };
          });

        // Generate bar chart data from table data
        const kecamatanCounts = data1.reduce((acc, item) => {
          if (acc[item.kecamatan]) {
            acc[item.kecamatan] += 1;
          } else {
            acc[item.kecamatan] = 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const data3: BarChartData[] = Object.entries(kecamatanCounts).map(
          ([kecamatan, count]) => ({
            kecamatan,
            count,
          })
        );

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

  const totalStats = {
    totalSekolah: sppgData.reduce((acc, item) => acc + item.sekolah, 0),
    totalSiswa: sppgData.reduce((acc, item) => acc + item.siswa, 0),
    totalKecamatan: [...new Set(sppgData.map((item) => item.kecamatan))].length,
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
      <section className="bg-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sentra Pangan Pendidikan Gizi
              <span className="block text-green-600">
                (SPPG)
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Pusat produksi dan distribusi makanan bergizi untuk sekolah di
              Kabupaten Kuningan
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              SPPG dalam Angka
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pencapaian Sentra Pangan Pendidikan Gizi di Kabupaten Kuningan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-green-600">
                  {sppgData.length}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Total SPPG</p>
              <p className="text-sm text-gray-500 mt-1">Aktif beroperasi</p>
            </div>

            <div className="text-center group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-blue-600">
                  {totalStats.totalSekolah.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Sekolah Terlayani</p>
              <p className="text-sm text-gray-500 mt-1">Mitra program</p>
            </div>

            <div className="text-center group">
              <div className="bg-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-purple-600">
                  {totalStats.totalKecamatan.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Kecamatan Terlayani</p>
              <p className="text-sm text-gray-500 mt-1">Wilayah cakupan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Data SPPG per Kecamatan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Informasi detail SPPG berdasarkan lokasi kecamatan
            </p>
          </div>

          {/* Search Filter */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari SPPG, kecamatan, atau yayasan..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600 text-center">
                Ditemukan {filteredSppgData.length} SPPG untuk &quot;
                {searchQuery}&quot;
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Sekolah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Siswa
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {item.sekolah.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {item.siswa.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Halaman {currentPage} dari {totalPages} •{" "}
                {filteredSppgData.length} data
                {searchQuery && ` (dari ${sppgData.length} total)`}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ««
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-lg">
                  {currentPage}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Charts and Map Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Visualisasi Data SPPG
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diagram batang distribusi SPPG per kecamatan dan peta sebaran
              lokasi
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <div>
              <BarChart
                data={barChartData}
                title="Distribusi SPPG per Kecamatan"
                height="400px"
              />
            </div>

            {/* Map */}
            <div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Peta Sebaran SPPG
                </h3>
                <SPPGMapView
                  locations={sppgLocations.map((loc) => ({
                    id: loc.id,
                    name: loc.name,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address: loc.address,
                    phone: loc.phone,
                    operating_hours_start: loc.operating_hours_start,
                    operating_hours_end: loc.operating_hours_end,
                  }))}
                  height="400px"
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {sppgLocations.length}
              </div>
              <div className="text-gray-600 font-medium">Total Lokasi SPPG</div>
              <div className="text-sm text-gray-500 mt-1">
                Tersebar di seluruh kabupaten
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {barChartData.length}
              </div>
              <div className="text-gray-600 font-medium">
                Kecamatan Terlayani
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Jangkauan program
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Math.round((sppgLocations.length / barChartData.length) * 10) /
                  10}
              </div>
              <div className="text-gray-600 font-medium">
                Rata-rata SPPG/Kecamatan
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Densitas pelayanan
              </div>
            </div>
          </div>
        </div>
      </section>

    </AppLayout>
  );
}
