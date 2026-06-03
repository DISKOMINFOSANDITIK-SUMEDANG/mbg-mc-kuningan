'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconPackage, IconCheck, IconX } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface SupplierProduct {
  id: string;
  supplier_id: string;
  commodity_id: string;
  price_per_unit: number;
  stock: number;
  availability_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  commodities?: {
    id: string;
    name: string;
    unit: string;
    photo_url?: string;
    commodity_categories?: {
      id: string;
      name: string;
    };
  };
  suppliers?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  useEffect(() => {
    loadUserRole();
    loadProducts();
  }, [currentPage]);

  const loadUserRole = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH_ME), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role || '');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products?page=${currentPage}&limit=20`), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini');
        } else {
          setError('Gagal memuat data produk');
        }
        return;
      }
      
      const data = await response.json();
      console.log('[PRODUCTS PAGE] Received products:', data);
      const productsArray = Array.isArray(data) ? data : (data.data || []);
      setProducts(productsArray);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      // Get supplier name from first product
      if (productsArray.length > 0 && productsArray[0].suppliers?.name) {
        setSupplierName(productsArray[0].suppliers.name);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.commodities?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.commodities?.commodity_categories?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !availabilityFilter || product.availability_status === availabilityFilter;
    return matchesSearch && matchesAvailability;
  });

  const handleDelete = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products/${productId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus produk');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk');
    }
  };

  const handleToggleAvailability = async (product: SupplierProduct) => {
    try {
      const newStatus = product.availability_status === 'available' ? 'out_of_stock' : 'available';
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products/${product.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability_status: newStatus }),
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal mengubah ketersediaan');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Gagal mengubah ketersediaan');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      available: { 
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100', 
        text: 'text-green-800', 
        border: 'border-green-300',
        label: '✓ Tersedia' 
      },
      limited: { 
        bg: 'bg-gradient-to-r from-yellow-100 to-orange-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-300',
        label: '⚠ Terbatas' 
      },
      out_of_stock: { 
        bg: 'bg-gradient-to-r from-gray-100 to-gray-200', 
        text: 'text-gray-800', 
        border: 'border-gray-300',
        label: '✕ Habis' 
      },
      discontinued: { 
        bg: 'bg-gradient-to-r from-red-100 to-pink-100', 
        text: 'text-red-800', 
        border: 'border-red-300',
        label: '⊘ Discontinued' 
      }
    };
    const badge = badges[status as keyof typeof badges] || badges.available;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userRole === 'pemasok' ? 'Produk Saya' : 'Produk Pemasok'}
                  </h1>
                  {userRole === 'pemasok' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Mode Pemasok
                    </span>
                  )}
                  {userRole === 'administrator' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Mode Administrator
                    </span>
                  )}
                  {userRole === 'dinas_pertanian' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Mode Dinas Pertanian
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {userRole === 'pemasok' 
                    ? (supplierName 
                        ? `Kelola produk komoditas dari ${supplierName}` 
                        : 'Kelola produk komoditas yang Anda sediakan')
                    : userRole === 'dinas_pertanian'
                      ? 'Kelola semua produk komoditas dari semua pemasok'
                      : 'Lihat semua produk komoditas dari semua pemasok'
                  }
                </p>
              </div>
              {(userRole === 'pemasok' || userRole === 'dinas_pertanian') && (
                <Link
                  href="/cms/products/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <IconPlus className="h-5 w-5" />
                  Tambah Produk
                </Link>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari komoditas atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm font-medium"
                >
                  <option value="">Semua Status</option>
                  <option value="available">✓ Tersedia</option>
                  <option value="limited">⚠ Terbatas</option>
                  <option value="out_of_stock">✕ Habis</option>
                  <option value="discontinued">⊘ Discontinued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat data produk...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <IconPackage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Tidak ada produk yang ditemukan' : 'Belum ada produk'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Coba ubah kata kunci pencarian Anda' 
                    : userRole === 'pemasok' 
                      ? 'Mulai dengan menambahkan produk komoditas yang Anda sediakan.'
                      : 'Belum ada produk yang terdaftar dari pemasok manapun.'
                  }
                </p>
                {(userRole === 'pemasok' || userRole === 'dinas_pertanian') && !searchQuery && (
                  <Link
                    href="/cms/products/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <IconPlus className="h-5 w-5" />
                    Tambah Produk Pertama
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {(userRole === 'administrator' || userRole === 'dinas_pertanian') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pemasok
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Komoditas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga/Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        {(userRole === 'administrator' || userRole === 'dinas_pertanian') && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {product.suppliers?.logo_url ? (
                                <img 
                                  src={product.suppliers.logo_url} 
                                  alt={product.suppliers.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {product.suppliers?.name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {product.suppliers?.name || '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Pemasok
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {product.commodities?.photo_url ? (
                              <img 
                                src={product.commodities.photo_url} 
                                alt={product.commodities.name}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-2 border-green-300">
                                <IconPackage className="h-6 w-6 text-green-700" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {product.commodities?.name || '-'}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                Per {product.commodities?.unit || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                            {product.commodities?.commodity_categories?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-700">
                            {formatCurrency(product.price_per_unit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            per {product.commodities?.unit || 'unit'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {product.stock} {product.commodities?.unit || ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            tersedia
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.availability_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/cms/products/${product.id}/edit`}
                              className="text-blue-600 hover:text-white hover:bg-blue-600 p-2 rounded-lg hover:shadow-md transition-all duration-200 border border-transparent hover:border-blue-600"
                              title="Edit Produk"
                            >
                              <IconEdit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleToggleAvailability(product)}
                              className={`p-2 rounded-lg transition-all duration-200 border hover:shadow-md ${
                                product.availability_status === 'available'
                                  ? 'text-orange-600 hover:text-white hover:bg-orange-600 border-transparent hover:border-orange-600' 
                                  : 'text-green-600 hover:text-white hover:bg-green-600 border-transparent hover:border-green-600'
                              }`}
                              title={product.availability_status === 'available' ? 'Tandai Tidak Tersedia' : 'Tandai Tersedia'}
                            >
                              {product.availability_status === 'available' ? <IconX className="h-5 w-5" /> : <IconCheck className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg hover:shadow-md transition-all duration-200 border border-transparent hover:border-red-600"
                              title="Hapus Produk"
                            >
                              <IconTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} sampai{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
                    {pagination.total} produk
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let startPage = Math.max(1, pagination.page - 2);
                      if (startPage + 4 > pagination.totalPages) startPage = Math.max(1, pagination.totalPages - 4);
                      const pageNum = startPage + i;
                      if (pageNum > pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            pagination.page === pageNum
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
