import { Request, Response, NextFunction } from 'express';

// Mirrors mbg-frontend-git/app/api/[...path]/route.ts PATH_REMAPS.
// Production nginx proxies /api/* directly to Express, bypassing the Next.js
// API proxy, so these friendly frontend paths must be rewritten here too.
// More specific paths MUST come before less specific ones.
const PATH_REMAPS: [string, string][] = [
  // Public menus
  ['/api/menu-items', '/api/menus/menu-items'],
  ['/api/menus', '/api/menus/menus'],

  // Public distributions
  ['/api/distributions', '/api/distributions/distributions'],

  // Upload & Files
  ['/api/upload', '/api/upload/upload'],
  ['/api/files', '/api/upload/files'],

  // Statistics
  ['/api/school-statistics', '/api/statistics/school-statistics'],
  ['/api/beneficiary-targets', '/api/statistics/beneficiary-targets'],
  ['/api/statistics', '/api/statistics/statistics'],

  // Reports
  ['/api/school-reports-recap', '/api/reports/school-reports-recap'],
  ['/api/school-reports', '/api/reports/school-reports'],
  ['/api/export-schools-report', '/api/reports/export-schools-report'],
  ['/api/sppg-distribution-details', '/api/reports/sppg-distribution-details'],
  ['/api/sppg-distribution-recap', '/api/reports/sppg-distribution-recap'],
  ['/api/sppg-distributions-recap', '/api/reports/sppg-distributions-recap'],
  ['/api/sppg-distributions-subtab', '/api/reports/sppg-distributions-subtab'],

  // SPPG products (public)
  ['/api/sppg/product-requests', '/api/sppg-products/product-requests'],
  ['/api/sppg/products', '/api/sppg-products/products'],
  ['/api/sppg/supplier-products', '/api/sppg-products/supplier-products'],

  // SPPG (general) - must come after more specific /api/sppg/* entries above
  ['/api/sppg', '/api/sppgs'],

  // CMS menu items → under /api/cms/menus/items
  ['/api/cms/menu-items', '/api/cms/menus/items'],

  // CMS stock movements → under /api/cms/stock/movements
  ['/api/cms/stock-movements/auto-expire', '/api/cms/stock/movements/auto-expire'],
  ['/api/cms/stock-movements', '/api/cms/stock/movements'],

  // CMS product requests → under /api/cms/stock
  ['/api/cms/product-requests', '/api/cms/stock/product-requests'],

  // CMS served entities → under /api/cms/stock
  ['/api/cms/served-entities', '/api/cms/stock/served-entities'],

  // CMS products → under /api/cms/stock
  ['/api/cms/products', '/api/cms/stock/products'],

  // CMS available products → under /api/cms/stock
  ['/api/cms/sppg/available-products', '/api/cms/stock/available-products'],

  // CMS user lookups → under /api/cms/stock
  ['/api/cms/supplier-users', '/api/cms/stock/supplier-users'],
  ['/api/cms/offtaker-users', '/api/cms/stock/offtaker-users'],

  // CMS transactions sub-routes
  ['/api/cms/offtaker-sales', '/api/cms/transactions/offtaker-sales'],
  ['/api/cms/offtaker-purchases', '/api/cms/transactions/offtaker-purchases'],
  ['/api/cms/sales-transactions', '/api/cms/transactions/sales'],
  ['/api/cms/additional-cost-types', '/api/cms/transactions/additional-cost-types'],
  ['/api/cms/additional-costs', '/api/cms/transactions/additional-costs'],

  // CMS auth sub-routes
  ['/api/cms/account', '/api/cms/auth/account'],
  ['/api/cms/profile', '/api/cms/auth/profile'],
  ['/api/cms/offtaker-profile', '/api/cms/auth/offtaker-profile'],
];

function remapPath(pathname: string): string {
  for (const [from, to] of PATH_REMAPS) {
    if (pathname === from) {
      return to;
    }
    if (pathname.startsWith(from + '/')) {
      return to + pathname.slice(from.length);
    }
  }
  return pathname;
}

export function pathAliasMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const url = req.url;
  const queryIndex = url.indexOf('?');
  const pathname = queryIndex >= 0 ? url.slice(0, queryIndex) : url;
  const query = queryIndex >= 0 ? url.slice(queryIndex) : '';

  const remapped = remapPath(pathname);
  if (remapped !== pathname) {
    req.url = remapped + query;
  }

  next();
}
