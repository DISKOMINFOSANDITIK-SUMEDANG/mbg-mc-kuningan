'use client';

import { useState, useEffect } from 'react';
import { IconPackage, IconCurrencyDollar, IconCheck, IconX, IconArrowRight } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  is_active: boolean;
}

interface SupplierProduct {
  id: string;
  price_per_unit: number;
  stock: number;
  availability_status: string;
  commodities?: {
    id: string;
    name: string;
    unit: string;
    commodity_categories?: {
      id: string;
      name: string;
    };
  };
}

interface DashboardStats {
  totalProducts: number;
  availableProducts: number;
  unavailableProducts: number;
  avgPrice: number;
}

export default function PemasokDashboardPage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    availableProducts: 0,
    unavailableProducts: 0,
    avgPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load supplier profile
      const supplierResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers`), {
        credentials: 'include',
      });
      
      if (!supplierResponse.ok) {
        setError('Gagal memuat data pemasok');
        return;
      }
      
      const supplierData = await supplierResponse.json();
      const suppliers = Array.isArray(supplierData) ? supplierData : (supplierData.data || []);
      
      if (suppliers.length > 0) {
        setSupplier(suppliers[0]);
      }

      // Load products
      const productsResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const productsList = Array.isArray(productsData) ? productsData : (productsData.data || []);
        setProducts(productsList);

        // Calculate stats
        const availableCount = productsList.filter((p: SupplierProduct) => p.is_available).length;
        const totalPrice = productsList.reduce((sum: number, p: SupplierProduct) => sum + p.price_per_unit, 0);
        
        setStats({
          totalProducts: productsList.length,
          availableProducts: availableCount,
          unavailableProducts: productsList.length - availableCount,
          avgPrice: productsList.length > 0 ? totalPrice / productsList.length : 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Pemasok</h1>
            <p className="text-gray-600">
              Selamat datang{supplier ? `, ${supplier.name}` : ''}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Produk</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <IconPackage className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Produk Tersedia</p>
                      <p className="text-2xl font-bold text-green-600">{stats.availableProducts}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <IconCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tidak Tersedia</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.unavailableProducts}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <IconX className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rata-rata Harga</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgPrice)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <IconCurrencyDollar className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/cms/supplier-profile"
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Profil Pemasok</h3>
                      <p className="text-gray-600 mt-1">Kelola informasi dan detail pemasok Anda</p>
                    </div>
                    <IconArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>

                <Link
                  href="/cms/my-products"
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Kelola Produk</h3>
                      <p className="text-gray-600 mt-1">Tambah, edit, dan atur ketersediaan produk</p>
                    </div>
                    <IconArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Recent Products */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Produk Terbaru</h2>
                    <Link
                      href="/cms/my-products"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Lihat Semua
                    </Link>
                  </div>
                </div>
                {products.length === 0 ? (
                  <div className="p-8 text-center">
                    <IconPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada produk. Mulai dengan menambahkan produk baru.</p>
                    <Link
                      href="/cms/my-products"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tambah Produk
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Komoditas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategori
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Harga
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.slice(0, 5).map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{product.commodities?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{product.commodities?.commodity_categories?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatCurrency(product.price_per_unit)} / {product.commodities?.unit || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.availability_status === 'available' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.availability_status === 'available' ? 'Tersedia' : 'Tidak Tersedia'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
