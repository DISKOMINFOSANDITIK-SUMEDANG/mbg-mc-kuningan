"use client";

import { useState, useEffect, useRef } from "react";
import { getStatistics, Statistics, getBeneficiaryTargets, BeneficiaryTargets, getSPPGDistributionsForTab } from "@/lib/api-client";
import SPPGDistributionTabsNew from "./SPPGDistributionTabsNew";

const getTodayDate = (): string => {
  const today = new Date();
  const indonesiaTime = new Date(today.getTime() + 7 * 60 * 60 * 1000);
  const year = indonesiaTime.getUTCFullYear();
  const month = String(indonesiaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(indonesiaTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DistributionStatsSection() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [beneficiaryTargets, setBeneficiaryTargets] = useState<BeneficiaryTargets | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [focusNotReportedSppgSignal, setFocusNotReportedSppgSignal] = useState(0);
  const [sppgReportTotals, setSppgReportTotals] = useState<{ reported: number; notReported: number } | null>(null);
  const sppgTabsRef = useRef<HTMLDivElement | null>(null);

  // Fetch statistics on component mount
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoadingStats(true);
        const today = getTodayDate();
        const [stats, targets, reported, notReported] = await Promise.all([
          getStatistics(),
          getBeneficiaryTargets(),
          getSPPGDistributionsForTab(today, "distributed"),
          getSPPGDistributionsForTab(today, "not-distributed"),
        ]);
        setStatistics(stats);
        setBeneficiaryTargets(targets);
        setSppgReportTotals({
          reported: reported.total,
          notReported: notReported.total,
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatistics();
  }, []);

  if (isLoadingStats) {
    return (
      <section className="py-20 sm:py-24 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-16">
              <div className="h-6 w-32 bg-gray-200 rounded-full mx-auto mb-5"></div>
              <div className="h-12 w-96 bg-gray-300 rounded mx-auto mb-4"></div>
              <div className="h-6 w-2/3 bg-gray-200 rounded mx-auto"></div>
            </div>
            
            {/* Main cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
              <div className="bg-gray-200 rounded-3xl h-64"></div>
              <div className="bg-gray-200 rounded-3xl h-64"></div>
            </div>
            
            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!statistics || !beneficiaryTargets) {
    return null;
  }

  const totalSppgTerdaftar = Math.max(statistics.totalSppgs || 0, 0);
  const reportedSppgToday =
    sppgReportTotals?.reported ?? statistics.todayDistribution.sppgsWithDailyDistributions;
  const notReportedSppgToday = sppgReportTotals?.notReported ?? Math.max(totalSppgTerdaftar - reportedSppgToday, 0);
  const sppgProgressPercent = totalSppgTerdaftar > 0
    ? Math.round((reportedSppgToday / totalSppgTerdaftar) * 100)
    : 0;

  const handleOpenNotReportedSppgTab = () => {
    setFocusNotReportedSppgSignal((prev) => prev + 1);
    sppgTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
      
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Target Penerima Manfaat Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-fade-in">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-semibold mb-4 sm:mb-5 shadow-lg shadow-green-500/30">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              <span>Target Program</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 tracking-tight px-4">
              Penerima Manfaat MBG
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              Daftar yang sudah menerima manfaat Program Makan Bergizi Gratis di Kabupaten Sumedang
            </p>
          </div>

          {/* SPPG Running & Total Penerima Manfaat Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
            {/* Jumlah SPPG Running Card */}
            <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-700">
                      {statistics.totalSppgs}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-indigo-600">Jumlah SPPG Running</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                  <span className="text-sm font-semibold text-indigo-600">Aktif Beroperasi</span>
                </div>
              </div>
            </div>

            {/* Summary Card - Total Penerima Manfaat MBG */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-orange-700 mb-1 break-words">
                      {beneficiaryTargets.total_realized.toLocaleString("id-ID")} / {beneficiaryTargets.total_target.toLocaleString("id-ID")}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-orange-600">Total Penerima Manfaat MBG</div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto sm:flex-shrink-0">
                  <div className="text-lg sm:text-xl lg:text-2xl text-orange-600 font-extrabold mb-1">
                    {beneficiaryTargets.total_target > 0
                      ? `${((beneficiaryTargets.total_realized / beneficiaryTargets.total_target) * 100).toFixed(2)}%`
                      : "0%"}
                  </div>
                  <div className="text-sm sm:text-base text-orange-500">Pencapaian</div>
                </div>
              </div>
            </div>
          </div>

          {/* Target Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mt-4 sm:mt-5">
            {/* Pesantren Card */}
            <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-7 lg:p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-emerald-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white font-extrabold text-sm sm:text-base">
                      {beneficiaryTargets.pesantren_total > 0 ? ((beneficiaryTargets.pesantren_realized / beneficiaryTargets.pesantren_total) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap mb-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">{beneficiaryTargets.pesantren_realized.toLocaleString("id-ID")}</span>
                  <span className="text-white/70 text-sm sm:text-base">dari</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{beneficiaryTargets.pesantren_total.toLocaleString("id-ID")}</span>
                </div>
                <div className="text-white/90 text-base sm:text-lg font-semibold mb-2">Pesantren</div>
                <div className="text-white/70 text-xs sm:text-sm font-medium mb-3">
                  Sudah menerima manfaat MBG
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className="bg-white/80 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${beneficiaryTargets.pesantren_total > 0 ? Math.min((beneficiaryTargets.pesantren_realized / beneficiaryTargets.pesantren_total) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                  <div className="text-2xl sm:text-2xl font-extrabold text-white mb-1">{beneficiaryTargets.santri_realized.toLocaleString("id-ID")}/{beneficiaryTargets.santri_target.toLocaleString("id-ID")}</div>
                  <div className="text-white/80 text-xs sm:text-sm font-medium">Santri Penerima</div>
                </div>
              </div>
            </div>

            {/* Sekolah Card */}
            <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-7 lg:p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-blue-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white font-extrabold text-sm sm:text-base">
                      {beneficiaryTargets.sekolah_total > 0 ? ((beneficiaryTargets.sekolah_realized / beneficiaryTargets.sekolah_total) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap mb-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">{beneficiaryTargets.sekolah_realized.toLocaleString("id-ID")}</span>
                  <span className="text-white/70 text-sm sm:text-base">dari</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{beneficiaryTargets.sekolah_total.toLocaleString("id-ID")}</span>
                </div>
                <div className="text-white/90 text-base sm:text-lg font-semibold mb-2">Sekolah</div>
                <div className="text-white/70 text-xs sm:text-sm font-medium mb-3">
                  PAUD - SMA sudah menerima manfaat
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className="bg-white/80 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${beneficiaryTargets.sekolah_total > 0 ? Math.min((beneficiaryTargets.sekolah_realized / beneficiaryTargets.sekolah_total) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                  <div className="text-2xl sm:text-2xl font-extrabold text-white mb-1">{beneficiaryTargets.siswa_realized.toLocaleString("id-ID")}/{beneficiaryTargets.siswa_target.toLocaleString("id-ID")}</div>
                  <div className="text-white/80 text-xs sm:text-sm font-medium">Siswa Penerima</div>
                </div>
              </div>
            </div>
            

            {/* Bumil, Busui, Balita Card */}
            <div className="group relative bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-7 lg:p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-pink-800/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white font-extrabold text-sm sm:text-base">
                      {beneficiaryTargets.ibu_balita_target > 0 ? ((beneficiaryTargets.ibu_balita_realized / beneficiaryTargets.ibu_balita_target) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap mb-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">{beneficiaryTargets.ibu_balita_realized.toLocaleString("id-ID")}</span>
                  <span className="text-white/70 text-sm sm:text-base">dari</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{beneficiaryTargets.ibu_balita_target.toLocaleString("id-ID")}</span>
                </div>
                <div className="text-white/90 text-base sm:text-lg font-semibold mb-2">Ibu & Balita</div>
                <div className="text-white/70 text-xs sm:text-sm font-medium mb-3">
                  Bumil, Busui & Balita sudah menerima manfaat
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className="bg-white/80 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${beneficiaryTargets.ibu_balita_target > 0 ? Math.min((beneficiaryTargets.ibu_balita_realized / beneficiaryTargets.ibu_balita_target) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 grid grid-cols-3 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="text-white/80 text-xs font-medium mb-1">Bumil</div>
                    <div className="text-xs sm:text-sm font-bold text-white">{beneficiaryTargets.bumil_realized.toLocaleString("id-ID")}/{beneficiaryTargets.bumil_target.toLocaleString("id-ID")}</div>
                  </div>
                  <div>
                    <div className="text-white/80 text-xs font-medium mb-1">Busui</div>
                    <div className="text-xs sm:text-sm font-bold text-white">{beneficiaryTargets.busui_realized.toLocaleString("id-ID")}/{beneficiaryTargets.busui_target.toLocaleString("id-ID")}</div>
                  </div>
                  <div>
                    <div className="text-white/80 text-xs font-medium mb-1">Balita</div>
                    <div className="text-xs sm:text-sm font-bold text-white">{beneficiaryTargets.balita_realized.toLocaleString("id-ID")}/{beneficiaryTargets.balita_target.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Header dengan animasi */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold mb-5 shadow-lg shadow-blue-500/30">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            <span>Live Dashboard</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Laporan Program MBG
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Program Nasional Pemerintah Indonesia - Pantau aktivitas real-time upload menu dan laporan harian dari seluruh SPPG dan sekolah di Kabupaten Sumedang
          </p>
        </div>

        {/* Main Statistics Cards dengan design lebih modern */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">

          {/* Daily Distribution Statistics - SPPG Reports */}
          <div className="group relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-700/30 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-extrabold text-white tracking-tight">{reportedSppgToday}</div>
                  <div className="text-white/80 text-sm font-medium">dari {totalSppgTerdaftar} SPPG</div>

                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">
                Laporan SPPG Hari Ini
              </h3>
              <div className="text-sm text-white/70 mb-3 font-medium">
                Distribusi menu dan laporan harian
              </div>
              
              <div className="text-sm text-white/80 mb-4 font-medium">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden backdrop-blur-sm">
                <div
                    className="bg-gradient-to-r from-yellow-300 to-yellow-200 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{
                    width: `${sppgProgressPercent}%`,
                    }}
                  ></div>
              </div>

              <div className="flex justify-end items-center">
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{sppgProgressPercent}%</div>
                  <div className="text-sm text-white/80 font-medium">Progress SPPG</div>
                </div>
              </div>
            </div>
          </div>

          {/* School Reports Statistics */}
          <div className="group relative bg-gradient-to-br from-purple-600 via-purple-600 to-purple-700 rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-800/30 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-extrabold text-white tracking-tight">{statistics.todayDistribution.schoolsReportedToday}</div>
                  {/* <div className="text-white/80 text-sm font-medium">dari {statistics.totalSchools || 0} sekolah</div> */}
                  <div className="text-white/80 text-sm font-medium">dari {beneficiaryTargets.sekolah_realized.toLocaleString("id-ID")} sekolah <br /> penerima manfaat </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">
                Laporan Sekolah Hari Ini
              </h3>
              <div className="text-sm text-white/70 mb-3 font-medium">
                Upload foto menu & siswa makan
              </div>
              
              <div className="text-sm text-white/80 mb-4 font-medium">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-pink-300 to-pink-200 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{
                    width: `${statistics.todayDistribution.schoolReportPercentage}%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-end items-center">
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{statistics.todayDistribution.schoolReportPercentage}%</div>
                  <div className="text-sm text-white/80 font-medium">Progress Sekolah</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid dengan icon yang lebih menarik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {/* Total SPPG Aktif */}
          <div className="group bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100/50 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
              {statistics.totalSppgs}
            </div>
            <div className="text-sm font-semibold text-gray-600">Total SPPG Aktif</div>
          </div>

         

          {/* SPPG Belum Laporan */}
          <button
            type="button"
            onClick={handleOpenNotReportedSppgTab}
            className="group bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 border border-red-100/50 hover:-translate-y-1 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-extrabold bg-gradient-to-br from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
              {notReportedSppgToday}
            </div>
            <div className="text-sm font-semibold text-gray-600">SPPG Belum Laporan</div>
          </button>

           {/* Laporan SPPG Hari Ini */}

           <div className="group bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 border border-green-100/50 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
              {statistics.todayDistribution.totalDistributionPortions.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-gray-600">Total Porsi Distribusi</div>
          </div>

          
        </div>

        {/* Additional School Statistics Card */}
        {/* <div className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-6 mb-12 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-red-700 mb-1">
                  {statistics.todayDistribution.schoolsNotReportedToday.toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-red-600">Sekolah Belum Laporan Hari Ini</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-600 font-semibold mb-1">Perlu Follow-up</div>
              <div className="text-xs text-red-500">
                {(100 - statistics.todayDistribution.schoolReportPercentage).toFixed(1)}% belum melapor
              </div>
            </div>
          </div>
        </div> */}

        {/* Transition Divider */}
        <div className="relative py-10">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-gradient-to-r from-blue-50 via-white to-green-50 px-6 py-2 rounded-full border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Detail Laporan SPPG</span>
              </div>
            </div>
          </div>
        </div>

        {/* SPPG Distribution Details Tabs dengan border yang lebih menarik */}
        <div
          ref={sppgTabsRef}
          id="sppg-distribution-tabs"
          className="bg-white rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm"
        >
          <SPPGDistributionTabsNew
            focusNotReportedSppgSignal={focusNotReportedSppgSignal}
            totalActiveSppg={statistics.totalSppgs}
          />
        </div>
      </div>
    </section>
  );
}
