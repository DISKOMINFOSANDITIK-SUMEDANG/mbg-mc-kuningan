'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IconSearch, IconMapPin, IconFilter, IconX, IconUsers, IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { searchSchools, getSchools, School } from '@/lib/api-client';
import AppLayout from '@/components/shared/AppLayout';
import { SearchPageSkeleton } from '@/components/shared/PageSkeletons';
import { SkeletonList } from '@/components/shared/Skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [filteredResults, setFilteredResults] = useState<School[]>([]);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    district: '',
    village: '',
    maxDistance: 50, // in km
    userLocation: null as { lat: number; lng: number } | null
  });
  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedResults, setPaginatedResults] = useState<School[]>([]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const schools = await getSchools();
        // Filter out Demo School from the list
        const filteredSchools = schools.filter(school => school.name !== 'Demo School');
        setAllSchools(filteredSchools);
        
        // If there's no search query, show all schools
        if (!searchQuery) {
          setSearchResults(filteredSchools);
          setFilteredResults(filteredSchools);
        }
        
        // Extract unique districts and villages
        const uniqueDistricts = [...new Set(filteredSchools.map(school => school.district))];
        const uniqueVillages = [...new Set(filteredSchools.map(school => school.village))];
        setDistricts(uniqueDistricts);
        setVillages(uniqueVillages);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Handle search query changes
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery) {
        try {
          setLoading(true);
          const results = await searchSchools(searchQuery);
          // Filter out Demo School from search results
          const filteredResults = results.filter(school => school.name !== 'Demo School');
          setSearchResults(filteredResults);
          setFilteredResults(filteredResults);
          setCurrentPage(1); // Reset to first page
        } catch (error) {
          console.error('Error loading search results:', error);
          setSearchResults([]);
          setFilteredResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        // If no search query, show all schools
        setSearchResults(allSchools);
        setFilteredResults(allSchools);
        setCurrentPage(1);
      }
    };

    if (allSchools.length > 0) {
      handleSearch();
    }
  }, [searchQuery, allSchools]);

  // Apply filters
  useEffect(() => {
    let filtered = [...searchResults];

    // Filter by district
    if (filters.district) {
      filtered = filtered.filter(school => school.district === filters.district);
    }

    // Filter by village
    if (filters.village) {
      filtered = filtered.filter(school => school.village === filters.village);
    }

    // Filter by distance
    if (filters.userLocation && filters.maxDistance < 50) {
      filtered = filtered.filter(school => {
        if (!school.coordinates) return true;
        
        const distance = calculateDistance(
          filters.userLocation!.lat,
          filters.userLocation!.lng,
          school.coordinates.lat,
          school.coordinates.lng
        );
        
        return distance <= filters.maxDistance;
      });
    }

    setFilteredResults(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchResults, filters]);

  // Handle pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedResults(filteredResults.slice(startIndex, endIndex));
  }, [filteredResults, currentPage, itemsPerPage]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSchoolSelect = (school: School) => {
    router.push(`/schools/${school.id}`);
  };

  const clearFilters = () => {
    setFilters({
      district: '',
      village: '',
      maxDistance: 50,
      userLocation: filters.userLocation
    });
  };

  const getDistanceText = (school: School) => {
    if (!filters.userLocation || !school.coordinates) return null;
    
    const distance = calculateDistance(
      filters.userLocation.lat,
      filters.userLocation.lng,
      school.coordinates.lat,
      school.coordinates.lng
    );
    
    return `${distance.toFixed(1)} km`;
  };

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconChevronLeft className="h-4 w-4" />
          Sebelumnya
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 py-2 text-gray-400">...</span>}
          </>
        )}
        
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              currentPage === page
                ? 'text-blue-600 bg-blue-50 border border-blue-300'
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 py-2 text-gray-400">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Selanjutnya
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Daftar Sekolah'}
          </h1>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Hasil pencarian sekolah berdasarkan kata kunci yang Anda masukkan'
              : 'Temukan sekolah yang sesuai dengan kriteria Anda'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search and Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Sekolah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchQuery);
                      }
                    }}
                    placeholder="Cari nama sekolah..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <IconFilter className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {showFilters ? 'Sembunyikan' : 'Tampilkan'}
                  </span>
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="space-y-4">
                  {/* District Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kecamatan
                    </label>
                    <select
                      value={filters.district}
                      onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Semua Kecamatan</option>
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  {/* Village Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desa/Kelurahan
                    </label>
                    <select
                      value={filters.village}
                      onChange={(e) => setFilters(prev => ({ ...prev, village: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Semua Desa</option>
                      {villages.map(village => (
                        <option key={village} value={village}>{village}</option>
                      ))}
                    </select>
                  </div>

                  {/* Distance Filter */}
                  {filters.userLocation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jarak Maksimal: {filters.maxDistance} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={filters.maxDistance}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 km</span>
                        <span>50 km</span>
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <IconX className="h-4 w-4" />
                    <span className="text-sm font-medium">Hapus Filter</span>
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold text-gray-900">{paginatedResults.length}</span> dari{' '}
                  <span className="font-semibold text-gray-900">{filteredResults.length}</span> sekolah
                </p>
                {totalPages > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <SkeletonList items={6} />
            ) : paginatedResults.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedResults.map((school) => (
                  <div
                    key={school.id}
                    onClick={() => handleSchoolSelect(school)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <IconMapPin className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {school.name}
                            </h3>
                            <p className="text-gray-600 mb-2">{school.address}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <IconUsers className="h-4 w-4 mr-1" />
                                {school.studentCount} siswa
                              </span>
                              <span className="flex items-center">
                                <IconCalendar className="h-4 w-4 mr-1" />
                                {school.district}
                              </span>
                              {getDistanceText(school) && (
                                <span className="flex items-center text-blue-600 font-medium">
                                  <IconMapPin className="h-4 w-4 mr-1" />
                                  {getDistanceText(school)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          school.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : school.status === 'Pilot'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {school.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {renderPagination()}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconSearch className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada sekolah yang ditemukan
                </h3>
                <p className="text-gray-600 mb-6">
                  Coba ubah kata kunci pencarian atau filter yang digunakan
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Hapus Semua Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
