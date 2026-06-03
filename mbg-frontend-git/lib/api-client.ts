// API Client utilities for frontend components
// This replaces direct database calls with API routes

import { buildApiUrl, API_ENDPOINTS } from "./api-utils";

export interface School {
  id: string;
  name: string;
  level: "SD" | "SMP" | "SMA" | "SMK";
  address: string;
  district: string;
  village: string;
  studentCount: number;
  programStartDate: string;
  status: "Active" | "Inactive" | "Pilot";
  coordinates?: {
    lat: number;
    lng: number;
  };
  sppgId?: string;
  sppg?: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    location: string;
    contact?: {
      phone: string;
      email: string;
      address: string;
    };
  };
}

export interface SPPG {
  id: string;
  id_sppg?: string;
  name: string;
  type: "Dapur Satelit Modular" | "Dapur Konvensional" | "Dapur Pusat";
  capacity: number;
  location: string;
  // flat fields (CMS endpoint)
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  address?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
  foundation_id?: string;
  foundation_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  beneficiary_count?: number;
  school_count?: number;
  // nested fields (public endpoint)
  coordinates?: { lat: number; lng: number };
  contact?: { phone: string; email: string; address: string };
  operatingHours?: { start: string; end: string };
  kitchenPhoto?: string;
  facilities?: string[];
  kitchenPhotos?: { id?: string; photoUrl?: string; photo_url?: string; caption?: string; displayOrder?: number; display_order?: number }[];
  kitchen_photo_count?: number;
  schools?: (string | Record<string, unknown>)[];
  nutritionist?: { name: string; qualification: string; experience: string; photo: string };
  slhsCertificate?: { fileUrl: string; issueDate: string; expiryDate: string; certificateNumber: string };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  image?: string;
  sppg_id?: string;
  sppg_name?: string;
  sppg_type?: string;
  sppg_location?: string;
}

export interface DailyMenu {
  id: string;
  name: string;
  sppgId: string;
  totalCalories: number;
  notes?: string;
  menuItems: MenuItem[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyDistribution {
  id: string;
  sppgId: string;
  distributionDate: string;
  recipientType: "school" | "group";
  recipientId: string;
  portions: number;
  notes?: string;
  menu?: {
    id: string;
    name?: string;
    totalCalories: number;
    notes?: string;
    image?: string;
    menuItems?: MenuItem[];
  };
  recipient?: School | Group;
}

export interface Statistics {
  totalSppgs: number;
  totalSchools?: number;
  totalStudents?: number;
  sppgsWithMenus: number;
  percentage: number;
  todayDistribution: {
    // SPPG Statistics
    sppgsWithDistributions: number;
    sppgsWithMBGReports: number;
    sppgsWithDailyDistributions: number;
    totalMBGReports: number;
    totalDistributionPortions: number;
    totalPortions: number;
    distributionPercentage: number;
    // School Statistics
    schoolsReportedToday: number;
    schoolsNotReportedToday: number;
    schoolReportPercentage: number;
    date: string;
  };
}

export interface SchoolStatistics {
  totalSchools: number;
  activeSppgs: number;
  todayPortions: number;
  averageDailyPortions: number;
}

export interface BeneficiaryTargets {
  total_realized: number;
  total_target: number;
  pesantren_realized: number;
  pesantren_total: number;
  santri_realized: number;
  santri_target: number;
  sekolah_realized: number;
  sekolah_total: number;
  siswa_realized: number;
  siswa_target: number;
  ibu_balita_realized: number;
  ibu_balita_target: number;
  bumil_realized: number;
  bumil_target: number;
  busui_realized: number;
  busui_target: number;
  balita_realized: number;
  balita_target: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

// API Client functions
export async function getSchools(params?: {
  q?: string;
  district?: string;
  village?: string;
  level?: string;
  status?: string;
}): Promise<School[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.district) searchParams.set("district", params.district);
  if (params?.village) searchParams.set("village", params.village);
  if (params?.level) searchParams.set("level", params.level);
  if (params?.status) searchParams.set("status", params.status);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.SCHOOLS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch schools");
  }
  return response.json();
}

export async function getSchoolById(id: string): Promise<School> {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.SCHOOLS}/${id}`));
  if (!response.ok) {
    throw new Error("School not found");
  }
  return response.json();
}

export async function getSPPGs(params?: {
  q?: string;
  type?: string;
  location?: string;
}): Promise<SPPG[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.location) searchParams.set("location", params.location);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.SPPGS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch SPPGs");
  }
  return response.json();
}

export async function getSPPGsPaginated(params?: {
  q?: string;
  type?: string;
  location?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<SPPG>> {
  const searchParams = new URLSearchParams();
  searchParams.set("paginate", "true");
  searchParams.set("page", String(params?.page || 1));
  searchParams.set("limit", String(params?.limit || 10));
  if (params?.q) searchParams.set("q", params.q);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.location) searchParams.set("location", params.location);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.SPPGS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch paginated SPPGs");
  }
  return response.json();
}

export async function getSPPGById(id: string): Promise<SPPG> {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.SPPGS}/${id}`));
  if (!response.ok) {
    throw new Error("SPPG not found");
  }
  return response.json();
}

