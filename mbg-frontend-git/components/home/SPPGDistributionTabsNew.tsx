'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { SPPGDistributionTabsSkeleton } from '../shared/HomeSectionSkeletons';
import { 
  getSPPGDistributionDetails, 
  getSPPGDistributionRecap, 
  SPPGDistributionDetail, 
  SPPGDistributionRecap,
  getSchoolReportsForTab,
  getSPPGDistributionsForTab,
  getSchoolReportsRecap,
  SchoolReportDetail,
  SPPGDistributionSubDetail,
  getExportSchoolsReport,
  ExportSchoolData
} from '@/lib/api-client';
import { IconSearch, IconX, IconCalendar, IconDownload, IconChevronDown, IconChevronUp, IconPhoto, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import * as XLSX from 'xlsx';

interface SPPGDistributionTabsProps {
  className?: string;
  focusNotReportedSppgSignal?: number;
  totalActiveSppg?: number;
}

interface RecapSchoolReportRow {
  id: string;
  name: string;
  level: string;
  location: string;
  district: string;
  sppgId: string;
  sppgName: string;
  totalReports: number;
  latestUpdateTime: string | null;
}

interface RecapSPPGReportRow {
  id: string;
  name: string;
  type: string;
  location: string;
  totalReports: number;
  totalReportingSchools: number;
  reportingSchools: string[];
  latestUpdateTime: string | null;
}

// Utility function to get today's date in YYYY-MM-DD format (Indonesia timezone)
const getTodayDate = (): string => {
  const today = new Date();
  const indonesiaTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
  const year = indonesiaTime.getUTCFullYear();
  const month = String(indonesiaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(indonesiaTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MOBILE_PAGE_SIZE = 20;
const DESKTOP_PAGE_SIZE = 30;

export default function SPPGDistributionTabsWithSubTabs({ className = '', focusNotReportedSppgSignal, totalActiveSppg }: SPPGDistributionTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'distributed' | 'notDistributed' | 'recap'>('distributed');
  const [activeSubTab, setActiveSubTab] = useState<'schools' | 'sppgs'>('schools');
  
  const todayDate = getTodayDate();
  
  // State for distributed/not-distributed tabs
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [schoolsData, setSchoolsData] = useState<SchoolReportDetail[]>([]);
  const [sppgsData, setSppgsData] = useState<SPPGDistributionSubDetail[]>([]);
  const [schoolsTotal, setSchoolsTotal] = useState(0);
  const [sppgsTotal, setSppgsTotal] = useState(0);
  const [reportedSppgsTotal, setReportedSppgsTotal] = useState(0);
  const [notReportedSppgsTotal, setNotReportedSppgsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for recap tab
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [recapSchoolsData, setRecapSchoolsData] = useState<SchoolReportDetail[]>([]);
  const [recapSppgsData, setRecapSppgsData] = useState<SPPGDistributionRecap[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapError, setRecapError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(DESKTOP_PAGE_SIZE);
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null);
  const desktopSentinelRef = useRef<HTMLTableRowElement | null>(null);
  
  // State for export all schools
  const [isExportingAllSchools, setIsExportingAllSchools] = useState(false);

  // State for photo lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxLabels, setLightboxLabels] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!focusNotReportedSppgSignal) return;
    setActiveTab('notDistributed');
    setActiveSubTab('sppgs');
  }, [focusNotReportedSppgSignal]);

  const openPhotoLightbox = (images: (string | null | undefined)[], title: string, startIndex = 0, customLabels?: string[]) => {
    const labels = customLabels || ['Foto Menu Sekolah', 'Foto Menu SPPG'];
    const validImages: string[] = [];
    const validLabels: string[] = [];
    images.forEach((img, i) => {
      if (img) {
        validImages.push(img);
        validLabels.push(labels[i] || `Foto ${i + 1}`);
      }
    });
    if (validImages.length === 0) return;
    setLightboxImages(validImages);
    setLightboxLabels(validLabels);
    setLightboxIndex(Math.min(startIndex, validImages.length - 1));
    setLightboxTitle(title);
    setLightboxOpen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setLightboxLabels([]);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Fetch data for distributed/not-distributed tabs
  useEffect(() => {
    if (activeTab === 'recap') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeSubTab === 'schools') {
          const schoolStatus = activeTab === 'distributed' ? 'reported' : 'not-reported';
          const response = await getSchoolReportsForTab(selectedDate, schoolStatus);
          setSchoolsData(response.data);
          setSchoolsTotal(response.total);
        } else {
          const [reportedResponse, notReportedResponse] = await Promise.all([
            getSPPGDistributionsForTab(selectedDate, 'distributed'),
            getSPPGDistributionsForTab(selectedDate, 'not-distributed'),
          ]);

          setReportedSppgsTotal(reportedResponse.total);
          setNotReportedSppgsTotal(notReportedResponse.total);

          const response = activeTab === 'distributed' ? reportedResponse : notReportedResponse;
          setSppgsData(response.data);
          setSppgsTotal(response.total);
        }
      } catch (err) {
        setError(`Gagal memuat data ${activeSubTab === 'schools' ? 'sekolah' : 'SPPG'}`);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, activeSubTab, selectedDate]);

  // Fetch data for recap tab
  useEffect(() => {
    if (activeTab !== 'recap') return;

    const fetchRecapData = async () => {
      try {
        setRecapLoading(true);
        setRecapError(null);

        if (activeSubTab === 'schools') {
          const response = await getSchoolReportsRecap(dateRange.start, dateRange.end);
          setRecapSchoolsData(response.data);
        } else {
          const response = await getSPPGDistributionRecap(dateRange.start, dateRange.end);
          setRecapSppgsData(response);
        }
      } catch (err) {
        setRecapError(`Gagal memuat data rekap ${activeSubTab === 'schools' ? 'sekolah' : 'SPPG'}`);
        console.error('Error fetching recap data:', err);
      } finally {
        setRecapLoading(false);
      }
    };

    fetchRecapData();
  }, [activeTab, activeSubTab, dateRange]);

  const recapSchoolSummaries = useMemo<RecapSchoolReportRow[]>(() => {
    const map = new Map<string, RecapSchoolReportRow & { latestTimestamp: number }>();

    recapSchoolsData.forEach((school) => {
      const schoolName = (school.name || '').toLowerCase();
      if (schoolName.includes('demo school')) {
        return;
      }

      const key = school.id
        ? String(school.id)
        : `${school.name || ''}::${school.level || ''}::${school.district || ''}::${school.sppgId || ''}`;
      const existing = map.get(key);
      const timestamp = school.updateTime && school.updateTime !== '-' ? Date.parse(school.updateTime) : NaN;

      if (!existing) {
        map.set(key, {
          id: key,
          name: school.name || '-',
          level: school.level || '-',
          location: school.location || '-',
          district: school.district || '-',
          sppgId: school.sppgId || '',
          sppgName: school.sppgName || '-',
          totalReports: 1,
          latestUpdateTime: Number.isFinite(timestamp) ? school.updateTime : null,
          latestTimestamp: Number.isFinite(timestamp) ? timestamp : 0,
        });
        return;
      }

      existing.totalReports += 1;
      if (Number.isFinite(timestamp) && timestamp > existing.latestTimestamp) {
        existing.latestTimestamp = timestamp;
        existing.latestUpdateTime = school.updateTime;
      }
    });

    return Array.from(map.values())
      .map(({ latestTimestamp: _latestTimestamp, ...item }) => item)
      .sort((a, b) => {
        if (a.totalReports !== b.totalReports) return a.totalReports - b.totalReports;
        return a.name.localeCompare(b.name, 'id-ID');
      });
  }, [recapSchoolsData]);

  const recapSppgSummaries = useMemo<RecapSPPGReportRow[]>(() => {
    const map = new Map<string, RecapSPPGReportRow & { latestTimestamp: number }>();

    recapSppgsData.forEach((sppg) => {
      const id = String(sppg.id);
      const timestamp = sppg.lastUpdateTime ? Date.parse(sppg.lastUpdateTime) : NaN;
      const reportCount = Number(sppg.update_count || 0);
      const reportingSchools = Array.isArray(sppg.reportingSchools) ? sppg.reportingSchools : [];
      const reportingSchoolsSet = new Set(reportingSchools);

      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          id,
          name: sppg.name || '-',
          type: sppg.type || '-',
          location: sppg.location || '-',
          totalReports: reportCount,
          totalReportingSchools: Number(sppg.totalReportingSchools || reportingSchoolsSet.size || 0),
          reportingSchools: Array.from(reportingSchoolsSet),
          latestUpdateTime: Number.isFinite(timestamp) ? sppg.lastUpdateTime : null,
          latestTimestamp: Number.isFinite(timestamp) ? timestamp : 0,
        });
        return;
      }

      existing.totalReports = Math.max(existing.totalReports, reportCount);
      existing.totalReportingSchools = Math.max(
        existing.totalReportingSchools,
        Number(sppg.totalReportingSchools || reportingSchoolsSet.size || 0)
      );
      existing.reportingSchools = Array.from(new Set([...existing.reportingSchools, ...reportingSchools]));
      if (Number.isFinite(timestamp) && timestamp > existing.latestTimestamp) {
        existing.latestTimestamp = timestamp;
        existing.latestUpdateTime = sppg.lastUpdateTime;
      }
      if (existing.name === '-' && sppg.name) existing.name = sppg.name;
      if (existing.type === '-' && sppg.type) existing.type = sppg.type;
      if (existing.location === '-' && sppg.location) existing.location = sppg.location;
    });

    return Array.from(map.values())
      .map(({ latestTimestamp: _latestTimestamp, ...item }) => item)
      .sort((a, b) => {
        if (a.totalReports !== b.totalReports) return a.totalReports - b.totalReports;
        return a.name.localeCompare(b.name, 'id-ID');
      });
  }, [recapSppgsData]);

  const filteredRecapSchools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return recapSchoolSummaries;

    return recapSchoolSummaries.filter((school) =>
      school.name.toLowerCase().includes(query) ||
      school.location.toLowerCase().includes(query) ||
      school.district.toLowerCase().includes(query) ||
      school.sppgName.toLowerCase().includes(query)
    );
  }, [searchQuery, recapSchoolSummaries]);

  const filteredRecapSppgs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return recapSppgSummaries;

    return recapSppgSummaries.filter((sppg) =>
      sppg.name.toLowerCase().includes(query) ||
      sppg.type.toLowerCase().includes(query) ||
      sppg.location.toLowerCase().includes(query)
    );
  }, [searchQuery, recapSppgSummaries]);

  // Filter data for distributed/not-distributed tabs
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (activeSubTab === 'schools') {
      if (!query) return schoolsData;
      return schoolsData.filter((school) =>
        school.name.toLowerCase().includes(query) ||
        school.location.toLowerCase().includes(query) ||
        school.district.toLowerCase().includes(query) ||
        school.sppgName.toLowerCase().includes(query)
      );
    }

    if (!query) return sppgsData;
    return sppgsData.filter((sppg) =>
      sppg.name.toLowerCase().includes(query) ||
      sppg.location.toLowerCase().includes(query) ||
      (sppg.statusNote || '').toLowerCase().includes(query)
    );
  }, [activeSubTab, searchQuery, schoolsData, sppgsData]);

  const recapEntityCount = activeSubTab === 'schools' ? filteredRecapSchools.length : filteredRecapSppgs.length;
  const recapTotalReports = (activeSubTab === 'schools' ? filteredRecapSchools : filteredRecapSppgs)
    .reduce((sum, item) => sum + item.totalReports, 0);
  const currentTableCount = activeTab === 'recap' ? recapEntityCount : filteredData.length;
  const totalSppgByActiveDate = reportedSppgsTotal + notReportedSppgsTotal;
  const sppgGrandTotalForContext = Math.max(
    totalActiveSppg || 0,
    totalSppgByActiveDate,
    sppgsTotal
  );
  const normalizedReportedSppgsTotal = Math.min(reportedSppgsTotal, sppgGrandTotalForContext);
  const normalizedNotReportedSppgsTotal = Math.max(sppgGrandTotalForContext - normalizedReportedSppgsTotal, 0);
  const totalDataCount = activeTab === 'recap'
    ? recapEntityCount
    : activeSubTab === 'schools'
      ? schoolsTotal
      : activeTab === 'distributed'
        ? reportedSppgsTotal
        : notReportedSppgsTotal;
  const isSppgStatusTab = activeTab !== 'recap' && activeSubTab === 'sppgs';
  const footerTotalCount = currentTableCount;
  const oppositeStatusCount = activeTab === 'distributed' ? notReportedSppgsTotal : reportedSppgsTotal;
  const visibleMobileCount = Math.min(mobileVisibleCount, currentTableCount);
  const visibleDesktopCount = Math.min(desktopVisibleCount, currentTableCount);

  useEffect(() => {
    setMobileVisibleCount(MOBILE_PAGE_SIZE);
    setDesktopVisibleCount(DESKTOP_PAGE_SIZE);
  }, [activeTab, activeSubTab, searchQuery, selectedDate, dateRange.start, dateRange.end]);

  useEffect(() => {
    const sentinel = mobileSentinelRef.current;
    if (!sentinel || visibleMobileCount >= currentTableCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMobileVisibleCount((prev) => Math.min(prev + MOBILE_PAGE_SIZE, currentTableCount));
        }
      },
      { rootMargin: '180px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleMobileCount, currentTableCount]);

  useEffect(() => {
    const sentinel = desktopSentinelRef.current;
    if (!sentinel || visibleDesktopCount >= currentTableCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDesktopVisibleCount((prev) => Math.min(prev + DESKTOP_PAGE_SIZE, currentTableCount));
        }
      },
      { rootMargin: '220px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleDesktopCount, currentTableCount]);

  const handleExportToExcel = () => {
    if (currentTableCount === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    let excelData: any[];
    let sheetName: string;

    if (activeTab === 'recap' && activeSubTab === 'schools') {
      excelData = filteredRecapSchools.map((school, index) => ({
        'No': index + 1,
        'Nama Sekolah': school.name,
        'Jenjang': school.level,
        'Lokasi': school.location,
        'Kecamatan': school.district,
        'SPPG': school.sppgName,
        'Total Laporan SPPG': school.totalReports,
        'Waktu Update Terakhir': school.latestUpdateTime ? new Date(school.latestUpdateTime).toLocaleString('id-ID') : '-',
      }));
      sheetName = 'Rekap Sekolah';
    } else if (activeTab === 'recap' && activeSubTab === 'sppgs') {
      excelData = filteredRecapSppgs.map((sppg, index) => ({
        'No': index + 1,
        'Nama SPPG': sppg.name,
        'Tipe': sppg.type,
        'Lokasi': sppg.location,
        'Total Laporan SPPG': sppg.totalReports,
        'Jumlah Sekolah Melapor': sppg.totalReportingSchools,
        'Waktu Update Terakhir': sppg.latestUpdateTime ? new Date(sppg.latestUpdateTime).toLocaleString('id-ID') : '-',
      }));
      sheetName = 'Rekap SPPG';
    } else if (activeSubTab === 'schools') {
      excelData = (filteredData as SchoolReportDetail[]).map((school, index) => ({
        'No': index + 1,
        'Nama Sekolah': school.name,
        'Jenjang': school.level,
        'Lokasi': school.location,
        'Kecamatan': school.district,
        'SPPG': school.sppgName,
        'Tanggal Laporan': school.reportDate,
        'Waktu Update': school.updateTime !== '-' ? new Date(school.updateTime).toLocaleString('id-ID') : '-',
        'Foto Menu': school.hasMenuPhoto ? 'Ya' : 'Tidak',
        'Foto Siswa': school.hasStudentsPhoto ? 'Ya' : 'Tidak',
        'Dilaporkan Oleh': school.submittedBy
      }));
      sheetName = 'Laporan Sekolah';
    } else {
      excelData = (filteredData as SPPGDistributionSubDetail[]).map((sppg, index) => ({
        'No': index + 1,
        'Nama SPPG': sppg.name,
        'Tipe': sppg.type,
        'Lokasi': sppg.location,
        'Total Porsi': sppg.totalPortions,
        'Tanggal Distribusi': sppg.distributionDate,
        'Waktu Update': sppg.updateTime !== '-' ? new Date(sppg.updateTime).toLocaleString('id-ID') : '-',
        'Jumlah Penerima': sppg.recipientCount,
        'Nama Menu': sppg.menuName || '-',
        'Keterangan': sppg.statusNote || (sppg.isInactive ? 'SPPG nonaktif' : '-'),
      }));
      sheetName = 'Distribusi SPPG';
    }

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = activeTab === 'recap' 
      ? `Rekap_${sheetName}_${dateRange.start}_to_${dateRange.end}.xlsx`
      : `${sheetName}_${selectedDate}.xlsx`;
    
    XLSX.writeFile(wb, filename);
  };

  const handleExportAllSchools = async () => {
    try {
      setIsExportingAllSchools(true);
      
      // Use date range filter
      const startDate = dateRange.start;
      const endDate = dateRange.end;
      const response = await getExportSchoolsReport(startDate, endDate);
      
      if (response.data.length === 0) {
        alert('Tidak ada data sekolah untuk diekspor');
        return;
      }

      const todayFormatted = new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      const startFormatted = new Date(startDate).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const endFormatted = new Date(endDate).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const periodeText = `Periode: ${startFormatted} s/d ${endFormatted}`;

      // Build sheet with header info rows + data using aoa (array of arrays)
      const rows: any[][] = [];

      // Row 1: Title (will be merged)
      rows.push(['LAPORAN PER SEKOLAH - PROGRAM MBG Kabupaten Kuningan', '', '', '', '', '', '', '']);
      // Row 2: Subtitle
      rows.push(['Daftar Seluruh Sekolah Penerima Manfaat Makan Bergizi Gratis', '', '', '', '', '', '', '']);
      // Row 3: Period info
      rows.push([periodeText, '', '', '', '', '', '', '']);
      // Row 4: Export date
      rows.push(['Tanggal Export:', todayFormatted, '', '', '', '', '', '']);
      // Row 5: Empty separator
      rows.push([]);
      // Row 6: Column headers
      rows.push(['No', 'Nama Sekolah', 'Jenjang', 'Kecamatan', 'Desa/Kelurahan', 'Alamat', 'SPPG', 'Jumlah Laporan']);
      // Row 7+: Data
      response.data.forEach((school: ExportSchoolData, index: number) => {
        rows.push([
          index + 1,
          school.name,
          school.level,
          school.district,
          school.village,
          school.address,
          school.sppgName,
          school.reportCount,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Merge cells for title, subtitle, and period
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Row 1: Title merged A1:H1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Row 2: Subtitle merged A2:H2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Row 3: Period merged A3:H3
      ];

      // Set column widths
      ws['!cols'] = [
        { wch: 6 },   // A: No
        { wch: 38 },  // B: Nama Sekolah
        { wch: 10 },  // C: Jenjang
        { wch: 20 },  // D: Kecamatan
        { wch: 22 },  // E: Desa/Kelurahan
        { wch: 45 },  // F: Alamat
        { wch: 35 },  // G: SPPG
        { wch: 16 },  // H: Jumlah Laporan
      ];

      // Set row heights for header rows
      ws['!rows'] = [
        { hpt: 30 },  // Row 1: Title
        { hpt: 22 },  // Row 2: Subtitle
        { hpt: 22 },  // Row 3: Period
        { hpt: 20 },  // Row 4: Export date
        { hpt: 10 },  // Row 5: Separator
        { hpt: 24 },  // Row 6: Column headers
      ];

      // Freeze panes: freeze all columns except H (Jumlah Laporan) + header rows
      // xSplit: 7 = freeze columns A-G, ySplit: 6 = freeze rows 1-6 (header area)
      ws['!freeze'] = { xSplit: 7, ySplit: 6, topLeftCell: 'H7', activePane: 'bottomRight', state: 'frozen' };

      // Add auto-filter on the column header row (row 6, zero-indexed row 5)
      ws['!autofilter'] = { ref: `A6:H${6 + response.data.length}` };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Per Sekolah');

      // === Summary sheet ===
      const summaryRows: any[][] = [];
      summaryRows.push(['RINGKASAN LAPORAN SEKOLAH', '']);
      summaryRows.push(['Program Makan Bergizi Gratis - Kab. Kuningan', '']);
      summaryRows.push([]);
      summaryRows.push(['Keterangan', 'Jumlah']);
      summaryRows.push(['Total Sekolah (Unik / Tanpa Duplikat)', response.total]);
      summaryRows.push(['Sekolah Sudah Memiliki Laporan', response.totalWithReports]);
      summaryRows.push(['Sekolah Belum Memiliki Laporan', response.totalWithoutReports]);
      summaryRows.push(['Persentase Sekolah Sudah Laporan', `${response.total > 0 ? ((response.totalWithReports / response.total) * 100).toFixed(1) : 0}%`]);
      summaryRows.push([]);
      summaryRows.push(['Tanggal Export', todayFormatted]);
      summaryRows.push(['Catatan', 'Data sekolah sudah dihapus duplikasinya berdasarkan nama, jenjang, dan kecamatan']);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      ];
      wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
      wsSummary['!rows'] = [
        { hpt: 28 },
        { hpt: 20 },
        { hpt: 10 },
        { hpt: 22 },
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      XLSX.writeFile(wb, `Laporan_Per_Sekolah_${startDate}_sd_${endDate}.xlsx`);
    } catch (err) {
      console.error('Error exporting all schools:', err);
      alert('Gagal mengekspor data sekolah. Silakan coba lagi.');
    } finally {
      setIsExportingAllSchools(false);
    }
  };

  const isLoading = activeTab === 'recap' ? recapLoading : loading;
  const hasError = activeTab === 'recap' ? recapError : error;
  const isRecapTab = activeTab === 'recap';
  const hasCurrentData = isRecapTab ? recapEntityCount > 0 : filteredData.length > 0;

  if (isLoading) {
    return <SPPGDistributionTabsSkeleton />;
  }

  return (
    <>
    <div className={`${className}`}>      {/* Main Tab Headers */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('distributed')}
            className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'distributed'
                ? 'border-blue-600 text-blue-600 bg-blue-50 shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
             Sudah Melaporkan
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notDistributed')}
            className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'notDistributed'
                ? 'border-orange-600 text-orange-600 bg-orange-50 shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Belum Melaporkan
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'recap'
                ? 'border-purple-600 text-purple-600 bg-purple-50 shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Rekap Update
            </div>
          </button>
        </div>
      </div>

      {/* Sub-Tab Headers */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 px-6 py-3">
          <button
            onClick={() => setActiveSubTab('schools')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeSubTab === 'schools'
                ? 'bg-white text-green-600 shadow-sm border border-green-200'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Sekolah
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('sppgs')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeSubTab === 'sppgs'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              SPPG
            </div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row gap-4">
          {activeTab !== 'recap' ? (
            <div className="relative group">
              <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
              />
            </div>
          ) : (
            <>
              <div className="relative group">
                <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
                />
              </div>
              <span className="flex items-center text-gray-400 font-medium">s/d</span>
              <div className="relative group">
                <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
                />
              </div>
            </>
          )}

          <div className="relative flex-1 group">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={`Cari ${activeSubTab === 'schools' ? 'sekolah' : 'SPPG'} berdasarkan nama atau lokasi...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium hover:border-gray-300 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportToExcel}
            disabled={currentTableCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <IconDownload className="h-5 w-5" />
            Export Excel
          </button>

          {/* <button
            onClick={handleExportAllSchools}
            disabled={isExportingAllSchools}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isExportingAllSchools ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengekspor...
              </>
            ) : (
              <>
                <IconDownload className="h-5 w-5" />
                Export Laporan Sekolah
              </>
            )}
          </button> */}
        </div>

        {searchQuery && (
          <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Menampilkan {currentTableCount} {activeSubTab === 'schools' ? 'sekolah' : 'SPPG'}
          </div>
        )}
        
        {/* Total Count Display */}
        <div className="mt-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Total Data {activeSubTab === 'schools' ? 'Sekolah' : 'SPPG'}</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {totalDataCount} {activeSubTab === 'schools' ? 'Sekolah' : 'SPPG'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-600 font-medium">
                {activeTab === 'distributed' && 'Sudah Melaporkan'}
                {activeTab === 'notDistributed' && 'Belum Melaporkan'}
                {activeTab === 'recap' && `Periode: ${new Date(dateRange.start).toLocaleDateString('id-ID')} - ${new Date(dateRange.end).toLocaleDateString('id-ID')}`}
              </p>
              {activeTab === 'recap' && (
                <p className="text-xs text-gray-500 mt-1">
                  Total Laporan SPPG: {recapTotalReports.toLocaleString('id-ID')}
                </p>
              )}
              {activeTab !== 'recap' && (
                <p className="text-xs text-gray-500 mt-1">
                  Tanggal: {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
              {/* {isSppgStatusTab && (
                <p className="text-xs text-gray-500 mt-1">
                  Total SPPG Laporan: {sppgGrandTotalForContext.toLocaleString('id-ID')}
                </p>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="p-6">
        {hasError ? (
          <div className="text-center py-8">
            <p className="text-red-600">{hasError}</p>
          </div>
        ) : hasCurrentData ? (
          <>
            {isRecapTab ? (
              <>
                {/* Mobile Recap View */}
                <div className="block lg:hidden space-y-4">
                  {activeSubTab === 'schools' ? (
                    filteredRecapSchools.slice(0, mobileVisibleCount).map((school, index) => (
                      <div
                        key={`recap-school-${school.id}-${index}`}
                        onClick={() => router.push(`/schools/${school.id}?tab=reports`)}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 line-clamp-2">{school.name}</p>
                            <p className="text-xs text-gray-500">{school.level} • {school.district}</p>
                            <p className="text-xs text-blue-600 mt-1">SPPG: {school.sppgName}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {school.totalReports.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                          Update terakhir:{' '}
                          <span className="font-medium text-gray-800">
                            {school.latestUpdateTime ? new Date(school.latestUpdateTime).toLocaleString('id-ID') : '-'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredRecapSppgs.slice(0, mobileVisibleCount).map((sppg, index) => (
                      <div
                        key={`recap-sppg-${sppg.id}-${index}`}
                        onClick={() => router.push(`/sppg-info/${sppg.id}?tab=distribution`)}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 line-clamp-2">{sppg.name}</p>
                            <p className="text-xs text-gray-500">{sppg.type}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{sppg.location}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {sppg.totalReports.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                            <p className="text-gray-500">Sekolah Melapor</p>
                            <p className="font-semibold text-gray-800">{sppg.totalReportingSchools.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                            <p className="text-gray-500">Update Terakhir</p>
                            <p className="font-semibold text-gray-800">
                              {sppg.latestUpdateTime ? new Date(sppg.latestUpdateTime).toLocaleDateString('id-ID') : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {currentTableCount > visibleMobileCount && (
                    <div ref={mobileSentinelRef} className="flex items-center justify-center py-4">
                      <span className="text-sm text-gray-400">
                        Memuat data... ({visibleMobileCount} dari {currentTableCount})
                      </span>
                    </div>
                  )}

                </div>

                {/* Desktop Recap Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <div className="max-h-[700px] overflow-y-auto rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">No</th>
                          {activeSubTab === 'schools' ? (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Nama Sekolah</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Jenjang</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Kecamatan</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">SPPG</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Laporan SPPG</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Update Terakhir</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Nama SPPG</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Lokasi</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Tipe</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Laporan SPPG</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Sekolah Melapor</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Update Terakhir</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeSubTab === 'schools' ? (
                          filteredRecapSchools.slice(0, desktopVisibleCount).map((school, index) => (
                            <tr
                              key={`recap-table-school-${school.id}-${index}`}
                              onClick={() => router.push(`/schools/${school.id}?tab=reports`)}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{school.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{school.level}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{school.district}</td>
                              <td className="px-6 py-4 text-sm text-blue-700 font-medium">{school.sppgName}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {school.totalReports.toLocaleString('id-ID')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {school.latestUpdateTime ? new Date(school.latestUpdateTime).toLocaleString('id-ID') : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          filteredRecapSppgs.slice(0, desktopVisibleCount).map((sppg, index) => (
                            <tr
                              key={`recap-table-sppg-${sppg.id}-${index}`}
                              onClick={() => router.push(`/sppg-info/${sppg.id}?tab=distribution`)}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{sppg.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{sppg.location}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{sppg.type}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {sppg.totalReports.toLocaleString('id-ID')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{sppg.totalReportingSchools.toLocaleString('id-ID')}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {sppg.latestUpdateTime ? new Date(sppg.latestUpdateTime).toLocaleString('id-ID') : '-'}
                              </td>
                            </tr>
                          ))
                        )}

                        {currentTableCount > visibleDesktopCount && (
                          <tr ref={desktopSentinelRef}>
                            <td colSpan={7} className="py-4 text-center text-sm text-gray-400">
                              Memuat data...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-center text-xs text-gray-400 py-2">
                    {isSppgStatusTab
                      ? `Menampilkan ${visibleDesktopCount} dari ${footerTotalCount} data ${activeTab === 'distributed' ? 'Sudah Melaporkan' : 'Belum Melaporkan'}`
                      : `Menampilkan ${visibleDesktopCount} dari ${footerTotalCount}`}
                  </div>
                </div>
              </>
            ) : (
            <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {activeSubTab === 'schools' ? (
                (filteredData as SchoolReportDetail[]).slice(0, mobileVisibleCount).map((school, index) => (
                  <div 
                    key={`${activeTab}-school-${school.id}-${index}`} 
                    onClick={() => router.push(`/schools/${school.id}?tab=reports`)}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900 mb-1">{school.name}</div>
                          <div className="text-xs text-gray-500 mb-1">{school.level}</div>
                          <div className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="font-medium">{school.sppgName}</span>
                          </div>
                          {school.isRapel && school.rapelStartDate && school.rapelEndDate && (
                            <div className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-md mt-1 ml-1 font-semibold">
                              <IconCalendar className="w-3 h-3" />
                              <span>Rapel: {new Date(school.rapelStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(school.rapelEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          )}
                        </div>
                        {school.updateTime !== '-' && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Sudah Lapor
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Kecamatan</div>
                          <div className="text-xs font-medium text-gray-900">{school.district}</div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          {school.menuPhotoUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPhotoLightbox([school.menuPhotoUrl, school.sppgMenuPhotoUrl], school.name, 0);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <IconPhoto className="w-4 h-4" />
                              <span>Menu Sekolah</span>
                              
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                              <IconPhoto className="w-4 h-4" />
                              <span>Menu Sekolah</span>
                            </span>
                          )}
                          {school.sppgMenuPhotoUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPhotoLightbox([school.menuPhotoUrl, school.sppgMenuPhotoUrl], school.name, school.menuPhotoUrl ? 1 : 0);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 transition-colors"
                            >
                              <IconPhoto className="w-4 h-4" />
                              <span>Menu SPPG</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                              <IconPhoto className="w-4 h-4" />
                              <span>Menu SPPG</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {school.updateTime !== '-' && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">Waktu Update</div>
                          <div className="text-xs font-medium text-gray-900">
                            {new Date(school.updateTime).toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                (filteredData as SPPGDistributionSubDetail[]).slice(0, mobileVisibleCount).map((sppg, index) => (
                  <div 
                    key={`${activeTab}-sppg-${sppg.id}-${index}`} 
                    onClick={() => router.push(`/sppg-info/${sppg.id}?tab=distribution`)}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900 mb-1">{sppg.name}</div>
                          <div className="text-xs text-gray-500">{sppg.type}</div>
                          {sppg.isInactive && (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 mt-1">
                              SPPG Nonaktif
                            </div>
                          )}
                        </div>
                        {sppg.totalPortions > 0 && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {sppg.totalPortions} porsi
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Lokasi</div>
                          <div className="text-xs font-medium text-gray-900">{sppg.location}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Penerima</div>
                          <div className="text-xs font-medium text-gray-900">{sppg.recipientCount} unit</div>
                        </div>
                      </div>
                      {activeTab === 'distributed' && sppg.isInactive && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-amber-700 font-medium">
                            Keterangan: {sppg.statusNote || 'SPPG di nonaktifkan sementara - tidak ada data distribusi untuk tanggal ini'}
                          </div>
                        </div>
                      )}
                      {(sppg.sppgMenuPhotoUrl || sppg.menuPhotoUrl) && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            {sppg.sppgMenuPhotoUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPhotoLightbox([sppg.sppgMenuPhotoUrl || null, sppg.menuPhotoUrl || null], sppg.name, 0, ['Foto Menu SPPG', 'Foto Menu Sekolah']);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <IconPhoto className="w-4 h-4" />
                                <span>Menu SPPG</span>
                              </button>
                            )}
                            {sppg.menuPhotoUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPhotoLightbox([sppg.sppgMenuPhotoUrl || null, sppg.menuPhotoUrl || null], sppg.name, sppg.sppgMenuPhotoUrl ? 1 : 0, ['Foto Menu SPPG', 'Foto Menu Sekolah']);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 transition-colors"
                              >
                                <IconPhoto className="w-4 h-4" />
                                <span>Menu Sekolah</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {sppg.updateTime !== '-' && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">Waktu Update</div>
                          <div className="text-xs font-medium text-gray-900">
                            {new Date(sppg.updateTime).toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {currentTableCount > visibleMobileCount && (
                <div ref={mobileSentinelRef} className="flex items-center justify-center py-4">
                  <span className="text-sm text-gray-400">
                    Memuat data... ({visibleMobileCount} dari {currentTableCount})
                  </span>
                </div>
              )}
              
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="max-h-[700px] overflow-y-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {activeSubTab === 'schools' ? (
                        <>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Nama Sekolah / SPPG
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Jenjang
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Lokasi
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Foto Laporan
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Waktu Update
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Nama SPPG
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Lokasi
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Total Porsi
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Foto Laporan
                          </th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                            Waktu Update
                          </th>
                          {activeTab === 'distributed' && (
                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                              Keterangan
                            </th>
                          )}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeSubTab === 'schools' ? (
                      (filteredData as SchoolReportDetail[]).slice(0, desktopVisibleCount).map((school, index) => (
                        <tr 
                          key={`${activeTab}-table-school-${school.id}-${index}`} 
                          onClick={() => router.push(`/schools/${school.id}?tab=reports`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900 mb-1">{school.name}</div>
                            <div className="flex flex-wrap gap-1.5">
                              <div className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="font-medium">{school.sppgName}</span>
                              </div>
                              {school.isRapel && school.rapelStartDate && school.rapelEndDate && (
                                <div className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-md font-semibold">
                                  <IconCalendar className="w-3 h-3" />
                                  <span>Rapel: {new Date(school.rapelStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(school.rapelEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{school.level}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{school.district}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {school.menuPhotoUrl ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoLightbox([school.menuPhotoUrl, school.sppgMenuPhotoUrl], school.name, 0);
                                  }}
                                  className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                  title="Foto Menu Sekolah"
                                >
                                  <IconPhoto className="w-5 h-5" />
                                </button>
                              ) : (
                                <span className="p-1.5 rounded-lg text-gray-300" title="Foto Menu Sekolah belum ada">
                                  <IconPhoto className="w-5 h-5" />
                                </span>
                              )}
                              {school.sppgMenuPhotoUrl ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoLightbox([school.menuPhotoUrl, school.sppgMenuPhotoUrl], school.name, school.menuPhotoUrl ? 1 : 0);
                                  }}
                                  className="p-1.5 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors"
                                  title="Foto Menu SPPG"
                                >
                                  <IconPhoto className="w-5 h-5" />
                                </button>
                              ) : (
                                <span className="p-1.5 rounded-lg text-gray-300" title="Foto Menu SPPG belum ada">
                                  <IconPhoto className="w-5 h-5" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {school.updateTime !== '-' ? new Date(school.updateTime).toLocaleString('id-ID') : '-'}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      (filteredData as SPPGDistributionSubDetail[]).slice(0, desktopVisibleCount).map((sppg, index) => (
                        <tr 
                          key={`${activeTab}-table-sppg-${sppg.id}-${index}`} 
                          onClick={() => router.push(`/sppg-info/${sppg.id}?tab=distribution`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{sppg.name}</div>
                            <div className="text-xs text-gray-500">{sppg.type}</div>
                            {sppg.isInactive && (
                              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 mt-1">
                                SPPG Nonaktif
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{sppg.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{sppg.totalPortions.toLocaleString()} porsi</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {sppg.menuPhotoUrl ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoLightbox([sppg.menuPhotoUrl || null, sppg.sppgMenuPhotoUrl || null], sppg.name, 0, ['Foto Menu Sekolah', 'Foto Menu SPPG']);
                                  }}
                                  className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                  title="Foto Menu Sekolah"
                                >
                                  <IconPhoto className="w-5 h-5" />
                                </button>
                              ) : (
                                <span className="p-1.5 rounded-lg text-gray-300" title="Foto Menu Sekolah belum ada">
                                  <IconPhoto className="w-5 h-5" />
                                </span>
                              )}
                              {sppg.sppgMenuPhotoUrl ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoLightbox([sppg.menuPhotoUrl || null, sppg.sppgMenuPhotoUrl || null], sppg.name, sppg.menuPhotoUrl ? 1 : 0, ['Foto Menu Sekolah', 'Foto Menu SPPG']);
                                  }}
                                  className="p-1.5 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors"
                                  title="Foto Menu SPPG"
                                >
                                  <IconPhoto className="w-5 h-5" />
                                </button>
                              ) : (
                                <span className="p-1.5 rounded-lg text-gray-300" title="Foto Menu SPPG belum ada">
                                  <IconPhoto className="w-5 h-5" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {sppg.updateTime !== '-' ? new Date(sppg.updateTime).toLocaleString('id-ID') : '-'}
                            </div>
                          </td>
                          {activeTab === 'distributed' && (
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700">
                                {sppg.isInactive
                                  ? (sppg.statusNote || 'SPPG dinonaktifkan sementara - tidak ada data distribusi untuk tanggal ini')
                                  : '-'}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                    {currentTableCount > visibleDesktopCount && (
                      <tr ref={desktopSentinelRef}>
                        <td colSpan={10} className="py-4 text-center text-sm text-gray-400">
                          Memuat data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-center text-xs text-gray-400 py-2">
                {isSppgStatusTab
                  ? `Menampilkan ${visibleDesktopCount} dari ${footerTotalCount} data ${activeTab === 'distributed' ? 'Sudah Melaporkan' : 'Belum Melaporkan'}`
                  : `Menampilkan ${visibleDesktopCount} dari ${footerTotalCount}`}
              </div>
            </div>
            </>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery 
                ? `Tidak ada ${activeSubTab === 'schools' ? 'sekolah' : 'SPPG'} yang cocok dengan pencarian "${searchQuery}"`
                : activeTab === 'recap'
                  ? `Tidak ada data laporan ${activeSubTab === 'schools' ? 'sekolah' : 'SPPG'} pada periode ${new Date(dateRange.start).toLocaleDateString('id-ID')} - ${new Date(dateRange.end).toLocaleDateString('id-ID')}`
                  : `Tidak ada data ${activeSubTab === 'schools' ? 'sekolah' : 'SPPG'} tersedia`
              }
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Lightbox Modal - rendered via portal to cover everything */}
    {lightboxOpen && lightboxImages.length > 0 && createPortal(
      <div className="fixed inset-0 z-[99999] bg-black" onClick={closeLightbox}>
        <div className="relative w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-none">{lightboxTitle}</h3>
              <span className="text-white/70 text-xs bg-white/10 px-2 py-1 rounded-full">
                {lightboxLabels[lightboxIndex] || 'Foto'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Zoom In"
              >
                <IconZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
                className="px-2 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs font-medium"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <IconZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
                title="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              if (zoom > 1) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && zoom > 1) {
                setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImages[lightboxIndex]}
                alt={lightboxLabels[lightboxIndex] || 'Foto'}
                className="max-w-[95vw] max-h-[calc(100vh-120px)] object-contain select-none"
                draggable={false}
              />
            </div>
          </div>

          {/* Navigation */}
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={() => {
                  setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setLightboxIndex(i => (i + 1) % lightboxImages.length);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail Strip */}
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-black/50">
            {lightboxImages.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setLightboxIndex(i);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === lightboxIndex ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20 hover:border-white/50'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-medium">
                  {lightboxLabels[i]?.replace('Foto ', '') || ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
