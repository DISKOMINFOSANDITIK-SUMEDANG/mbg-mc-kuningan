'use client';

import AppLayout from './AppLayout';
import { 
  SkeletonHero, 
  SkeletonStats, 
  SkeletonSearchForm, 
  SkeletonList, 
  SkeletonTable, 
  SkeletonCard,
  Skeleton,
  SkeletonText
} from './Skeleton';

// Home Page Skeleton
export function HomePageSkeleton() {
  return (
    <AppLayout className="bg-white">
      {/* Hero Section Skeleton */}
      <SkeletonHero className="bg-blue-50" />

      {/* Stats Section Skeleton */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton variant="text" height={40} className="w-1/2 mx-auto mb-6" />
            <Skeleton variant="text" className="w-3/4 mx-auto" />
          </div>
          <SkeletonStats count={4} />
        </div>
      </section>

      {/* About Section Skeleton */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton variant="text" height={32} className="w-3/4" />
              <div className="space-y-3">
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-4/5" />
              </div>
            </div>
            <Skeleton variant="rectangular" height={300} />
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

// Contact Page Skeleton
export function ContactPageSkeleton() {
  return (
    <AppLayout className="bg-white">
      {/* Hero Section */}
      <SkeletonHero className="bg-blue-50" />

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Skeleton variant="text" height={32} className="w-1/2" />
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <Skeleton variant="circular" width={48} height={48} />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-1/3" />
                    <Skeleton variant="text" className="w-full" />
                    <Skeleton variant="text" className="w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Map Skeleton */}
            <div className="mt-8">
              <Skeleton variant="text" className="w-1/4 mb-4" />
              <Skeleton variant="rectangular" height={256} />
            </div>
          </div>

          {/* Contact Form */}
          <div className="space-y-8">
            <Skeleton variant="text" height={32} className="w-1/2" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
              </div>
              <Skeleton variant="rectangular" height={120} />
              <Skeleton variant="rectangular" height={48} />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <Skeleton variant="text" height={32} className="w-1/3 mx-auto mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Search Page Skeleton
export function SearchPageSkeleton() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <Skeleton variant="text" height={32} className="w-1/3 mb-2" />
          <Skeleton variant="text" className="w-2/3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search and Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8 space-y-6">
              {/* Search Input */}
              <div>
                <Skeleton variant="text" className="w-1/3 mb-2" />
                <Skeleton variant="rectangular" height={40} />
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="w-1/4" />
                <Skeleton variant="text" className="w-1/3" />
              </div>

              {/* Filters */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton variant="text" className="w-1/3 mb-2" />
                    <Skeleton variant="rectangular" height={40} />
                  </div>
                ))}
                <Skeleton variant="rectangular" height={40} />
              </div>

              {/* Results Count */}
              <div className="pt-6 border-t border-gray-200">
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-2/3 mt-1" />
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <SkeletonList items={6} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Data Page Skeleton (for sppg, progress, etc.)
export function DataPageSkeleton({ heroTitle = "Data Page", statCount = 3 }: { 
  heroTitle?: string; 
  statCount?: number; 
}) {
  return (
    <AppLayout className="bg-white">
      {/* Hero Section */}
      <section className="bg-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="space-y-4">
              <Skeleton variant="text" height={48} className="w-2/3 mx-auto" />
              <Skeleton variant="text" height={24} className="w-1/3 mx-auto" />
            </div>
            <div className="max-w-4xl mx-auto mt-6 space-y-2">
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-4/5 mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton variant="text" height={32} className="w-1/3 mx-auto mb-6" />
            <Skeleton variant="text" className="w-2/3 mx-auto" />
          </div>
          <SkeletonStats count={statCount} />
        </div>
      </section>

      {/* Chart Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton variant="text" height={32} className="w-1/2 mx-auto mb-4" />
            <Skeleton variant="text" className="w-2/3 mx-auto" />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton variant="rectangular" height={384} />
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton variant="text" height={32} className="w-1/2 mx-auto mb-4" />
            <Skeleton variant="text" className="w-2/3 mx-auto" />
          </div>

          {/* Search Filter */}
          <div className="mb-8 max-w-md mx-auto">
            <Skeleton variant="rectangular" height={48} />
          </div>

          <SkeletonTable rows={8} columns={4} />

          {/* Pagination */}
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" width={40} height={40} />
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

// Detail Page Skeleton (for school/sppg details)
export function DetailPageSkeleton() {
  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Skeleton variant="text" height={32} className="w-1/2 mx-auto" />
            <Skeleton variant="text" className="w-3/4 mx-auto" />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
              
              {/* Map */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <Skeleton variant="text" className="w-1/4 mb-4" />
                <Skeleton variant="rectangular" height={300} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

// Groups Page Skeleton
export function GroupsPageSkeleton() {
  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Skeleton variant="text" height={40} className="w-1/2 mx-auto mb-4" />
          <Skeleton variant="text" className="w-3/4 mx-auto" />
        </div>

        {/* Search Form */}
        <SkeletonSearchForm className="mb-8" />

        {/* Results */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton variant="text" height={24} className="w-1/4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
