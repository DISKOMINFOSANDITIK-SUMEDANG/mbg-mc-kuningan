'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  IconAlertTriangle,
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChefHat,
  IconEye,
  IconBuilding,
  IconCalendar,
  IconFilter,
  IconMapPin,
  IconSearch,
  IconUsers,
  IconX,
  IconFileSpreadsheet,
  IconFileTypePdf,
} from '@tabler/icons-react';
import { getSPPGs, getSPPGsPaginated, getSPPGDistributionsRecap, getStatistics, SPPG, SPPGDistributionRecap } from '@/lib/api-client';
import AppLayout from '@/components/shared/AppLayout';
import { SearchPageSkeleton } from '@/components/shared/PageSkeletons';
import { SkeletonList } from '@/components/shared/Skeleton';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/shared/MapView'), { ssr: false });

type SearchTab = 'list' | 'statistics' | 'reports';
type StatisticsListTab = 'complete' | 'incomplete';

interface BasicInfoField {
  label: string;
  getValue: (sppg: SPPG) => unknown;
}

interface SPPGCompletenessResult {
  sppg: SPPG;
  isComplete: boolean;
  reasons: string[];
  checklist: {
    key: 'basic-info' | 'facilities' | 'nutritionist' | 'slhs' | 'kitchen-photos';
    label: string;
    isFilled: boolean;
  }[];
}

interface ExportRow {
  no: number;
  idSppg: string;
  nama: string;
  lokasi: string;
  tipe: string;
  status: 'Lengkap' | 'Tidak Lengkap';
  informasiDasar: string;
  fasilitas: string;
  ahliGizi: string;
  sertifikatSlhs: string;
  fotoDapur: string;
  alasan: string;
  detailUrl: string;
}

interface SPPGMonthlyReportRow {
  id: string;
  name: string;
  location: string;
  totalReports: number;
  isInactive: boolean;
}

const BASIC_INFO_FIELDS: BasicInfoField[] = [
  { label: 'ID SPPG', getValue: (sppg) => sppg.id_sppg },
  { label: 'Nama SPPG', getValue: (sppg) => sppg.name },
  { label: 'Tipe', getValue: (sppg) => sppg.type },
  { label: 'Kapasitas', getValue: (sppg) => sppg.capacity },
  { label: 'Lokasi', getValue: (sppg) => sppg.location },
  { label: 'Telepon', getValue: (sppg) => sppg.contact?.phone || sppg.phone },
  { label: 'Email', getValue: (sppg) => sppg.contact?.email || sppg.email },
  { label: 'Alamat', getValue: (sppg) => sppg.contact?.address || sppg.address },
  { label: 'Jam Mulai Operasional', getValue: (sppg) => sppg.operatingHours?.start || sppg.operating_hours_start },
  { label: 'Jam Selesai Operasional', getValue: (sppg) => sppg.operatingHours?.end || sppg.operating_hours_end },
];

const COMPLETENESS_RULES = {
  minimumFacilitiesExclusive: 4,
  minimumKitchenPhotosExclusive: 5,
};
const BACKEND_PAGE_LIMIT = 10;
const SMART_SEARCH_MIN_CHARS = 2;
const REPORTS_ITEMS_PER_LOAD = 50;
const REPORTS_YEAR_START = 2026;
const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthlyDateRange = (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEndDate = new Date(year, month, 0);
  monthEndDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveEndDate = monthEndDate > today ? today : monthEndDate;
  const endDate = formatDateLocal(effectiveEndDate);

  const start = new Date(`${startDate}T00:00:00`);
  const diffMs = effectiveEndDate.getTime() - start.getTime();
  const dayCount = diffMs >= 0 ? Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1 : 0;

  return { startDate, endDate, dayCount, effectiveEndDate };
};

const fetchSPPGDistributionRecapSafe = async (startDate: string, endDate: string): Promise<SPPGDistributionRecap[]> => {
  const recapUrl = `/api/sppg-distribution-recap?startDate=${startDate}&endDate=${endDate}`;
  const recapResponse = await fetch(recapUrl);

  if (recapResponse.ok) {
    return recapResponse.json();
  }

  // Fallback: aggregate by SPPG from distributions recap endpoint
  const fallback = await getSPPGDistributionsRecap(startDate, endDate);
  const countById = new Map<string, number>();

  fallback.data.forEach((item) => {
    const key = String(item.id);
    countById.set(key, (countById.get(key) || 0) + 1);
  });

  return Array.from(countById.entries()).map(([id, updateCount]) => ({
    id,
    name: '',
    type: 'Dapur Konvensional',
    location: '',
    capacity: null,
    update_count: updateCount,
    total_portions: 0,
    distribution_dates: [],
    lastUpdateTime: null,
    reportingSchools: [],
    totalReportingSchools: 0,
  }));
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const scoreSPPGNameSearch = (sppg: SPPG, query: string) => {
  const normalizedQuery = normalizeText(query);
  const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!normalizedQuery || searchTerms.length === 0) return 0;

  const normalizedName = normalizeText(sppg.name || '');
  if (!normalizedName) return 0;

  const nameWords = normalizedName.split(/\s+/).filter(Boolean);
  const fullText = `${normalizedName} ${normalizeText(sppg.location || '')} ${normalizeText(sppg.type || '')}`;

  let score = 0;
  let matchedTerms = 0;

  if (normalizedName === normalizedQuery) score += 1000;
  if (normalizedName.startsWith(normalizedQuery)) score += 350;
  if (fullText.includes(normalizedQuery)) score += 220;

  searchTerms.forEach((term) => {
    let matched = false;

    if (nameWords.some((word) => word === term)) {
      score += 170;
      matched = true;
    } else if (nameWords.some((word) => word.startsWith(term))) {
      score += 130;
      matched = true;
    } else if (nameWords.some((word) => word.includes(term))) {
      score += 100;
      matched = true;
    } else if (normalizedName.includes(term)) {
      score += 75;
      matched = true;
    } else if (fullText.includes(term)) {
      score += 40;
      matched = true;
    }

    if (matched) matchedTerms += 1;
  });

  const coverage = matchedTerms / searchTerms.length;
  if (coverage === 1) score += 110;
  else if (coverage >= 0.8) score += 65;
  else if (coverage >= 0.5) score += 25;

  return score;
};

