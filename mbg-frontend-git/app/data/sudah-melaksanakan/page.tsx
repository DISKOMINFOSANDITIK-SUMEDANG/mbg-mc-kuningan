"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { DataPageSkeleton } from "@/components/shared/PageSkeletons";
import dynamic from "next/dynamic";

const MultiMapView = dynamic(() => import("@/components/shared/MultiMapView"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
});

interface SummaryData {
  id: string;
  pendidikan: string;
  sekolah: number;
  siswa: number;
}

interface SchoolDetail {
  id: string;
  sekolah: string;
  pendidikan: string;
  kecamatan: string;
  tikor: string;
  distribusiSiswa: number;
  latitude: number;
  longitude: number;
}

export default function SudahMelaksanakanPage() {
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        // Load summary data from CSV
        const summaryResponse = await fetch(
          "/data/Visualisasi MBG_Sudah Melaksanakan_Tabel.csv"
        );
        const summaryCsvText = await summaryResponse.text();
        const summaryLines = summaryCsvText.split("\n");

        const summaryData: SummaryData[] = summaryLines
          .slice(1)
          .filter((line) => line.trim())
          .map((line, index) => {
            const values = line.split(",");
            return {
              id: `summary-${index}`,
              pendidikan: values[0]?.trim() || "",
              sekolah: parseInt(values[1]?.trim() || "0") || 0,
              siswa: parseInt(values[2]?.trim() || "0") || 0,
            };
          });

        // Load detailed school data from CSV
        const detailResponse = await fetch(
          "/data/Visualisasi MBG_Sudah Melaksanakan_Tabel(1).csv"
        );
        const detailCsvText = await detailResponse.text();
        const detailLines = detailCsvText.split("\n");

        const schoolDetails: SchoolDetail[] = detailLines
          .slice(1)
          .filter((line) => line.trim())
          .map((line, index) => {
            // Parse CSV line properly handling quoted fields
            const parseCSVLine = (line: string): string[] => {
              const result: string[] = [];
              let current = "";
              let inQuotes = false;

              for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === "," && !inQuotes) {
                  result.push(current.trim());
                  current = "";
                } else {
                  current += char;
                }
              }

              // Don't forget the last field
              result.push(current.trim());
              return result;
            };

            const values = parseCSVLine(line);
            const tikorStr = values[3]?.trim() || "";

            // Parse coordinates from string format like "-6.8587,107.9278"
            let latitude = 0;
            let longitude = 0;

            if (tikorStr.includes(",")) {
              const coords = tikorStr.replace(/"/g, "").split(",");
              if (coords.length === 2) {
                latitude = parseFloat(coords[0]) || 0;
                longitude = parseFloat(coords[1]) || 0;
              }
            }

            return {
              id: `school-${index}`,
              sekolah: values[0]?.trim() || "",
              pendidikan: values[1]?.trim() || "",
              kecamatan: values[2]?.trim() || "",
              tikor: tikorStr,
              distribusiSiswa: parseInt(values[4]?.trim() || "0") || 0,
              latitude,
              longitude,
            };
          });

        setSummaryData(summaryData);
        setSchoolDetails(schoolDetails);
      } catch (error) {
        console.error("Error loading school data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchoolData();
  }, []);

  const totalStats = summaryData.reduce(
    (acc, item) => ({
      totalSekolah: acc.totalSekolah + item.sekolah,
      totalSiswa: acc.totalSiswa + item.siswa,
    }),
    {
      totalSekolah: 0,
      totalSiswa: 0,
    }
  );

  // Filter schools based on search query
  const filteredSchools = Array.isArray(schoolDetails) ? schoolDetails.filter(
    (school) =>
      school.sekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.kecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.pendidikan.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Reset to page 1 when search query changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Pagination logic for filtered data
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchoolData = filteredSchools.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

    if (loading) {
    return <DataPageSkeleton heroTitle="Sudah Melaksanakan" statCount={2} />;
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
              Program Nasional MBG
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Sekolah yang Sudah
              <span className="block bg-gradient-to-r from-green-600 via-green-700 to-blue-600 bg-clip-text text-transparent mt-2">
                Melaksanakan
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed font-medium">
              Data lengkap sekolah yang telah berhasil mengimplementasikan
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Program Makan Bergizi Gratis di Kabupaten Sumedang
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-white via-green-50/30 to-blue-50/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-green-500/30">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              <span>Live Statistics</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Pencapaian dalam Angka
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Sekolah yang telah berhasil mengimplementasikan Program MBG di Kabupaten Sumedang
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Sekolah Sudah Melaksanakan Card */}
            <div className="group relative bg-gradient-to-br from-green-600 via-green-600 to-green-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {totalStats.totalSekolah.toLocaleString()}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Sekolah Sudah Melaksanakan</div>
                  <div className="text-white/60 text-xs">Aktif di program</div>
                </div>
              </div>
            </div>

            {/* Siswa Terlayani Card */}
            <div className="group relative bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {totalStats.totalSiswa.toLocaleString()}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Siswa Terlayani</div>
                  <div className="text-white/60 text-xs">Menerima nutrisi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ringkasan per Jenjang */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-purple-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Ringkasan Data</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Ringkasan per Jenjang Pendidikan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Data sekolah yang telah melaksanakan program berdasarkan jenjang
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenjang Pendidikan
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
                  {summaryData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.pendidikan}
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
        </div>
      </section>

      {/* Detail Sekolah */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-blue-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Data Lengkap</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Detail Sekolah yang Sudah Melaksanakan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Daftar lengkap sekolah dengan informasi detail
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
                  placeholder="Cari nama sekolah, kecamatan, atau jenjang..."
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
                Ditemukan {filteredSchools.length} sekolah untuk &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Sekolah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenjang
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kecamatan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distribusi Siswa
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSchoolData.map((school) => (
                    <tr
                      key={school.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div
                          className="max-w-xs truncate"
                          title={school.sekolah}
                        >
                          {school.sekolah}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {school.pendidikan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {school.kecamatan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {school.distribusiSiswa.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 px-6 pb-6">
                <div className="text-sm text-gray-700 font-medium">
                  Halaman <span className="font-bold text-blue-600">{currentPage}</span> dari <span className="font-bold">{totalPages}</span> •{" "}
                  <span className="font-bold text-green-600">{filteredSchools.length}</span> data
                  {searchQuery && ` (dari ${schoolDetails.length} total)`}
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
        </div>
      </section>

      {/* Peta Sebaran */}
      {/* <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-green-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>Visualisasi Lokasi</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Peta Sebaran Sekolah
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Lokasi sekolah yang telah melaksanakan program MBG
            </p>
          </div>

          <div className="mb-8">
            <div className="h-96 rounded-xl overflow-hidden shadow-lg">
              <MultiMapView
                locations={schoolDetails
                  .filter(
                    (school) => school.latitude !== 0 && school.longitude !== 0
                  )
                  .map((school) => ({
                    id: school.id,
                    name: school.sekolah,
                    latitude: school.latitude,
                    longitude: school.longitude,
                    address: `${school.kecamatan}, Sumedang`,
                    phone: "",
                    type: "school",
                  }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolDetails
              .filter(
                (school) => school.latitude !== 0 && school.longitude !== 0
              )
              .slice(0, 6)
              .map((school) => (
                <div
                  key={school.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-green-300"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {school.sekolah}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {school.pendidikan} • {school.distribusiSiswa} siswa
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    {school.kecamatan}, Sumedang
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Aktif
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      {school.distribusiSiswa.toLocaleString()} siswa
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section> */}

    </AppLayout>
  );
}