export async function getMenus(params?: {
  sppgId?: string;
  date?: string;
}): Promise<DailyMenu[]> {
  const searchParams = new URLSearchParams();
  if (params?.sppgId) searchParams.set("sppg_id", params.sppgId);
  if (params?.date) searchParams.set("date", params.date);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.MENUS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch menus");
  }
  return response.json();
}

export async function getMenuItems(params?: {
  q?: string;
  category?: string;
}): Promise<MenuItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.category) searchParams.set("category", params.category);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.MENU_ITEMS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch menu items");
  }
  return response.json();
}

// Search functions (for backward compatibility)
export async function searchSchools(query: string): Promise<School[]> {
  return getSchools({ q: query });
}

export async function searchSPPGs(query: string): Promise<SPPG[]> {
  return getSPPGs({ q: query });
}

export async function getSchoolsByDistrict(
  district: string
): Promise<School[]> {
  return getSchools({ district });
}

export async function getSchoolsByVillage(village: string): Promise<School[]> {
  return getSchools({ village });
}

export async function getSPPGsByType(type: string): Promise<SPPG[]> {
  return getSPPGs({ type });
}

export async function getSPPGsByLocation(location: string): Promise<SPPG[]> {
  return getSPPGs({ location });
}

// Auth functions
export async function login(credentials: { email: string; password: string }) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

// Distribution functions
export async function getDistributions(params?: {
  sppgId?: string;
  recipientId?: string;
  date?: string;
  recipientType?: "school" | "group";
}): Promise<DailyDistribution[]> {
  const searchParams = new URLSearchParams();
  if (params?.sppgId) searchParams.set("sppg_id", params.sppgId);
  if (params?.recipientId) searchParams.set("recipient_id", params.recipientId);
  if (params?.date) searchParams.set("date", params.date);
  if (params?.recipientType)
    searchParams.set("recipient_type", params.recipientType);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.DISTRIBUTIONS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch distributions");
  }
  return response.json();
}

export async function getGroups(params?: {
  q?: string;
  location?: string;
}): Promise<Group[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.location) searchParams.set("location", params.location);

  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.GROUPS}?${searchParams.toString()}`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  return response.json();
}

export async function getGroupById(id: string): Promise<Group> {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.GROUPS}/${id}`));
  if (!response.ok) {
    throw new Error("Group not found");
  }
  return response.json();
}

export async function getGroupSPPGs(groupId: string): Promise<SPPG[]> {
  const response = await fetch(
    buildApiUrl(`${API_ENDPOINTS.GROUPS}/${groupId}/sppgs`)
  );
  if (!response.ok) {
    throw new Error("Failed to fetch group SPPGs");
  }
  return response.json();
}

export async function getStatistics(): Promise<Statistics> {
  const response = await fetch(buildApiUrl(API_ENDPOINTS.STATISTICS));
  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }
  return response.json();
}

export async function getSchoolStatistics(): Promise<SchoolStatistics> {
  const response = await fetch(buildApiUrl(API_ENDPOINTS.SCHOOL_STATISTICS));
  if (!response.ok) {
    throw new Error("Failed to fetch school statistics");
  }
  return response.json();
}

export async function getBeneficiaryTargets(): Promise<BeneficiaryTargets> {
  const response = await fetch(buildApiUrl(API_ENDPOINTS.BENEFICIARY_TARGETS));
  if (!response.ok) {
    throw new Error("Failed to fetch beneficiary targets");
  }
  return response.json();
}

export interface SPPGDistributionDetail {
  id: string;
  name: string;
  type: "Dapur Satelit Modular" | "Dapur Konvensional" | "Dapur Pusat";
  location: string;
  capacity: number | null;
  hasDistributedOnDate: boolean;
  
