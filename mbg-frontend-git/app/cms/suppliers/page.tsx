'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconEye, IconTruck, IconCheck, IconX } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [pageLimit] = useState(10);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check user role and redirect pemasok to their profile
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/auth/me'), {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          
          // If pemasok, redirect to their profile page
          if (userData.role === 'pemasok') {
            router.push('/cms/supplier-profile');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, [router]);

  const loadSuppliers = async (page = 1) => {
    // Only load if administrator
    if (userRole === 'pemasok') return;
    
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageLimit.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { q: searchQuery })
      });
      
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers?${params}`), {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.');
        } else if (response.status === 403) {
          setError('Anda tidak memiliki izin untuk mengakses halaman ini.');
        } else {
          setError(errorData.error || `Gagal memuat data: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      const suppliersData = Array.isArray(data) ? data : (data.data || []);
      setSuppliers(suppliersData);
      
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalSuppliers(data.pagination.total);
      } else {
        setTotalSuppliers(suppliersData.length);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setError('Terjadi kesalahan saat memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole && userRole !== 'pemasok') {
      loadSuppliers(1);
    }
  }, [userRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userRole && userRole !== 'pemasok') {
        setCurrentPage(1);
        loadSuppliers(1);
      }
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, userRole]);

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pemasok ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers/${supplierId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadSuppliers(currentPage);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menghapus pemasok');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Gagal menghapus pemasok');
    }
  };

  const handleToggleStatus = async (supplierId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers/${supplierId}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await loadSuppliers(currentPage);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal mengubah status pemasok');
      }
    } catch (error) {
      console.error('Error toggling supplier status:', error);
      alert('Gagal mengubah status pemasok');
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'active'
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {status === 'active' ? 'Aktif' : 'Tidak Aktif'}
      </span>
    );
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        {/* Show loading while checking role */}
        {!userRole || userRole === 'pemasok' ? (
          <PageLoadingState message="Memuat halaman..." />
        ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Pemasok</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Mode Administrator
                </span>
              </div>
              <p className="text-gray-600">Kelola data pemasok bahan baku</p>
            </div>
            <Link
              href="/cms/suppliers/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconPlus className="h-5 w-5" />
              Tambah Pemasok
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => loadSuppliers(currentPage)}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, alamat, atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="p-8 text-center">
                <IconTruck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Belum ada pemasok</h3>
                <p className="text-gray-600">Mulai dengan menambahkan pemasok baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pemasok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kontak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alamat
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
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {supplier.logo_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={supplier.logo_url}
                                  alt={supplier.name}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%23e5e7eb"/></svg>';
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <IconTruck className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                              {supplier.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{supplier.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supplier.phone || '-'}</div>
                          <div className="text-sm text-gray-500">{supplier.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {supplier.address || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(supplier.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/cms/suppliers/${supplier.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Lihat Detail"
                            >
                              <IconEye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/cms/suppliers/${supplier.id}/edit`}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Edit"
                            >
                              <IconEdit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(supplier.id, supplier.status)}
                              className={`p-1 rounded ${
                                supplier.status === 'active'
                                  ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={supplier.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {supplier.status === 'active' ? <IconX className="h-5 w-5" /> : <IconCheck className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Hapus"
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
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Menampilkan {suppliers.length} dari {totalSuppliers} pemasok
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSuppliers(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => loadSuppliers(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </ClientOnly>
    </CMSLayout>
  );
}
