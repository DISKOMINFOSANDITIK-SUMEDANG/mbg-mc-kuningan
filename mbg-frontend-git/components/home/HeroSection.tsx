"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconMapPin,
  IconUsers,
  IconCalendar,
  IconCheck,
  IconBuilding,
  IconX,
} from "@tabler/icons-react";
import {
  searchSchools,
  School,
  getStatistics,
  Statistics,
} from "@/lib/api-client";
import { HeroSkeleton } from "@/components/shared/HomeSectionSkeletons";

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted on client before showing interactive elements
  useEffect(() => {
    setIsMounted(true);
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeSearchModal();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSearchModal();
      }
    };

    if (showSearchModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [showSearchModal]);

  const openSearchModal = () => {
    setShowSearchModal(true);
    // Scroll to top when opening modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        setIsSearching(true);
        const results = await searchSchools(query);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    router.push(`/schools/${school.id}`);
    closeSearchModal();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearchModal();
    }
  };

  // Show skeleton while loading
  if (loading) {
    return <HeroSkeleton />;
  }

  return (
    <section
      id="home"
      className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50/30 flex items-center px-4"
    >
      {/* Enhanced Background Pattern */}
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
        
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto w-full pt-20 sm:pt-24 pb-32">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            <span className="hidden sm:inline">
              Program Nasional Presiden RI
            </span>
            <span className="sm:hidden">Program Nasional RI</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 mb-6 leading-tight px-4 tracking-tight">
            Cari Menu Makanan
            <span className="block bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 bg-clip-text text-transparent mt-2">
              Bergizi Gratis
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed px-4 font-medium">
            Temukan menu bergizi yang disajikan setiap hari
          </p>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto px-4">
            di sekolah-sekolah pelaksana Program MBG Kabupaten Sumedang
          </p>
        </div>

        {/* Search Section */}
        <div id="search" className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
          <div className="relative group">
            {/* Glow effect on focus */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-3xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-500"></div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 md:pl-8 flex items-center pointer-events-none">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-focus-within:scale-110 transition-transform duration-300">
                  <IconSearch className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <input
                type="text"
                placeholder="Cari nama sekolah, kecamatan, atau alamat..."
                onFocus={openSearchModal}
                onClick={openSearchModal}
                readOnly
                className="w-full pl-16 sm:pl-20 md:pl-24 pr-16 sm:pr-20 md:pr-24 py-5 sm:py-6 md:py-8 text-sm sm:text-base md:text-lg border-2 border-gray-200 rounded-xl sm:rounded-2xl md:rounded-3xl focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-xl hover:shadow-2xl focus:shadow-2xl bg-white/90 backdrop-blur-md font-medium placeholder:text-gray-400 cursor-pointer"
              />
              <div className="absolute inset-y-0 right-0 pr-4 sm:pr-6 md:pr-8 flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                  <span className="text-xs font-semibold text-green-700">Live</span>
                </div>
                <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                  Enter
                </kbd>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Search Modal - Outside of relative container for proper fixed positioning */}
      {isMounted && showSearchModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-2 sm:pt-4 md:pt-8 px-2 sm:px-4 py-2 sm:py-4 animate-fade-in overflow-y-auto">
          {/* Backdrop with blur - Full coverage */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10" onClick={closeSearchModal}></div>
          
          {/* Modal Content */}
          <div 
            ref={modalRef}
            className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10 my-2 sm:my-4"
            style={{ maxHeight: 'calc(92vh - 2rem)' }}
          >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <IconSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama sekolah..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onKeyPress={handleKeyPress}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white font-medium placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    onClick={closeSearchModal}
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors duration-200"
                    aria-label="Close search"
                  >
                    <IconX className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </button>
                </div>

                {/* Search Status */}
                <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                  {isSearching && (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-blue-700">Mencari...</span>
                    </div>
                  )}
                  {searchQuery.length > 0 && !isSearching && (
                    <div className="text-sm text-gray-600">
                      {searchResults.length > 0 ? (
                        <span className="font-medium">{searchResults.length} hasil ditemukan</span>
                      ) : searchQuery.length >= 2 ? (
                        <span className="text-gray-500">Tidak ada hasil</span>
                      ) : (
                        <span className="text-gray-400">Ketik minimal 2 karakter</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Body - Search Results */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 10rem)' }}>
                {showResults && searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((school) => (
                      <div
                        key={school.id}
                        onClick={() => handleSchoolSelect(school)}
                        className="p-4 sm:p-5 md:p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50/30 cursor-pointer transition-all duration-300 group active:bg-blue-50"
                      >
                        <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                              <IconBuilding className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {school.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 line-clamp-2 leading-relaxed">
                              {school.address}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3">
                              <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 bg-blue-50 rounded-md sm:rounded-lg text-xs font-semibold text-blue-700 border border-blue-200">
                                <IconUsers className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                                <span className="hidden xs:inline">{school.studentCount} siswa</span>
                                <span className="xs:hidden">{school.studentCount}</span>
                              </span>
                              <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 bg-green-50 rounded-md sm:rounded-lg text-xs font-semibold text-green-700 border border-green-200">
                                <IconMapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                                <span className="truncate max-w-[120px] sm:max-w-none">{school.district}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 hidden sm:block">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                                school.status === "Active"
                                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                  : school.status === "Pilot"
                                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              <IconCheck className="h-3.5 w-3.5 mr-1" />
                              {school.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : showResults && searchQuery.length >= 2 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <IconSearch className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                      Tidak ada hasil ditemukan
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 px-4">
                      Tidak ada sekolah yang ditemukan untuk &quot;{searchQuery}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <IconSearch className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                      Mulai Pencarian
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 px-4">
                      Ketik minimal 2 karakter untuk mencari sekolah
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
      )}
    </section>
  );
}