const smartSearchSPPGByName = (sppgs: SPPG[], query: string) => {
  const normalizedQuery = normalizeText(query);
  const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!normalizedQuery || searchTerms.length === 0) return [];

  const minCoverage = searchTerms.length <= 2 ? 0.5 : 0.6;

  return sppgs
    .map((sppg) => {
      const score = scoreSPPGNameSearch(sppg, normalizedQuery);
      const name = normalizeText(sppg.name || '');
      const matchedTerms = searchTerms.filter((term) => name.includes(term)).length;
      const coverage = searchTerms.length > 0 ? matchedTerms / searchTerms.length : 0;
      return { sppg, score, coverage };
    })
    .filter((item) => item.score > 0 && item.coverage >= minCoverage)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sppg);
};

const isFilled = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(isFilled);
  return Boolean(value);
};

const getKitchenPhotoCount = (sppg: SPPG) => {
  if (Array.isArray(sppg.kitchenPhotos)) return sppg.kitchenPhotos.length;
  if (typeof sppg.kitchen_photo_count === 'number') return sppg.kitchen_photo_count;
  return 0;
};

const getSPPGCompleteness = (sppg: SPPG): SPPGCompletenessResult => {
  const reasons: string[] = [];
  const missingBasicFields = BASIC_INFO_FIELDS
    .filter((field) => !isFilled(field.getValue(sppg)))
    .map((field) => field.label);
  const basicInfoComplete = missingBasicFields.length === 0;

  if (!basicInfoComplete) {
    reasons.push(`Informasi Dasar SPPG belum lengkap: ${missingBasicFields.join(', ')}`);
  }

  const facilitiesCount = Array.isArray(sppg.facilities) ? sppg.facilities.length : 0;
  const facilitiesComplete = facilitiesCount > COMPLETENESS_RULES.minimumFacilitiesExclusive;
  if (!facilitiesComplete) {
    reasons.push(`Jumlah data fasilitas saat ini adalah ${facilitiesCount}, sedangkan minimal yang disyaratkan adalah ${COMPLETENESS_RULES.minimumFacilitiesExclusive}`);
  }

  const nutritionistComplete = isFilled(sppg.nutritionist);
  if (!nutritionistComplete) {
    reasons.push('Ahli Gizi belum diisi');
  }

  const slhsComplete = isFilled(sppg.slhsCertificate);
  if (!slhsComplete) {
    reasons.push('Sertifikat SLHS belum diisi');
  }

  const kitchenPhotoCount = getKitchenPhotoCount(sppg);
  const kitchenPhotosComplete = kitchenPhotoCount > COMPLETENESS_RULES.minimumKitchenPhotosExclusive;
  if (!kitchenPhotosComplete) {
    reasons.push(`Jumlah data foto dapur saat ini adalah ${kitchenPhotoCount}, sedangkan minimal yang disyaratkan adalah ${COMPLETENESS_RULES.minimumKitchenPhotosExclusive}`);
  }

  return {
    sppg,
    isComplete: reasons.length === 0,
    reasons,
    checklist: [
      { key: 'basic-info', label: 'Informasi Dasar SPPG', isFilled: basicInfoComplete },
      { key: 'facilities', label: 'Fasilitas', isFilled: facilitiesComplete },
      { key: 'nutritionist', label: 'Ahli Gizi', isFilled: nutritionistComplete },
      { key: 'slhs', label: 'Sertifikat SLHS', isFilled: slhsComplete },
      { key: 'kitchen-photos', label: 'Foto Dapur', isFilled: kitchenPhotosComplete },
    ],
  };
};

function SPPGSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const requestedTab = searchParams.get('tab');
  const initialTab: SearchTab =
    requestedTab === 'statistics' ? 'statistics' : requestedTab === 'reports' ? 'reports' : 'list';
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [activeStatisticsListTab, setActiveStatisticsListTab] = useState<StatisticsListTab>('complete');
  const [statisticsRecords, setStatisticsRecords] = useState<SPPG[]>([]);
  const [statisticsPage, setStatisticsPage] = useState(1);
  const [statisticsHasMore, setStatisticsHasMore] = useState(false);
  const [loadingMoreStatistics, setLoadingMoreStatistics] = useState(false);
  const loadingMoreStatisticsRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [completeSearchQuery, setCompleteSearchQuery] = useState('');
  const [incompleteSearchQuery, setIncompleteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SPPG[]>([]);
  const [filteredResults, setFilteredResults] = useState<SPPG[]>([]);
  const [isSearchingSPPG, setIsSearchingSPPG] = useState(false);
  const [allSPPGs, setAllSPPGs] = useState<SPPG[]>([]);
  const [totalActiveSPPG, setTotalActiveSPPG] = useState<number | null>(null);
  const [openIncompleteIds, setOpenIncompleteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedReportMonth, setSelectedReportMonth] = useState(currentMonth);
  const [selectedReportYear, setSelectedReportYear] = useState(currentYear);
  const [monthlyReportRecap, setMonthlyReportRecap] = useState<SPPGDistributionRecap[]>([]);
  const [loadingMonthlyReport, setLoadingMonthlyReport] = useState(false);
  const [monthlyReportError, setMonthlyReportError] = useState<string | null>(null);
  const [exportingMonthlyReportExcel, setExportingMonthlyReportExcel] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportSppgs, setReportSppgs] = useState<SPPG[]>([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportHasMore, setReportHasMore] = useState(false);
  const [loadingReportSppgs, setLoadingReportSppgs] = useState(false);
  const [loadingMoreReportSppgs, setLoadingMoreReportSppgs] = useState(false);
  const loadingMoreReportSppgsRef = useRef(false);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    maxDistance: 50, // in km
    userLocation: null as { lat: number; lng: number } | null
  });
  const [types, setTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [paginatedResults, setPaginatedResults] = useState<SPPG[]>([]);

  const loadStatisticsPage = async (page: number, append: boolean) => {
    const response = await getSPPGsPaginated({ page, limit: BACKEND_PAGE_LIMIT });
    setStatisticsRecords((prev) => (append ? [...prev, ...response.data] : response.data));
    setStatisticsPage(response.pagination.page);
    setStatisticsHasMore(response.pagination.has_more);
    return response;
  };

  const loadReportSppgsPage = async (page: number, append: boolean) => {
    const trimmedQuery = reportSearchQuery.trim();
    const response = await getSPPGsPaginated({
      page,
      limit: REPORTS_ITEMS_PER_LOAD,
      q: trimmedQuery.length >= SMART_SEARCH_MIN_CHARS ? trimmedQuery : undefined,
    });
    setReportSppgs((prev) => (append ? [...prev, ...response.data] : response.data));
    setReportPage(response.pagination.page);
    setReportHasMore(response.pagination.has_more);
    return response;
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (activeTab === 'reports' || allSPPGs.length > 0) return;
      try {
        setLoading(true);
        const sppgs = await getSPPGs();
        setAllSPPGs(sppgs);
        
        // If there's no search query, show all SPPGs
        if (!searchQuery) {
          setSearchResults(sppgs);
          setFilteredResults(sppgs);
        }
        
        // Extract unique types and locations
        const uniqueTypes = [...new Set(sppgs.map(sppg => sppg.type))];
        const uniqueLocations = [...new Set(sppgs.map(sppg => sppg.location))];
        setTypes(uniqueTypes);
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [activeTab, allSPPGs.length]);

  // Get user location
  useEffect(() => {
    const getLocation = () => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
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
    };

    getLocation();
  }, []);

  useEffect(() => {
    const loadStatisticsInitial = async () => {
      try {
        await loadStatisticsPage(1, false);
      } catch (error) {
        console.error('Error loading statistics data:', error);
      }
    };

    loadStatisticsInitial();
  }, []);

  useEffect(() => {
    const loadTotalActiveSPPG = async () => {
      try {
        const stats = await getStatistics();
        setTotalActiveSPPG(Math.max(stats.totalSppgs || 0, 0));
      } catch (error) {
        console.error('Error loading total active SPPG:', error);
      }
    };

    loadTotalActiveSPPG();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const tab: SearchTab =
      tabParam === 'statistics' ? 'statistics' : tabParam === 'reports' ? 'reports' : 'list';
    setActiveTab(tab);
  }, [searchParams]);

  // Smart search berdasarkan nama SPPG (minimal 2 karakter)
  useEffect(() => {
    if (allSPPGs.length === 0) return;

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults(allSPPGs);
      setFilteredResults(allSPPGs);
      setCurrentPage(1);
      setIsSearchingSPPG(false);
      return;
    }

    if (trimmedQuery.length < SMART_SEARCH_MIN_CHARS) {
      setSearchResults(allSPPGs);
      setFilteredResults(allSPPGs);
      setCurrentPage(1);
      setIsSearchingSPPG(false);
      return;
    }

    setIsSearchingSPPG(true);
    const timer = setTimeout(() => {
      const results = smartSearchSPPGByName(allSPPGs, trimmedQuery);
      setSearchResults(results);
      setFilteredResults(results);
      setCurrentPage(1);
      setIsSearchingSPPG(false);
    }, 180);

    return () => {
      clearTimeout(timer);
      setIsSearchingSPPG(false);
    };
  }, [searchQuery, allSPPGs]);

  // Apply filters
  useEffect(() => {
    let filtered = [...searchResults];

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(sppg => sppg.type === filters.type);
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(sppg => sppg.location === filters.location);
    }

    // Filter by distance
    if (filters.userLocation && filters.maxDistance < 50) {
      filtered = filtered.filter(sppg => {
        if (!sppg.coordinates) return true;
        const distance = calculateDistance(
          filters.userLocation!.lat,
          filters.userLocation!.lng,
          sppg.coordinates.lat,
          sppg.coordinates.lng
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

  const buildSearchUrl = (nextParams: { q?: string; tab?: SearchTab }) => {
    const params = new URLSearchParams();
    const nextQuery = nextParams.q ?? searchQuery;
    const nextTab = nextParams.tab ?? activeTab;

    if (nextQuery) params.set('q', nextQuery);
    if (nextTab !== 'list') params.set('tab', nextTab);

    const queryString = params.toString();
    return queryString ? `/sppg-search?${queryString}` : '/sppg-search';
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    router.push(buildSearchUrl({ tab }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim();
    if (!trimmed || trimmed.length >= SMART_SEARCH_MIN_CHARS) {
      router.push(buildSearchUrl({ q: trimmed }));
    }
  };

  const handleSPPGSelect = (sppg: SPPG) => {
    router.push(`/sppg-info/${sppg.id}`);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      location: '',
      maxDistance: 50,
      userLocation: filters.userLocation
    });
  };

  const getDistanceText = (sppg: SPPG) => {
    if (!filters.userLocation) return null;
    
    if (!sppg.coordinates) return null;
    const distance = calculateDistance(
      filters.userLocation.lat,
      filters.userLocation.lng,
      sppg.coordinates.lat,
      sppg.coordinates.lng
    );
    
    return `${distance.toFixed(1)} km`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dapur Satelit Modular':
        return 'bg-blue-100 text-blue-800';
      case 'Dapur Konvensional':
        return 'bg-green-100 text-green-800';
      case 'Dapur Pusat':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (activeTab !== 'reports') return;

    const fetchMonthlyReports = async () => {
      try {
        setLoadingMonthlyReport(true);
        setMonthlyReportError(null);
        const { startDate, endDate } = getMonthlyDateRange(selectedReportYear, selectedReportMonth);
        const recapData = await fetchSPPGDistributionRecapSafe(startDate, endDate);
        setMonthlyReportRecap(recapData);
      } catch (error) {
        console.error('Error loading monthly SPPG report data:', error);
        setMonthlyReportRecap([]);
        setMonthlyReportError('Gagal memuat laporan SPPG bulanan');
      } finally {
        setLoadingMonthlyReport(false);
      }
    };

    fetchMonthlyReports();
  }, [activeTab, selectedReportMonth, selectedReportYear]);

  useEffect(() => {
    if (activeTab !== 'reports') return;

    const fetchReportSppgs = async () => {
      try {
        setLoadingReportSppgs(true);
        await loadReportSppgsPage(1, false);
      } catch (error) {
        console.error('Error loading paginated SPPG reports data:', error);
        setReportSppgs([]);
        setReportHasMore(false);
      } finally {
        setLoadingReportSppgs(false);
      }
    };

    const timer = setTimeout(fetchReportSppgs, 180);
    return () => clearTimeout(timer);
  }, [activeTab, reportSearchQuery]);

  const reportYearOptions = useMemo(() => {
    const startYear = Math.min(REPORTS_YEAR_START, currentYear);
    return Array.from({ length: currentYear - startYear + 1 }, (_, index) => startYear + index);
  }, [currentYear]);

  const monthlyReportRows = useMemo(() => {
    const recapById = new Map(monthlyReportRecap.map((item) => [String(item.id), item]));

    return reportSppgs
      .map<SPPGMonthlyReportRow>((sppg) => {
        const totalReports = Number(recapById.get(String(sppg.id))?.update_count ?? 0);

        return {
          id: String(sppg.id),
          name: sppg.name || '-',
          location: sppg.location || '-',
          totalReports,
          isInactive: sppg.is_active === false,
        };
      })
      .sort((a, b) => {
        if (a.totalReports !== b.totalReports) return a.totalReports - b.totalReports;
        return a.name.localeCompare(b.name, 'id-ID');
      });
  }, [reportSppgs, monthlyReportRecap, selectedReportMonth, selectedReportYear]);

  const filteredMonthlyReportRows = useMemo(() => {
    const trimmed = reportSearchQuery.trim();
    if (!trimmed || trimmed.length < SMART_SEARCH_MIN_CHARS) return monthlyReportRows;

    const matchedIds = new Set(smartSearchSPPGByName(reportSppgs, trimmed).map((sppg) => String(sppg.id)));
    return monthlyReportRows.filter((row) => matchedIds.has(row.id));
  }, [reportSearchQuery, monthlyReportRows, reportSppgs]);

  const overallCompletenessResults = useMemo(() => allSPPGs.map(getSPPGCompleteness), [allSPPGs]);
  const tableCompletenessResults = useMemo(() => statisticsRecords.map(getSPPGCompleteness), [statisticsRecords]);
  const completeSPPGs = tableCompletenessResults.filter((result) => result.isComplete);
  const incompleteSPPGs = tableCompletenessResults.filter((result) => !result.isComplete);
  const filteredCompleteSPPGs = useMemo(() => {
    const trimmed = completeSearchQuery.trim();
    if (!trimmed || trimmed.length < SMART_SEARCH_MIN_CHARS) return completeSPPGs;
    const matchedIds = new Set(smartSearchSPPGByName(completeSPPGs.map((item) => item.sppg), trimmed).map((sppg) => sppg.id));
    return completeSPPGs.filter((item) => matchedIds.has(item.sppg.id));
  }, [completeSPPGs, completeSearchQuery]);
  const filteredIncompleteSPPGs = useMemo(() => {
    const trimmed = incompleteSearchQuery.trim();
    if (!trimmed || trimmed.length < SMART_SEARCH_MIN_CHARS) return incompleteSPPGs;
    const matchedIds = new Set(smartSearchSPPGByName(incompleteSPPGs.map((item) => item.sppg), trimmed).map((sppg) => sppg.id));
    return incompleteSPPGs.filter((item) => matchedIds.has(item.sppg.id));
  }, [incompleteSPPGs, incompleteSearchQuery]);
  const totalSPPGs = totalActiveSPPG ?? Math.max(allSPPGs.length, 0);
  const totalCompleteSPPGsRaw = overallCompletenessResults.filter((result) => result.isComplete).length;
  const totalCompleteSPPGs = Math.min(totalCompleteSPPGsRaw, totalSPPGs);
  const totalIncompleteSPPGs = Math.max(totalSPPGs - totalCompleteSPPGs, 0);
  const completePercentage = totalSPPGs > 0 ? Math.round((totalCompleteSPPGs / totalSPPGs) * 100) : 0;
  const incompletePercentage = totalSPPGs > 0 ? 100 - completePercentage : 0;
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const getExportRows = (): ExportRow[] =>
    overallCompletenessResults.map((result, index) => {
      const checklistMap = new Map(result.checklist.map((item) => [item.key, item]));
      return {
        no: index + 1,
        idSppg: result.sppg.id_sppg || '-',
        nama: result.sppg.name || '-',
        lokasi: result.sppg.location || '-',
        tipe: result.sppg.type || '-',
        status: result.isComplete ? 'Lengkap' : 'Tidak Lengkap',
        informasiDasar: checklistMap.get('basic-info')?.isFilled ? 'Lengkap' : 'Tidak Lengkap',
        fasilitas: checklistMap.get('facilities')?.isFilled ? 'Lengkap' : 'Tidak Lengkap',
        ahliGizi: checklistMap.get('nutritionist')?.isFilled ? 'Lengkap' : 'Tidak Lengkap',
        sertifikatSlhs: checklistMap.get('slhs')?.isFilled ? 'Lengkap' : 'Tidak Lengkap',
        fotoDapur: checklistMap.get('kitchen-photos')?.isFilled ? 'Lengkap' : 'Tidak Lengkap',
        alasan: result.reasons.length > 0 ? result.reasons.join(' | ') : '-',
        detailUrl: `${window.location.origin}/sppg-info/${result.sppg.id}`,
      };
    });

  const handleExportExcelReport = async () => {
    try {
      setExportingExcel(true);
      const rows = getExportRows();
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan SPPG');

      worksheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'ID SPPG', key: 'idSppg', width: 16 },
        { header: 'Nama SPPG', key: 'nama', width: 40 },
        { header: 'Lokasi', key: 'lokasi', width: 42 },
        { header: 'Tipe', key: 'tipe', width: 24 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Informasi Dasar', key: 'informasiDasar', width: 18 },
        { header: 'Fasilitas', key: 'fasilitas', width: 14 },
        { header: 'Ahli Gizi', key: 'ahliGizi', width: 14 },
        { header: 'Sertifikat SLHS', key: 'sertifikatSlhs', width: 18 },
        { header: 'Foto Dapur', key: 'fotoDapur', width: 14 },
        { header: 'Alasan Ketidaklengkapan', key: 'alasan', width: 64 },
        { header: 'Link Detail', key: 'detailUrl', width: 48 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      };

      rows.forEach((row) => {
        const excelRow = worksheet.addRow(row);
        excelRow.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

        if (row.status === 'Lengkap') {
          excelRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE8F6EE' },
            };
          });
        }

        const statusCell = excelRow.getCell('status');
        statusCell.font = { bold: true, color: { argb: row.status === 'Lengkap' ? 'FF15803D' : 'FFB91C1C' } };
      });

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_SPPG_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel report:', error);
      alert('Gagal mengekspor laporan Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportMonthlyReportExcel = async () => {
    try {
      setExportingMonthlyReportExcel(true);
      const rows = filteredMonthlyReportRows;
      const selectedMonthLabel = MONTH_OPTIONS.find((month) => month.value === selectedReportMonth)?.label || selectedReportMonth;
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan SPPG Bulanan');

      worksheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama SPPG', key: 'name', width: 38 },
        { header: 'Lokasi', key: 'location', width: 28 },
        { header: `Total Laporan (${selectedMonthLabel} ${selectedReportYear})`, key: 'totalReports', width: 28 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      };

      rows.forEach((row, index) => {
        const excelRow = worksheet.addRow({
          no: index + 1,
          name: row.name,
          location: row.location,
          totalReports: row.totalReports,
        });
        excelRow.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      });

      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          };
        });

        if (rowNumber > 1) {
          const totalReportsCell = row.getCell('totalReports');
          if (Number(totalReportsCell.value) === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF1F2' },
              };
            });
          }
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_SPPG_${selectedMonthLabel}_${selectedReportYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting monthly SPPG report:', error);
      alert('Gagal mengekspor laporan SPPG bulanan');
    } finally {
      setExportingMonthlyReportExcel(false);
    }
  };

  const handleExportPdfReport = async () => {
    try {
      setExportingPdf(true);
      const rows = getExportRows();
      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        alert('Popup diblokir browser. Izinkan popup untuk ekspor PDF.');
        return;
      }

      const tableRowsHtml = rows
        .map(
          (row) => `
            <tr class="${row.status === 'Lengkap' ? 'row-complete' : ''}">
              <td>${row.no}</td>
              <td>${row.idSppg}</td>
              <td>${row.nama}</td>
              <td>${row.lokasi}</td>
              <td>${row.tipe}</td>
              <td><span class="status-badge ${row.status === 'Lengkap' ? 'status-complete' : 'status-incomplete'}">${row.status}</span></td>
              <td>${row.informasiDasar}</td>
              <td>${row.fasilitas}</td>
              <td>${row.ahliGizi}</td>
              <td>${row.sertifikatSlhs}</td>
              <td>${row.fotoDapur}</td>
              <td>${row.alasan}</td>
            </tr>
          `
        )
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="utf-8" />
            <title>Laporan SPPG</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
              h1 { margin: 0 0 8px; font-size: 22px; }
              .subtitle { margin: 0 0 20px; font-size: 13px; color: #6B7280; }
              .stats { display: flex; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
              .stat { border: 1px solid #D1D5DB; border-radius: 8px; padding: 8px 10px; font-size: 12px; }
              .stat strong { display: block; font-size: 16px; color: #111827; margin-top: 4px; }
              table { border-collapse: collapse; width: 100%; font-size: 11px; }
              th, td { border: 1px solid #D1D5DB; padding: 6px; vertical-align: top; text-align: left; }
              th { background: #1E40AF; color: #FFFFFF; position: sticky; top: 0; }
              .status-badge { padding: 2px 7px; border-radius: 9999px; font-weight: 700; font-size: 10px; display: inline-block; }
              .status-complete { background: #DCFCE7; color: #166534; }
              .status-incomplete { background: #FEE2E2; color: #991B1B; }
              .row-complete td { background: #F0FDF4; }
              @media print { body { margin: 10px; } }
            </style>
          </head>
          <body>
            <h1>Laporan Kelengkapan Data SPPG</h1>
            <p class="subtitle">Mencakup seluruh data SPPG: Lengkap dan Tidak Lengkap</p>
            <div class="stats">
              <div class="stat">Total SPPG<strong>${totalSPPGs}</strong></div>
              <div class="stat">SPPG Lengkap<strong>${totalCompleteSPPGs}</strong></div>
              <div class="stat">SPPG Tidak Lengkap<strong>${totalIncompleteSPPGs}</strong></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID SPPG</th>
                  <th>Nama SPPG</th>
                  <th>Lokasi</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Informasi Dasar</th>
                  <th>Fasilitas</th>
                  <th>Ahli Gizi</th>
                  <th>Sertifikat SLHS</th>
                  <th>Foto Dapur</th>
                  <th>Alasan Ketidaklengkapan</th>
                </tr>
              </thead>
              <tbody>${tableRowsHtml}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error exporting PDF report:', error);
      alert('Gagal mengekspor laporan PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleIncompleteAccordion = (id: string) => {
    setOpenIncompleteIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleLoadMoreStatistics = async () => {
    if (!statisticsHasMore || loadingMoreStatisticsRef.current) return;
    try {
      loadingMoreStatisticsRef.current = true;
      setLoadingMoreStatistics(true);
      let nextPage = statisticsPage;
      let hasMore: boolean = statisticsHasMore;
      let foundRelevantItem = false;

      while (hasMore && !foundRelevantItem) {
        const response = await loadStatisticsPage(nextPage + 1, true);
        nextPage = response.pagination.page;
        hasMore = response.pagination.has_more;
        if (response.data.length === 0) break;

        foundRelevantItem = response.data.some((sppg) => {
          const result = getSPPGCompleteness(sppg);
          return activeStatisticsListTab === 'complete' ? result.isComplete : !result.isComplete;
        });
      }
    } catch (error) {
      console.error('Error loading more statistics data:', error);
    } finally {
      loadingMoreStatisticsRef.current = false;
      setLoadingMoreStatistics(false);
    }
  };

  const handleLoadMoreReports = async () => {
    if (!reportHasMore || loadingMoreReportSppgsRef.current) return;
    try {
      loadingMoreReportSppgsRef.current = true;
      setLoadingMoreReportSppgs(true);
      await loadReportSppgsPage(reportPage + 1, true);
    } catch (error) {
      console.error('Error loading more paginated SPPG reports:', error);
    } finally {
      loadingMoreReportSppgsRef.current = false;
      setLoadingMoreReportSppgs(false);
    }
  };

  useEffect(() => {
    const currentListCount = activeStatisticsListTab === 'complete' ? completeSPPGs.length : incompleteSPPGs.length;
    if (activeTab !== 'statistics') return;
    if (loading || loadingMoreStatistics) return;
    if (currentListCount > 0) return;
    if (!statisticsHasMore) return;

    handleLoadMoreStatistics();
  }, [
    activeTab,
    activeStatisticsListTab,
    completeSPPGs.length,
    incompleteSPPGs.length,
    statisticsHasMore,
    loading,
    loadingMoreStatistics,
  ]);

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

  const renderSPPGSummaryRow = (result: SPPGCompletenessResult) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_0.9fr_0.8fr_0.8fr_auto] gap-3 md:gap-4 items-start">
        <div>
          <p className="font-semibold text-gray-900">{result.sppg.name}</p>
          <p className="text-sm text-gray-500 mt-1">{result.sppg.location || '-'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase">Tipe</p>
          <p className="text-sm text-gray-700 mt-1">{result.sppg.type || '-'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase">Fasilitas</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{result.sppg.facilities?.length || 0}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase">Foto Dapur</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{getKitchenPhotoCount(result.sppg)}</p>
        </div>
        <div className="flex items-center justify-start md:justify-end">
          <button
            type="button"
            onClick={() => router.push(`/sppg-info/${result.sppg.id}`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <IconEye className="h-4 w-4" />
            Detail
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {result.checklist.map((item, index) => (
            <div
              key={item.key}
              className={`px-3 py-2.5 flex items-center justify-between gap-2 ${index < result.checklist.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-gray-200' : ''}`}
            >
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
              {item.isFilled ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                  <IconCheck className="h-4 w-4" />
                </span>
              ) : (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700">
                  <IconX className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-y-6">
      {loading ? (
        <SkeletonList items={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                { label: 'Total SPPG', value: totalSPPGs.toLocaleString('id-ID'), color: 'bg-blue-50 text-blue-700', icon: IconChefHat },
                { label: 'SPPG Lengkap', value: totalCompleteSPPGs.toLocaleString('id-ID'), color: 'bg-emerald-50 text-emerald-700', icon: IconCheck },
                { label: 'SPPG Belum Lengkap', value: totalIncompleteSPPGs.toLocaleString('id-ID'), color: 'bg-red-50 text-red-700', icon: IconAlertTriangle },
              { label: 'Persentase Lengkap', value: `${completePercentage}%`, color: 'bg-cyan-50 text-cyan-700', icon: IconChartBar },
              { label: 'Persentase Belum Lengkap', value: `${incompletePercentage}%`, color: 'bg-amber-50 text-amber-700', icon: IconChartBar },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">Laporan Kelengkapan SPPG</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcelReport}
                    disabled={exportingExcel || totalSPPGs === 0}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconFileSpreadsheet className="h-4 w-4" />
                    {exportingExcel ? 'Mengekspor Excel...' : 'Export Excel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdfReport}
                    disabled={exportingPdf || totalSPPGs === 0}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconFileTypePdf className="h-4 w-4" />
                    {exportingPdf ? 'Mengekspor PDF...' : 'Export PDF'}
                  </button>
                </div>
              </div>
              <div className="inline-flex bg-gray-50 rounded-xl border border-gray-200 p-1">
                {[
                  {
                    id: 'complete' as StatisticsListTab,
                    label: 'Daftar SPPG Lengkap',
                    count: totalCompleteSPPGs,
                    activeClass: 'bg-emerald-600 text-white shadow-sm',
                    inactiveClass: 'text-gray-600 hover:text-gray-900 hover:bg-white',
                  },
                  {
                    id: 'incomplete' as StatisticsListTab,
                    label: 'Daftar SPPG Belum Lengkap',
                    count: totalIncompleteSPPGs,
                    activeClass: 'bg-red-600 text-white shadow-sm',
                    inactiveClass: 'text-gray-600 hover:text-gray-900 hover:bg-white',
                  },
                ].map((tab) => {
                  const isActive = activeStatisticsListTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveStatisticsListTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? tab.activeClass : tab.inactiveClass}`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeStatisticsListTab === 'complete' ? (
                <p className="text-sm text-gray-500">SPPG yang memenuhi semua aturan kelengkapan data</p>
              ) : (
                <p className="text-sm text-gray-500">Buka setiap item untuk melihat alasan data belum lengkap</p>
              )}

              {activeStatisticsListTab === 'complete' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cari Nama SPPG Lengkap</label>
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={completeSearchQuery}
                      onChange={(e) => setCompleteSearchQuery(e.target.value)}
                      placeholder="Ketik nama SPPG lengkap..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  {completeSearchQuery.trim().length > 0 && completeSearchQuery.trim().length < SMART_SEARCH_MIN_CHARS && (
                    <p className="text-xs text-amber-600">Ketik minimal {SMART_SEARCH_MIN_CHARS} karakter untuk mencari</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cari Nama SPPG Belum Lengkap</label>
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={incompleteSearchQuery}
                      onChange={(e) => setIncompleteSearchQuery(e.target.value)}
                      placeholder="Ketik nama SPPG belum lengkap..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  {incompleteSearchQuery.trim().length > 0 && incompleteSearchQuery.trim().length < SMART_SEARCH_MIN_CHARS && (
                    <p className="text-xs text-amber-600">Ketik minimal {SMART_SEARCH_MIN_CHARS} karakter untuk mencari</p>
                  )}
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {activeStatisticsListTab === 'complete' ? (
                filteredCompleteSPPGs.length > 0 ? (
                  filteredCompleteSPPGs.map((result) => (
                    <div key={result.sppg.id} className="p-5">
                      {renderSPPGSummaryRow(result)}
                    </div>
                  ))
                ) : completeSearchQuery.trim().length >= SMART_SEARCH_MIN_CHARS ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-gray-700">SPPG lengkap tidak ditemukan untuk kata kunci tersebut</p>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    {statisticsHasMore || loadingMoreStatistics ? (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                          <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Sedang mencari data SPPG lengkap...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <IconCheck className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Belum ada SPPG yang lengkap</p>
                      </>
                    )}
                  </div>
                )
              ) : filteredIncompleteSPPGs.length > 0 ? (
                filteredIncompleteSPPGs.map((result) => {
                  const isOpen = openIncompleteIds.includes(result.sppg.id);
                  return (
                    <div key={result.sppg.id} className="p-5 space-y-4">
                      {renderSPPGSummaryRow(result)}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => toggleIncompleteAccordion(result.sppg.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <span>{isOpen ? 'Sembunyikan Alasan' : 'Lihat Alasan'}</span>
                          <IconChevronDown className={`h-4 w-4 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {isOpen && (
                        <div>
                          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                            <p className="text-sm font-semibold text-red-800 mb-3">Alasan belum lengkap</p>
                            <ul className="space-y-2">
                              {result.reasons.map((reason) => (
                                <li key={reason} className="flex items-start gap-2 text-sm text-red-700">
                                  <IconAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : incompleteSearchQuery.trim().length >= SMART_SEARCH_MIN_CHARS ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-medium text-gray-700">SPPG belum lengkap tidak ditemukan untuk kata kunci tersebut</p>
                </div>
              ) : (
                <div className="p-10 text-center">
                  {statisticsHasMore || loadingMoreStatistics ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Sedang mencari data SPPG belum lengkap...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                        <IconCheck className="h-6 w-6 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Semua SPPG sudah lengkap</p>
                    </>
                  )}
                </div>
              )}
            </div>
            {statisticsHasMore && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreStatistics}
                  disabled={loadingMoreStatistics}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMoreStatistics ? (
                    <>
                      <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <IconChevronDown className="h-4 w-4" />
                      Muat Lebih Banyak
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderReportsTab = () => {
    const selectedMonthLabel = MONTH_OPTIONS.find((month) => month.value === selectedReportMonth)?.label || selectedReportMonth;
    const { dayCount, endDate } = getMonthlyDateRange(selectedReportYear, selectedReportMonth);
    const totalReports = monthlyReportRecap.reduce((sum, item) => sum + Number(item.update_count || 0), 0);
    const sppgsWithZeroReports = monthlyReportRows.filter((row) => row.totalReports === 0).length;
    const visibleRows = filteredMonthlyReportRows;
    const canLoadMoreRows = reportHasMore;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Monitoring Laporan SPPG Bulanan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Data diurutkan naik berdasarkan total laporan agar SPPG dengan aktivitas terendah terlihat lebih dulu.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMonthlyReportExcel}
              disabled={exportingMonthlyReportExcel || filteredMonthlyReportRows.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconFileSpreadsheet className="h-4 w-4" />
              {exportingMonthlyReportExcel ? 'Mengekspor Excel...' : 'Export Excel'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Bulan</label>
              <select
                value={selectedReportMonth}
                onChange={(event) => setSelectedReportMonth(Number(event.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tahun</label>
              <select
                value={selectedReportYear}
                onChange={(event) => setSelectedReportYear(Number(event.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {reportYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-700 font-medium">Total Laporan (Bulan Ini)</p>
              <p className="text-xl font-bold text-blue-900">{totalReports.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs text-red-700 font-medium">Total SPPG Yang Belum Lapor (Bulan Ini)</p>
              <p className="text-xl font-bold text-red-900">{sppgsWithZeroReports.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
            Periode: <span className="font-semibold text-gray-800">{selectedMonthLabel} {selectedReportYear}</span> (hingga {new Date(`${endDate}T00:00:00`).toLocaleDateString('id-ID')}, {dayCount} hari)
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cari Nama SPPG</label>
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={reportSearchQuery}
                onChange={(event) => setReportSearchQuery(event.target.value)}
                placeholder="Ketik nama SPPG..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            {reportSearchQuery.trim().length > 0 && reportSearchQuery.trim().length < SMART_SEARCH_MIN_CHARS && (
              <p className="text-xs text-amber-600">Ketik minimal {SMART_SEARCH_MIN_CHARS} karakter untuk mencari</p>
            )}
            <p className="text-xs text-gray-500">
              Menampilkan {visibleRows.length.toLocaleString('id-ID')} data SPPG
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loadingMonthlyReport || loadingReportSppgs ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700">Memuat laporan SPPG bulanan...</p>
            </div>
          ) : monthlyReportError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">{monthlyReportError}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Nama SPPG</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Lokasi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Total Laporan SPPG
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.length > 0 ? (
                    visibleRows.map((row, index) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/sppg-info/${row.id}`)}
                        className={`${row.totalReports === 0 ? 'bg-red-50/40' : 'bg-white'} hover:bg-blue-50/40 cursor-pointer transition-colors`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{row.name}</span>
                            {row.isInactive && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                SPPG Dinonaktifkan Sementara
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.location}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold ${
                              row.totalReports === 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {row.totalReports.toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-sm text-center text-gray-500">
                        {reportSearchQuery.trim().length >= SMART_SEARCH_MIN_CHARS
                          ? `Tidak ada SPPG yang cocok dengan pencarian "${reportSearchQuery.trim()}"`
                          : 'Tidak ada data laporan SPPG'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loadingMonthlyReport && !loadingReportSppgs && !monthlyReportError && canLoadMoreRows && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLoadMoreReports}
              disabled={loadingMoreReportSppgs}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMoreReportSppgs ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <IconChevronDown className="h-4 w-4" />
                  Muat Lebih Banyak
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeTab === 'statistics'
              ? 'Statistik SPPG'
              : activeTab === 'reports'
              ? 'Laporan SPPG'
              : searchQuery ? `Pencarian SPPG: "${searchQuery}"` : 'Daftar Dapur SPPG'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'statistics'
              ? 'Pantau kelengkapan data SPPG berdasarkan informasi dasar, fasilitas, ahli gizi, SLHS, dan foto dapur'
              : activeTab === 'reports'
              ? 'Pantau jumlah laporan distribusi harian tiap SPPG per bulan untuk mengidentifikasi SPPG dengan aktivitas terendah'
              : searchQuery 
              ? 'Hasil pencarian dapur SPPG berdasarkan kata kunci yang Anda masukkan'
              : 'Temukan dapur SPPG yang melayani sekolah-sekolah di Kabupaten Sumedang'
            }
          </p>
        </div>

        <div className="mb-8">
          <div className="inline-flex bg-white rounded-xl border border-gray-200 shadow-sm p-1">
            {[
              { id: 'list' as SearchTab, label: 'Daftar SPPG', icon: IconChefHat },
              { id: 'statistics' as SearchTab, label: 'Statistik SPPG', icon: IconChartBar },
              { id: 'reports' as SearchTab, label: 'Laporan SPPG', icon: IconCalendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search and Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Dapur SPPG
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
                    placeholder="Cari nama dapur..."
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
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Dapur
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Semua Jenis</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokasi
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Semua Lokasi</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
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
                {searchQuery.trim().length > 0 && searchQuery.trim().length < SMART_SEARCH_MIN_CHARS && (
                  <p className="text-xs text-amber-600 mb-2">
                    Ketik minimal {SMART_SEARCH_MIN_CHARS} karakter untuk mencari nama SPPG
                  </p>
                )}
                {isSearchingSPPG && (
                  <p className="text-xs text-blue-600 mb-2">Mencari nama SPPG...</p>
                )}
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold text-gray-900">{paginatedResults.length}</span> dari{' '}
                  <span className="font-semibold text-gray-900">{!searchQuery.trim() && !filters.type && !filters.location && filters.maxDistance >= 50 && totalActiveSPPG !== null ? totalActiveSPPG : filteredResults.length}</span>{' '}
                  dapur SPPG
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
                  {paginatedResults.map((sppg) => (
                  <div
                    key={sppg.id}
                    onClick={() => handleSPPGSelect(sppg)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <IconChefHat className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {sppg.name}
                            </h3>
                            <p className="text-gray-600 mb-2">{sppg.location}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <IconBuilding className="h-4 w-4 mr-1" />
                                {sppg.capacity} porsi/hari
                              </span>
                              <span className="flex items-center">
                                <IconUsers className="h-4 w-4 mr-1" />
                                {sppg.schools?.length || sppg.school_count || 0} sekolah
                              </span>
                              <span className="flex items-center">
                                <IconCalendar className="h-4 w-4 mr-1" />
                                {sppg.operatingHours?.start || sppg.operating_hours_start || '-'} - {sppg.operatingHours?.end || sppg.operating_hours_end || '-'}
                              </span>
                              {getDistanceText(sppg) && (
                                <span className="flex items-center text-blue-600 font-medium">
                                  <IconMapPin className="h-4 w-4 mr-1" />
                                  {getDistanceText(sppg)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(sppg.type)}`}>
                          {sppg.type}
                        </span>
                      </div>
                    </div>

                    {/* Map Preview */}
                    <div className="mt-4">
                      <MapView
                        latitude={sppg.coordinates?.lat || sppg.latitude || null}
                        longitude={sppg.coordinates?.lng || sppg.longitude || null}
                        title={sppg.name}
                        description={`${sppg.type} - ${sppg.location}`}
                        height="200px"
                        className="rounded-lg"
                      />
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
                  Tidak ada dapur SPPG yang ditemukan
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
        ) : activeTab === 'statistics' ? (
          renderStatisticsTab()
        ) : (
          renderReportsTab()
        )}
      </div>
    </AppLayout>
  );
}

export default function SPPGSearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SPPGSearchContent />
    </Suspense>
  );
}
