'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconEdit, IconTrash, IconPackage, IconCalendar, IconNotes, IconTrendingUp, IconTrendingDown, IconBuilding } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface StockMovement {
  id: string;
  movement_number: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: string | number;
  previous_stock: string | number;
  new_stock: string | number;
  reason: string;
  notes: string;
  movement_date: string;
  created_at: string;
  updated_at: string;
  supplier_id: string;
  suppliers?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  supplier_products: {
    id: string;
    price_per_unit: number;
    stock: number;
    commodities: {
      id: string;
      name: string;
      unit: string;
    };
  };
}

export default function StockMovementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSupplierId, setUserSupplierId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user info
      const userRes = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.role);
        
        if (userData.role === 'pemasok') {
          const supplierUserRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-users/by-user/${userData.id}`), {
            credentials: 'include',
          });
          if (supplierUserRes.ok) {
            const supplierUserData = await supplierUserRes.json();
            if (supplierUserData && supplierUserData.supplier_id) {
              setUserSupplierId(supplierUserData.supplier_id);
            }
          }
        }
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${params.id}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMovement(data);
      } else {
        setError('Data pergerakan stok tidak ditemukan');
      }
    } catch (error) {
      console.error('Error loading stock movement:', error);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus pergerakan stok ini? Stok produk akan disesuaikan kembali.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${params.id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/cms/reports/stock');
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting movement:', error);
      setError('Terjadi kesalahan saat menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'in': 'Stok Masuk',
      'out': 'Stok Keluar',
      'adjustment': 'Penyesuaian'
    };
    return labels[type] || type;
  };

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      'Pembelian': 'Pembelian',
      'Retur': 'Retur dari Pelanggan',
      'Produksi': 'Hasil Produksi',
      'Penyesuaian': 'Penyesuaian Stok',
      'Barang Rusak': 'Barang Rusak',
      'Kadaluarsa': 'Barang Kadaluarsa',
      'Hilang': 'Barang Hilang',
      'Penjualan': 'Penjualan'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat detail pergerakan stok..." />
      </CMSLayout>
    );
  }

  if (error || !movement) {
    return (
      <CMSLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/cms/reports/stock"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Detail Pergerakan Stok</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700">{error || 'Data tidak ditemukan'}</p>
            <Link
              href="/cms/reports/stock"
              className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Kembali ke Laporan
            </Link>
          </div>
        </div>
      </CMSLayout>
    );
  }

  // Check if user can edit this movement
  const canEdit = userRole === 'administrator' || 
                  (userRole === 'pemasok' && userSupplierId && movement.supplier_id === userSupplierId);
  const canDelete = userRole === 'administrator';

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat detail..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/cms/reports/stock"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Detail Pergerakan Stok</h1>
                <p className="text-gray-600 mt-1">
                  No. Movement: <span className="font-mono font-semibold">{movement.movement_number}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <Link
                    href={`/cms/stock/${params.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <IconEdit className="h-5 w-5" />
                    Edit
                  </Link>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <IconTrash className="h-5 w-5" />
                    {deleting ? 'Menghapus...' : 'Hapus'}
                  </button>
                )}
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  movement.movement_type === 'in' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {getMovementTypeLabel(movement.movement_type)}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <IconPackage className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Informasi Produk</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nama Produk</p>
                    <p className="font-semibold text-lg text-gray-900">
                      {movement.supplier_products.commodities.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Satuan</p>
                      <p className="font-medium text-gray-900">
                        {movement.supplier_products.commodities.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Harga Satuan</p>
                      <p className="font-medium text-gray-900">
                        Rp {movement.supplier_products.price_per_unit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              {movement.suppliers && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconBuilding className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Pemasok</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nama Pemasok</p>
                      <p className="font-semibold text-gray-900">{movement.suppliers.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Alamat</p>
                      <p className="text-gray-900">{movement.suppliers.address}</p>
                    </div>
                    {movement.suppliers.phone && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Telepon</p>
                        <p className="text-gray-900">{movement.suppliers.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Movement Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    movement.movement_type === 'in' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {movement.movement_type === 'in' ? (
                      <IconTrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <IconTrendingDown className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">Detail Pergerakan</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Jumlah</p>
                    <p className={`text-3xl font-bold ${
                      movement.movement_type === 'in' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {movement.movement_type === 'in' ? '+' : '-'}
                      {Number(movement.quantity).toLocaleString()} {movement.supplier_products.commodities.unit}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Stok Sebelumnya</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {Number(movement.previous_stock).toLocaleString()}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Stok Setelahnya</p>
                      <p className="text-lg font-semibold text-green-600">
                        {Number(movement.new_stock).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {movement.reason && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Alasan</p>
                      <p className="font-medium text-gray-900">{getReasonLabel(movement.reason)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Notes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <IconCalendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Informasi Tambahan</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tanggal Pergerakan</p>
                    <p className="font-semibold text-gray-900">{formatDate(movement.movement_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dibuat Pada</p>
                    <p className="text-gray-900">{formatDateTime(movement.created_at)}</p>
                  </div>
                  {movement.updated_at !== movement.created_at && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Terakhir Diupdate</p>
                      <p className="text-gray-900">{formatDateTime(movement.updated_at)}</p>
                    </div>
                  )}
                  {movement.notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <IconNotes className="h-4 w-4 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Catatan</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-900 whitespace-pre-wrap">{movement.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Link
              href="/cms/reports/stock"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Kembali ke Laporan
            </Link>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
