"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { DataPageSkeleton } from "@/components/shared/PageSkeletons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PeredaranData {
  bulan: string;
  kecamatan: string;
  penerimaManfaat: number;
  jumlahHari: number;
  hargaSatuan: number;
  jumlahPerBulan: number;
  jumlahBulan: number;
  totalPeredaran: number;
}

interface MonthlyTotal {
  bulan: string;
  total: number;
}

interface KecamatanTotal {
  kecamatan: string;
  total: number;
}

export default function PeredaranUangPage() {
  const [data, setData] = useState<PeredaranData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("Semua");
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch("/data/peredaran_uang.csv");
        const csvText = await response.text();
        const lines = csvText.split("\n");
        
        // Process data (skip header rows - first 5 rows are headers)
        const processedData: PeredaranData[] = [];
        const kecamatanSet = new Set<string>();
        let lastBulan = "";
        
        for (let i = 5; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split by semicolon (;) as the CSV uses semicolon delimiter
          const values = line.split(";");
          
          // Skip if not enough columns or if it's the total row
          if (values.length < 9 || values[1]?.trim().toLowerCase() === "jumlah") continue;
          
          // Get bulan - if empty, use the last bulan
          const bulan = values[1]?.trim();
          if (bulan) {
            lastBulan = bulan;
          }
          
          const kecamatan = values[2]?.trim();
          if (!kecamatan) continue;
          
          // Parse numeric values - remove dots and spaces used as thousand separators
          const parseNumber = (str: string) => {
            if (!str) return 0;
            // Remove spaces and dots used as separators, keep only digits
            return parseFloat(str.replace(/[\s.]/g, '').replace(',', '.')) || 0;
          };
          
          const penerimaManfaat = parseNumber(values[3]);
          const jumlahHari = parseNumber(values[4]);
          const hargaSatuan = parseNumber(values[5]);
          const jumlahPerBulan = parseNumber(values[6]); // This is the monthly amount
          const jumlahBulan = parseNumber(values[7]);
          const totalPeredaran = parseNumber(values[8]);
          
          processedData.push({
            bulan: lastBulan,
            kecamatan: kecamatan,
            penerimaManfaat: penerimaManfaat,
            jumlahHari: jumlahHari,
            hargaSatuan: hargaSatuan,
            jumlahPerBulan: jumlahPerBulan,
            jumlahBulan: jumlahBulan,
            totalPeredaran: jumlahPerBulan, // Use monthly amount, not cumulative total
          });
          
          kecamatanSet.add(kecamatan);
        }
        
        setData(processedData);
        setKecamatanList(["Semua", ...Array.from(kecamatanSet).sort()]);
      } catch (error) {
        console.error("Error loading CSV data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Order bulan yang benar
  const bulanOrder = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Filter data berdasarkan kecamatan yang dipilih
  const filteredData = selectedKecamatan === "Semua"
    ? data
    : data.filter((d) => d.kecamatan === selectedKecamatan);

  // Grafik 1: Data per bulan (berdasarkan filter kecamatan)
  const monthlyDataMap = new Map<string, number>();
  filteredData.forEach((item) => {
    const current = monthlyDataMap.get(item.bulan) || 0;
    monthlyDataMap.set(item.bulan, current + item.totalPeredaran);
  });
  
  const monthlyData = bulanOrder
    .filter(bulan => monthlyDataMap.has(bulan))
    .map(bulan => ({
      bulan,
      total: monthlyDataMap.get(bulan) || 0
    }));

  // Grafik 2: Total per bulan untuk semua kecamatan (semua data)
  const yearlyDataMap = new Map<string, number>();
  data.forEach((item) => {
    const current = yearlyDataMap.get(item.bulan) || 0;
    yearlyDataMap.set(item.bulan, current + item.totalPeredaran);
  });
  
  const yearlyData = bulanOrder
    .filter(bulan => yearlyDataMap.has(bulan))
    .map(bulan => ({
      bulan,
      total: yearlyDataMap.get(bulan) || 0
    }));

  // Hitung total keseluruhan
  const totalPeredaran = data.reduce((sum, item) => sum + item.totalPeredaran, 0);
  const totalKecamatan = kecamatanList.length - 1; // Minus "Semua"
  const rataRataPerBulan = yearlyData.length > 0 ? totalPeredaran / yearlyData.length : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return <DataPageSkeleton heroTitle="Peredaran Uang MBG" statCount={3} />;
  }

  return (
    <AppLayout className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 py-20 sm:py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-emerald-500/30">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              Program Nasional MBG
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Rekapitulasi Peredaran Uang
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent mt-2">
                Program MBG
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed font-medium">
              Kabupaten Kuningan
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Periode Januari - November 2025
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-100/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-emerald-500/30">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              <span>Ringkasan Keuangan</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Ringkasan Peredaran Uang
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Analisis keuangan Program Makan Bergizi Gratis di Kabupaten Kuningan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Total Peredaran Card */}
            <div className="group relative bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                    {formatCurrency(totalPeredaran)}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Total Peredaran</div>
                  <div className="text-white/60 text-xs">Jan - Nov 2025</div>
                </div>
              </div>
            </div>

            {/* Rata-rata per Bulan Card */}
            <div className="group relative bg-gradient-to-br from-teal-600 via-teal-600 to-teal-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                    {formatCurrency(rataRataPerBulan)}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Rata-rata per Bulan</div>
                  <div className="text-white/60 text-xs">11 bulan</div>
                </div>
              </div>
            </div>

            {/* Total Kecamatan Card */}
            <div className="group relative bg-gradient-to-br from-green-600 via-green-600 to-green-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {totalKecamatan}
                  </div>
                  <div className="text-white/80 text-sm font-medium mb-1">Total Kecamatan</div>
                  <div className="text-white/60 text-xs">Area terlayani</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grafik 1: Per Bulan dengan Filter Kecamatan */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-blue-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Grafik Peredaran</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Peredaran Uang per Bulan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Filter berdasarkan kecamatan untuk melihat detail peredaran uang
            </p>
          </div>

          {/* Filter Kecamatan */}
          <div className="mb-8 max-w-md mx-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              Pilih Kecamatan
            </label>
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all duration-300 shadow-lg hover:shadow-xl bg-white font-medium"
            >
              {kecamatanList.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6 overflow-hidden backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "#1f2937" }}
                />
                <Legend />
                <Bar dataKey="total" fill="#10b981" name="Jumlah Peredaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Grafik 2: Total per Tahun */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-emerald-500/30">
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span>Tren Tahunan</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Tren Peredaran Uang Tahun 2025
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Total peredaran uang MBG untuk semua kecamatan per bulan
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6 overflow-hidden backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "#1f2937" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Total Peredaran"
                  dot={{ fill: "#10b981", r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