  // MBG Reports data (from schools)
  totalMBGReports: number;
  mbgReportingSchools: string[];
  totalMBGReportingSchools: number;
  
  // Daily Distributions data (created by SPPG)
  totalDistributions: number;
  distributedSchools: string[];
  totalDistributedSchools: number;
  
  // Combined data
  distributionDate: string | null;
  lastUpdateTime: string | null;
  reportingSchools: string[];
  totalReportingSchools: number;
}

export interface SPPGDistributionRecap {
  id: string;
  name: string;
  type: "Dapur Satelit Modular" | "Dapur Konvensional" | "Dapur Pusat";
  location: string;
  capacity: number | null;
  update_count: number;
  total_portions: number;
  distribution_dates: Array<{
    date: string;
    portions: number;
    recipient_type: string;
  }>;
  lastUpdateTime: string | null;
  reportingSchools: string[];
  totalReportingSchools: number;
}

export async function getSPPGDistributionDetails(date?: string): Promise<{
  distributed: SPPGDistributionDetail[];
  notDistributed: SPPGDistributionDetail[];
  selectedDate: string;
}> {
  const url = date 
    ? `${buildApiUrl(API_ENDPOINTS.SPPG_DISTRIBUTION_DETAILS)}?date=${date}`
    : buildApiUrl(API_ENDPOINTS.SPPG_DISTRIBUTION_DETAILS);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch SPPG distribution details');
  return response.json();
}

export async function getSPPGDistributionRecap(startDate: string, endDate: string): Promise<SPPGDistributionRecap[]> {
  const url = `/api/sppg-distribution-recap?startDate=${startDate}&endDate=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch SPPG distribution recap');
  return response.json();
}

// Sub-tab data interfaces
export interface SchoolReportDetail {
  id: string;
  name: string;
  level: string;
  location: string;
  district: string;
  sppgName: string;
  sppgId: string;
  updateTime: string;
  reportDate: string;
  hasMenuPhoto: boolean;
  hasStudentsPhoto: boolean;
  menuPhotoUrl: string | null;
  studentsPhotoUrl: string | null;
  submittedBy: string;
  isRapel?: boolean;
  rapelStartDate?: string;
  rapelEndDate?: string;
  sppgMenuPhotoUrl?: string | null;
}

export interface SPPGDistributionSubDetail {
  id: string;
  name: string;
  type: string;
  location: string;
  totalPortions: number;
  updateTime: string;
  distributionDate: string;
  recipientCount: number;
  menuName?: string;
  menuPhotoUrl?: string | null;
  studentsPhotoUrl?: string | null;
  sppgMenuPhotoUrl?: string | null;
  isInactive?: boolean;
  statusNote?: string | null;
}

export interface DataWithTotal<T> {
  data: T[];
  total: number;
}

export async function getSchoolReportsForTab(date: string, status: 'reported' | 'not-reported'): Promise<DataWithTotal<SchoolReportDetail>> {
  const url = `/api/school-reports?date=${date}&status=${status}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch school reports');
  return response.json();
}

export async function getSPPGDistributionsForTab(date: string, status: 'distributed' | 'not-distributed'): Promise<DataWithTotal<SPPGDistributionSubDetail>> {
  const url = `/api/sppg-distributions-subtab?date=${date}&status=${status}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch SPPG distributions');
  return response.json();
}

export async function getSchoolReportsRecap(startDate: string, endDate: string): Promise<DataWithTotal<SchoolReportDetail>> {
  const url = `/api/school-reports-recap?startDate=${startDate}&endDate=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch school reports recap');
  return response.json();
}

export async function getSPPGDistributionsRecap(startDate: string, endDate: string): Promise<DataWithTotal<SPPGDistributionSubDetail>> {
  const url = `/api/sppg-distributions-recap?startDate=${startDate}&endDate=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch SPPG distributions recap');
  return response.json();
}

// Export Schools Report interfaces
export interface ExportSchoolData {
  id: string;
  name: string;
  level: string;
  address: string;
  district: string;
  village: string;
  studentCount: number;
  sppgId: string | null;
  sppgName: string;
  reportCount: number;
}

export interface ExportSchoolsResponse {
  data: ExportSchoolData[];
  total: number;
  totalWithReports: number;
  totalWithoutReports: number;
}

export async function getExportSchoolsReport(startDate?: string, endDate?: string): Promise<ExportSchoolsResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const queryString = params.toString();
  const url = `/api/export-schools-report${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch export schools report');
  return response.json();
}
