'use client';

/**
 * Loading Skeletons for Home Page Sections
 * Responsive skeleton components for all major homepage sections
 */

// HeroSection Skeleton
export function HeroSkeleton() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50/30 flex items-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto w-full pt-20 sm:pt-24 pb-32 animate-pulse">
        {/* Header Skeleton */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Badge Skeleton */}
          <div className="inline-flex items-center px-5 py-2.5 bg-gray-200 rounded-full mb-6">
            <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
            <div className="h-3 w-40 bg-gray-300 rounded"></div>
          </div>
          
          {/* Title Skeleton */}
          <div className="space-y-3 mb-6 px-4">
            <div className="h-12 sm:h-16 md:h-20 lg:h-24 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
            <div className="h-12 sm:h-16 md:h-20 lg:h-24 bg-gradient-to-r from-blue-200 to-green-200 rounded-lg w-2/3 mx-auto"></div>
          </div>
          
          {/* Description Skeleton */}
          <div className="space-y-3 px-4">
            <div className="h-6 sm:h-7 bg-gray-200 rounded w-2/3 mx-auto"></div>
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>

        {/* Search Section Skeleton */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
          <div className="relative">
            <div className="bg-white/90 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8 border-2 border-gray-200">
              <div className="flex items-center gap-4">
                {/* Search Icon Skeleton */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg sm:rounded-xl flex-shrink-0"></div>
                
                {/* Search Input Skeleton */}
                <div className="flex-1 h-6 bg-gray-200 rounded"></div>
                
                {/* Badge Skeleton */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <div className="h-3 w-8 bg-green-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// DistributionStatsSection Skeleton
export function DistributionStatsSkeleton() {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 sm:mb-16 lg:mb-20">
          {/* Header Skeleton */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-pulse">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 rounded-full mb-4 sm:mb-5">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              <div className="h-3 w-24 bg-gray-300 rounded"></div>
            </div>
            <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-lg w-2/3 mx-auto mb-3 sm:mb-4"></div>
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>

          {/* Summary Card Skeleton */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg mb-4 sm:mb-5 animate-pulse">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-200 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-6 sm:h-8 bg-orange-200 rounded w-48"></div>
                  <div className="h-3 sm:h-4 bg-orange-200 rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-2 w-full sm:w-auto">
                <div className="h-5 sm:h-6 bg-orange-200 rounded w-16"></div>
                <div className="h-3 sm:h-4 bg-orange-200 rounded w-20"></div>
              </div>
            </div>
          </div>

          {/* Target Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mt-4 sm:mt-5">
            {/* Card 1 - Pesantren */}
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-7 lg:p-8 animate-pulse">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6"></div>
              <div className="h-10 sm:h-12 lg:h-14 bg-white/20 rounded w-16 mb-2"></div>
              <div className="h-5 bg-white/20 rounded w-24 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-32 mb-3"></div>
              <div className="bg-white/10 rounded-lg p-3 mb-3 sm:mb-4">
                <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="h-6 bg-white/20 rounded w-8"></div>
                  <div className="h-3 bg-white/20 rounded w-12"></div>
                  <div className="h-5 bg-white/20 rounded w-8"></div>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                <div className="h-8 bg-white/20 rounded w-20 mb-1"></div>
                <div className="h-3 bg-white/20 rounded w-24"></div>
              </div>
            </div>

            {/* Card 2 - Sekolah */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-7 lg:p-8 animate-pulse">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6"></div>
              <div className="h-10 sm:h-12 lg:h-14 bg-white/20 rounded w-24 mb-2"></div>
              <div className="h-5 bg-white/20 rounded w-24 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-40 mb-3"></div>
              <div className="bg-white/10 rounded-lg p-3 mb-3 sm:mb-4">
                <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="h-6 bg-white/20 rounded w-12"></div>
                  <div className="h-3 bg-white/20 rounded w-12"></div>
                  <div className="h-5 bg-white/20 rounded w-12"></div>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                <div className="h-8 bg-white/20 rounded w-28 mb-1"></div>
                <div className="h-3 bg-white/20 rounded w-24"></div>
              </div>
            </div>

            {/* Card 3 - Bumil/Busui/Balita */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-7 lg:p-8 animate-pulse sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6"></div>
              <div className="h-10 sm:h-12 lg:h-14 bg-white/20 rounded w-24 mb-2"></div>
              <div className="h-5 bg-white/20 rounded w-32 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-40 mb-3"></div>
              <div className="bg-white/10 rounded-lg p-3 mb-3 sm:mb-4">
                <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="h-6 bg-white/20 rounded w-12"></div>
                  <div className="h-3 bg-white/20 rounded w-12"></div>
                  <div className="h-5 bg-white/20 rounded w-12"></div>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                <div className="h-8 bg-white/20 rounded w-28 mb-1"></div>
                <div className="h-3 bg-white/20 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ReligiousEducationSection Skeleton
export function ReligiousEducationSkeleton() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Skeleton */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-pulse">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 rounded-full mb-4 sm:mb-5">
            <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
            <div className="h-3 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-lg w-1/2 mx-auto mb-3 sm:mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8 lg:mb-12 animate-pulse">
          {/* Total Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 lg:p-8 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4"></div>
            <div className="h-8 sm:h-10 bg-white/20 rounded w-24 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-32"></div>
          </div>

          {/* Formal Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 lg:p-8 border border-blue-100/50">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl"></div>
              <div className="h-8 sm:h-10 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-1 sm:mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>

          {/* Non-Formal Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 lg:p-8 border border-orange-100/50">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl"></div>
              <div className="h-8 sm:h-10 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-1 sm:mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-28"></div>
          </div>
        </div>

        {/* Category Tabs & Data Skeleton */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden animate-pulse">
          <div className="flex border-b border-gray-200">
            <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-blue-50">
              <div className="h-4 bg-blue-200 rounded w-24 mx-auto"></div>
            </div>
            <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4">
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-xl"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// RemoteSPPGSection Skeleton
export function RemoteSPPGSkeleton() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Skeleton */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-pulse">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 rounded-full mb-4 sm:mb-5">
            <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
            <div className="h-3 w-24 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-lg w-1/3 mx-auto mb-3 sm:mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>

        {/* Stats Card Skeleton */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden mb-6 sm:mb-8 lg:mb-12 animate-pulse">
          <div className="p-5 sm:p-6 lg:p-8 xl:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-center">
                  <div className="h-12 sm:h-16 bg-white/20 rounded w-20 mx-auto mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="h-3 bg-white/20 rounded w-full mb-2"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden animate-pulse">
          <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Mobile Cards */}
          <div className="block lg:hidden p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4">
                <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 py-4 border-b border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// SPPGDistributionTabsNew Skeleton
export function SPPGDistributionTabsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Main Tabs Skeleton */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-4 border-b-3 border-transparent">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Tabs Skeleton */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 px-6 py-3">
          {[1, 2].map((i) => (
            <div key={i} className="px-4 py-2 bg-white rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="w-full sm:w-48">
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Mobile Cards */}
        <div className="block lg:hidden space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Table Rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b border-gray-200 p-4">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex-1">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
