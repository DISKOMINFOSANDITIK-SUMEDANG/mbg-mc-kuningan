"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { DataPageSkeleton } from "@/components/shared/PageSkeletons";

interface ProgressData {
  id: string;
  pendidikan: string;
  jumlahSekolah: number;
  sekolahSudah: number;
  sekolahBelum: number;
  jumlahSiswa: number;
  siswaSudah: number;
  siswaBelum: number;
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load progress data from CSV
    const loadProgressData = async () => {
      try {
        const response = await fetch("/data/Visualisasi MBG_Progres_Tabel.csv");
        const csvText = await response.text();
        const lines = csvText.split("\n");
        // const headers = lines[0].split(","); // Reserved for future use

        const data: ProgressData[] = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line, index) => {
            const values = line.split(",");
            return {
              id: `progress-${index}`,
              pendidikan: values[0]?.trim() || "",
              jumlahSekolah: parseInt(values[1]) || 0,
              sekolahSudah: parseInt(values[2]) || 0,
              sekolahBelum: parseInt(values[3]) || 0,
              jumlahSiswa: parseInt(values[4]) || 0,
              siswaSudah: parseInt(values[5]) || 0,
              siswaBelum: parseInt(values[6]) || 0,
            };
          });

        setProgressData(data);
      } catch (error) {
        console.error("Error loading progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, []);

  const totalStats = progressData.reduce(
    (acc, item) => ({
      totalSekolah: acc.totalSekolah + item.jumlahSekolah,
      totalSudah: acc.totalSudah + item.sekolahSudah,
      totalBelum: acc.totalBelum + item.sekolahBelum,
      totalSiswa: acc.totalSiswa + item.jumlahSiswa,
      totalSiswaSudah: acc.totalSiswaSudah + item.siswaSudah,
      totalSiswaBelum: acc.totalSiswaBelum + item.siswaBelum,
    }),
    {
      totalSekolah: 0,
      totalSudah: 0,
      totalBelum: 0,
      totalSiswa: 0,
      totalSiswaSudah: 0,
      totalSiswaBelum: 0,
    }
  );

  const completionRate =
    totalStats.totalSekolah > 0
      ? ((totalStats.totalSudah / totalStats.totalSekolah) * 100).toFixed(1)
      : "0";

  const studentCompletionRate =
    totalStats.totalSiswa > 0
      ? ((totalStats.totalSiswaSudah / totalStats.totalSiswa) * 100).toFixed(1)
      : "0";

    if (loading) {
    return <DataPageSkeleton heroTitle="Progress Data" statCount={4} />;
  }

  return (
      <AppLayout className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50/30 py-20 sm:py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/30">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              Program Nasional MBG
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Progress Implementasi
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mt-2">
                Program MBG
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed font-medium">
              Pantau kemajuan implementasi Program Makan Bergizi Gratis
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              di Kabupaten Kuningan berdasarkan jenjang pendidikan
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-blue-500/30">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              <span>Live Statistics</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Progress dalam Angka
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Pencapaian implementasi Program Makan Bergizi Gratis di Kabupaten Kuningan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Sekolah Card */}
            <div className="group relative bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {totalStats.totalSekolah.toLocaleString()}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Total Sekolah</div>
                  <div className="text-white/60 text-xs">Terdaftar dalam program</div>
                </div>
              </div>
            </div>

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
                    {totalStats.totalSudah.toLocaleString()}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Sudah Melaksanakan</div>
                  <div className="text-white/60 text-xs">Aktif di program</div>
                </div>
              </div>
            </div>

            {/* Sekolah Belum Melaksanakan Card */}
            <div className="group relative bg-gradient-to-br from-orange-600 via-orange-600 to-orange-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {totalStats.totalBelum.toLocaleString()}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Belum Melaksanakan</div>
                  <div className="text-white/60 text-xs">Dalam proses</div>
                </div>
              </div>
            </div>

            {/* Tingkat Penyelesaian Card */}
            <div className="group relative bg-gradient-to-br from-purple-600 via-purple-600 to-purple-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {completionRate}%
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Tingkat Penyelesaian</div>
                  <div className="text-white/60 text-xs">Sekolah</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Siswa Card */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 border border-blue-100/50 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                {totalStats.totalSiswa.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Total Siswa</div>
              <div className="text-xs text-gray-500">Terdaftar dalam program</div>
            </div>

            {/* Siswa Terlayani Card */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 border border-green-100/50 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                {totalStats.totalSiswaSudah.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Siswa Terlayani</div>
              <div className="text-xs text-gray-500">Aktif menerima</div>
            </div>

            {/* Tingkat Pelayanan Card */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 border border-purple-100/50 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                {studentCompletionRate}%
              </div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Tingkat Pelayanan</div>
              <div className="text-xs text-gray-500">Siswa</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Table */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-purple-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Data Lengkap</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Detail Progress per Jenjang Pendidikan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Analisis mendalam pencapaian program berdasarkan jenjang pendidikan
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
                      Total Sekolah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sudah Melaksanakan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Belum Melaksanakan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress (%)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Siswa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa Terlayani
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelayanan Siswa (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progressData.map((item) => {
                    const schoolProgress =
                      item.jumlahSekolah > 0
                        ? (
                            (item.sekolahSudah / item.jumlahSekolah) *
                            100
                          ).toFixed(1)
                        : "0";
                    const studentProgress =
                      item.jumlahSiswa > 0
                        ? ((item.siswaSudah / item.jumlahSiswa) * 100).toFixed(
                            1
                          )
                        : "0";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.pendidikan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.jumlahSekolah.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {item.sekolahSudah.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {item.sekolahBelum.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${schoolProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {schoolProgress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.jumlahSiswa.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {item.siswaSudah.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${studentProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {studentProgress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>      </AppLayout>
    );
}
