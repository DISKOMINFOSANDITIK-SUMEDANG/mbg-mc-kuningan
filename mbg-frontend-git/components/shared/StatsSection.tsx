"use client";

import { useState, useEffect } from "react";
import { IconUsers, IconMapPin, IconCalendar } from "@tabler/icons-react";
import { getSchoolStatistics, SchoolStatistics } from "@/lib/api-client";

export default function StatsSection() {
  const [stats, setStats] = useState<SchoolStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch school statistics on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching school statistics...");
        const data = await getSchoolStatistics();
        console.log("School statistics received:", data);
        setStats(data);
      } catch (error) {
        console.error("Error fetching school statistics:", error);
        // Set default values if API fails
        setStats({
          totalSchools: 709,
          activeSppgs: 44,
          todayPortions: 0,
          averageDailyPortions: 1000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-green-50/30 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/30 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Statistik Program
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Program dalam Angka
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pencapaian program Makan Bergizi Gratis di Kabupaten Kuningan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-lg">
                <div className="bg-gray-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl mb-3 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-green-50/30 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/30">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Statistik Program
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Program dalam Angka
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pencapaian program Makan Bergizi Gratis di Kabupaten Kuningan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sekolah Terdaftar */}
          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconUsers className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
                {/* {stats.totalSchools.toLocaleString()} */}
                2707
              </h3>
              <p className="text-gray-900 font-bold text-lg mb-2">
                Sekolah Terdaftar
              </p>
              <p className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                Aktif di program
              </p>
            </div>
          </div>

          {/* Dapur SPPG */}
          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconMapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-5xl font-bold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
                {stats.activeSppgs}
              </h3>
              <p className="text-gray-900 font-bold text-lg mb-2">
                Dapur SPPG
              </p>
              <p className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                Siap melayani
              </p>
            </div>
          </div>

          {/* Porsi Hari Ini */}
          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconCalendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-5xl font-bold bg-gradient-to-br from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                {stats.todayPortions > 0
                  ? stats.todayPortions.toLocaleString()
                  : `${stats.averageDailyPortions.toLocaleString()}+`}
              </h3>
              <p className="text-gray-900 font-bold text-lg mb-2">
                {stats.todayPortions > 0 ? "Porsi Hari Ini" : "Porsi per Hari"}
              </p>
              <p className="text-sm text-gray-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
                {stats.todayPortions > 0
                  ? "Terdistribusi hari ini"
                  : "Rata-rata mingguan"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
