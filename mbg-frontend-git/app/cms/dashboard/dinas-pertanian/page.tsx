'use client';

import { useState, useEffect } from 'react';
import { 
  IconPackage, 
  IconTruck, 
  IconArrowRight,
  IconCheck,
  IconX,
  IconCurrencyDollar,
  IconBuildingStore,
  IconArrowsExchange
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface SupplierProduct {
  id: string;
  supplier_id: string;
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
  suppliers?: {
    id: string;
    name: string;
  };
}

interface DashboardStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalProducts: number;
  availableProducts: number;
}

export default function DinasPertanianDashboardPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalProducts: 0,
    availableProducts: 0,
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
      // Load all suppliers
      const supplierResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers`), {
        credentials: 'include',
      });
      
      if (!supplierResponse.ok) {
        setError('Gagal memuat data pemasok');
        return;
      }
      
      const supplierData = await supplierResponse.json();
      const suppliersList = Array.isArray(supplierData) ? supplierData : (supplierData.suppliers || []);
      setSuppliers(suppliersList);

      // Load all products from all suppliers
      const productsResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const productsList = Array.isArray(productsData) ? productsData : (productsData.data || []);
        setProducts(productsList);

        // Calculate stats
        const activeSuppliers = suppliersList.filter((s: Supplier) => s.is_active).length;
        const availableProducts = productsList.filter((p: SupplierProduct) => p.is_available).length;
        
        setStats({
          totalSuppliers: suppliersList.length,
          activeSuppliers,
          totalProducts: productsList.length,
          availableProducts,
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Dinas Pertanian</h1>
            <p className="text-gray-600">
              Kelola pemasok, produk, dan stok bahan baku
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
                      <p className="text-sm font-medium text-gray-600">Total Pemasok</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <IconTruck className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pemasok Aktif</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeSuppliers}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <IconBuildingStore className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Produk</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.totalProducts}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <IconPackage className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Produk Tersedia</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.availableProducts}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <IconCheck className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  href="/cms/suppliers"
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Kelola Pemasok</h3>
                      <p className="text-gray-600 mt-1">Edit data dan profil semua pemasok</p>
                    </div>
                    <IconArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>

                <Link
                  href="/cms/products"
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Produk Pemasok</h3>
                      <p className="text-gray-600 mt-1">Tambah produk atas nama pemasok</p>
                    </div>
                    <IconArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>

                <Link
                  href="/cms/reports/stock"
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Manajemen Stok</h3>
                      <p className="text-gray-600 mt-1">Input stok masuk, keluar, dan penyesuaian</p>
                    </div>
                    <IconArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Suppliers Overview */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Pemasok</h2>
                    <Link
                      href="/cms/suppliers"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Lihat Semua
                    </Link>
                  </div>
                </div>
                {suppliers.length === 0 ? (
                  <div className="p-8 text-center">
                    <IconTruck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada pemasok terdaftar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama Pemasok
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kontak
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Telepon
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers.slice(0, 5).map((supplier) => (
                          <tr key={supplier.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{supplier.contact_person || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{supplier.phone || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                supplier.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {supplier.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Products */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Produk Terbaru</h2>
                    <Link
                      href="/cms/products"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Lihat Semua
                    </Link>
                  </div>
                </div>
                {products.length === 0 ? (
                  <div className="p-8 text-center">
                    <IconPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada produk terdaftar.</p>
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
                            Pemasok
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
                              <div className="text-xs text-gray-500">{product.commodities?.commodity_categories?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{product.suppliers?.name || '-'}</div>
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
