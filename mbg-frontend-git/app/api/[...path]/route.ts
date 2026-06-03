import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Path remappings: Next.js path prefix → Express path prefix
// More specific paths MUST come before less specific ones
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

  // CMS settings
  ['/api/cms/settings', '/api/cms/settings'],

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

// Headers that should not be forwarded
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
  'host',
  // Prevent backend from sending compressed responses that Node fetch auto-decompresses
  // but whose Content-Encoding header would confuse the browser
  'accept-encoding',
  'content-encoding',
]);

async function proxyHandler(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const targetPath = remapPath(url.pathname);
  const targetUrl = `${API_URL}${targetPath}${url.search}`;

  // Forward request headers (except hop-by-hop)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual', // Don't follow redirects - pass them back to the client
  };

  // Forward request body for methods that have one
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // For file uploads, forward the raw body to preserve multipart boundaries
      fetchOptions.body = await req.arrayBuffer();
    } else {
      // For JSON and other content types
      try {
        fetchOptions.body = await req.arrayBuffer();
      } catch {
        // No body
      }
    }
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    // Build response headers (exclude hop-by-hop)
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy] Error forwarding request:', targetUrl, error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
