"use client";

import { useState } from "react";
import { IconSchool, IconBook, IconBuildingCommunity, IconUsers } from "@tabler/icons-react";

interface EducationData {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

export default function ReligiousEducationSection() {
  const [activeCategory, setActiveCategory] = useState<'formal' | 'nonformal'>('formal');

  const formalEducation: EducationData[] = [
    {
      name: "MI",
      count: 64,
      icon: <IconSchool className="w-8 h-8" />,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      description: "Madrasah Ibtidaiyah"
    },
    {
      name: "MTs",
      count: 78,
      icon: <IconBook className="w-8 h-8" />,
      color: "text-green-600",
      bgColor: "bg-green-500",
      description: "Madrasah Tsanawiyah"
    },
    {
      name: "MA",
      count: 28,
      icon: <IconSchool className="w-8 h-8" />,
      color: "text-purple-600",
      bgColor: "bg-purple-500",
      description: "Madrasah Aliyah"
    }
  ];

  const nonFormalEducation: EducationData[] = [
    {
      name: "Pondok Pesantren",
      count: 309,
      icon: <IconBuildingCommunity className="w-8 h-8" />,
      color: "text-orange-600",
      bgColor: "bg-orange-500",
      description: "Pendidikan Pesantren"
    },
    {
      name: "MDT",
      count: 901,
      icon: <IconBook className="w-8 h-8" />,
      color: "text-teal-600",
      bgColor: "bg-teal-500",
      description: "Madrasah Diniyah Takmiliyah"
    },
    {
      name: "TPQ",
      count: 896,
      icon: <IconUsers className="w-8 h-8" />,
      color: "text-pink-600",
      bgColor: "bg-pink-500",
      description: "Taman Pendidikan Al-Qur'an"
    }
  ];

  const totalFormal = formalEducation.reduce((sum, item) => sum + item.count, 0);
  const totalNonFormal = nonFormalEducation.reduce((sum, item) => sum + item.count, 0);
  const grandTotal = totalFormal + totalNonFormal;

  const currentData = activeCategory === 'formal' ? formalEducation : nonFormalEducation;
  const maxCount = Math.max(...currentData.map(item => item.count));

  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-100/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-semibold mb-4 sm:mb-5 shadow-lg shadow-indigo-500/30">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            <span>Data Pendidikan Keagamaan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 tracking-tight px-4">
            Pendidikan Keagamaan
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Kabupaten Kuningan memiliki {grandTotal.toLocaleString()} institusi pendidikan keagamaan yang tersebar di seluruh wilayah
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          {/* Total Card */}
          <div className="group relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 lg:p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-800/30 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <IconSchool className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2">{grandTotal.toLocaleString()}</div>
              <div className="text-white/90 text-xs sm:text-sm font-medium mb-3 sm:mb-4">Total Institusi</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300/50"></div>
                <span className="text-xs sm:text-sm text-white/80 font-medium">Aktif</span>
              </div>
            </div>
          </div>

          {/* Formal Education Card */}
          <div className="group relative bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 lg:p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-blue-100/50">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <IconBook className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">{totalFormal}</div>
                <div className="text-gray-500 text-xs font-medium">Institusi</div>
              </div>
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Madrasah Formal</h3>
            <p className="text-xs sm:text-sm text-gray-600">MI, MTs, dan MA</p>
          </div>

          {/* Non-Formal Education Card */}
          <div className="group relative bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 lg:p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-orange-100/50">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <IconBuildingCommunity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-orange-600 to-orange-700 bg-clip-text text-transparent">{totalNonFormal.toLocaleString()}</div>
                <div className="text-gray-500 text-xs font-medium">Institusi</div>
              </div>
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Pendidikan Non-Formal</h3>
            <p className="text-xs sm:text-sm text-gray-600">Ponpes, MDT, dan TPQ</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mb-6 sm:mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveCategory('formal')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeCategory === 'formal'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border-b-3 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <IconSchool className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Madrasah Formal ({totalFormal})</span>
                <span className="sm:hidden">Formal ({totalFormal})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveCategory('nonformal')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeCategory === 'nonformal'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 border-b-3 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <IconBuildingCommunity className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Pendidikan Non-Formal ({totalNonFormal.toLocaleString()})</span>
                <span className="sm:hidden">Non-Formal ({totalNonFormal.toLocaleString()})</span>
              </div>
            </button>
          </div>

          {/* Data Cards Grid */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {currentData.map((item, index) => (
                <div 
                  key={item.name}
                  className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-500 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Decorative gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${item.color} bg-gradient-to-br from-gray-50 to-white border border-gray-200 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 mb-3 sm:mb-4`}>
                      {item.icon}
                    </div>

                    {/* Count */}
                    <div className="mb-2 sm:mb-3">
                      <div className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${item.color} mb-1`}>
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-600">{item.description}</div>
                    </div>

                    {/* Name Badge */}
                    <div className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${item.bgColor} text-white shadow-md`}>
                      {item.name}
                    </div>

                    {/* Percentage Info */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Persentase</span>
                        <span className={`font-bold ${item.color}`}>
                          {((item.count / (activeCategory === 'formal' ? totalFormal : totalNonFormal)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <IconSchool className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">Total {activeCategory === 'formal' ? 'Madrasah Formal' : 'Pendidikan Non-Formal'}</div>
                    <div className="text-xs text-gray-500">Kabupaten Kuningan</div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {activeCategory === 'formal' ? totalFormal : totalNonFormal.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Aktif</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-full shadow-md border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Data Pendidikan Keagamaan Kabupaten Kuningan</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}
