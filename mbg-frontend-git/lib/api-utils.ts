/**
 * Utility functions for API calls
 */

/**
 * Get the base URL for API calls
 * Uses environment variable or falls back to localhost for development
 */
export function getApiBaseUrl(): string {
  // In development, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
}

/**
 * Build a full API URL
 * @param endpoint - API endpoint (e.g., '/api/schools')
 * @returns Full API URL
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
}

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Public APIs
  SCHOOLS: "/api/schools",
  SPPGS: "/api/sppgs",
  GROUPS: "/api/groups",
  MENUS: "/api/menus",
  MENU_ITEMS: "/api/menu-items",
  DISTRIBUTIONS: "/api/distributions",
  STATISTICS: "/api/statistics",
  SCHOOL_STATISTICS: "/api/school-statistics",
  BENEFICIARY_TARGETS: "/api/beneficiary-targets",
  SPPG_DISTRIBUTION_DETAILS: "/api/sppg-distribution-details",

  // CMS APIs
  CMS_SCHOOLS: "/api/cms/schools",
  CMS_SPPGS: "/api/cms/sppgs",
  CMS_GROUPS: "/api/cms/groups",
  CMS_MENUS: "/api/cms/menus",
  CMS_MENU_ITEMS: "/api/cms/menus/items",
  CMS_DISTRIBUTIONS: "/api/cms/distributions",
  CMS_USERS: "/api/cms/users",
  CMS_FOUNDATIONS: "/api/cms/foundations",

  // CMS Base (for dynamic endpoint building)
  CMS_BASE: "/api/cms",

  // Supplier Management APIs
  CMS_SUPPLIERS: "/api/cms/suppliers",
  CMS_SUPPLIER_PRODUCTS: "/api/cms/supplier-products",
  CMS_COMMODITY_CATEGORIES: "/api/cms/commodity-categories",
  CMS_COMMODITIES: "/api/cms/commodities",
  CMS_STOCK_MOVEMENTS: "/api/cms/stock/movements",

  // Auth APIs
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",
  CMS_AUTH_ME: "/api/cms/auth/me",
} as const;
