'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowUp, IconPackage, IconSearch, IconCalendar, IconUser, IconFileText, IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface StockMovement {
  id: string;
  movement_number: string;
  supplier_id: string;
  supplier_product_id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  notes: string;
  movement_date: string;
  created_by: string;
  created_at: string;
  suppliers?: {
    id: string;
    name: string;
  };
  supplier_products?: {
    id: string;
    commodities?: {
      id: string;
      name: string;
      unit: string;
    };
  };
}

interface SupplierProduct {
  id: string;
  commodity_id: string;
  stock: number;
  commodities?: {
    id: string;
    name: string;
    unit: string;
  };
}

export default function StockInPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    supplier_product_id: '',
    quantity: '',
    reason: 'purchase',
    notes: '',
    movement_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadUserRole();
    loadData();
  }, []);

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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load products
      const productsResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const productsArray = Array.isArray(productsData) ? productsData : (productsData.data || []);
        setProducts(productsArray);
      }

      // Load stock movements (filtered for 'in' type)
      const movementsResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements`), {
        credentials: 'include',
      });
      
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        const movementsArray = Array.isArray(movementsData) ? movementsData : (movementsData.data || []);
        // Filter only 'in' movements
        const inMovements = movementsArray.filter((m: StockMovement) => m.movement_type === 'in');
        setMovements(inMovements);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_product_id || !formData.quantity) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          movement_type: 'in',
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          supplier_product_id: '',
          quantity: '',
          reason: 'purchase',
          notes: '',
          movement_date: new Date().toISOString().split('T')[0],
        });
        // Reload data
        await loadData();
        alert('Stok masuk berhasil dicatat');
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal mencatat stok masuk');
      }
    } catch (error) {
      console.error('Error submitting stock in:', error);
      alert('Gagal mencatat stok masuk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (movement: StockMovement) => {
    setEditingMovement(movement);
    setFormData({
      supplier_product_id: movement.supplier_product_id,
      quantity: movement.quantity.toString(),
      reason: movement.reason || 'purchase',
      notes: movement.notes || '',
      movement_date: movement.movement_date,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMovement || !formData.quantity) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${editingMovement.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: parseInt(formData.quantity),
          reason: formData.reason,
          notes: formData.notes,
          movement_date: formData.movement_date,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingMovement(null);
        setFormData({
          supplier_product_id: '',
          quantity: '',
          reason: 'purchase',
          notes: '',
          movement_date: new Date().toISOString().split('T')[0],
        });
        await loadData();
        alert('Stok masuk berhasil diperbarui');
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal memperbarui stok masuk');
      }
    } catch (error) {
      console.error('Error updating stock in:', error);
      alert('Gagal memperbarui stok masuk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (movementId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi stok masuk ini? Stok produk akan dikembalikan.')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${movementId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadData();
        alert('Stok masuk berhasil dihapus dan stok produk telah dikembalikan');
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus stok masuk');
      }
    } catch (error) {
      console.error('Error deleting stock in:', error);
      alert('Gagal menghapus stok masuk');
    }
  };

  const filteredMovements = movements.filter(movement => {
    const productName = movement.supplier_products?.commodities?.name?.toLowerCase() || '';
    const movementNumber = movement.movement_number?.toLowerCase() || '';
    const reason = movement.reason?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return productName.includes(query) || movementNumber.includes(query) || reason.includes(query);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReason = (reason: string) => {
    const reasons: Record<string, string> = {
      purchase: '📦 Pembelian',
      return: '↩️ Return',
      adjustment: '⚙️ Penyesuaian',
      production: '🏭 Produksi',
      other: '📝 Lainnya',
    };
    return reasons[reason] || reason;
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 -mx-6 -mt-6 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <IconArrowUp className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Stok Masuk</h1>
                <p className="text-green-100 mt-1">
                  Catat penambahan stok produk komoditas
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IconPackage className="h-5 w-5 text-green-600" />
              Tambah Stok Masuk
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produk Komoditas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplier_product_id}
                    onChange={(e) => setFormData({ ...formData, supplier_product_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  >
                    <option value="">Pilih Produk</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.commodities?.name} (Stok: {product.stock} {product.commodities?.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="Masukkan jumlah"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  >
                    <option value="purchase">📦 Pembelian</option>
                    <option value="return">↩️ Return</option>
                    <option value="adjustment">⚙️ Penyesuaian</option>
                    <option value="production">🏭 Produksi</option>
                    <option value="other">📝 Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.movement_date}
                    onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <IconArrowUp className="h-5 w-5" />
                      Catat Stok Masuk
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan produk, nomor transaksi, atau alasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>
          </div>

          {/* Movements List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Riwayat Stok Masuk</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat data...</p>
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="p-12 text-center">
                <IconPackage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum ada riwayat stok masuk
                </h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Mulai catat stok masuk produk Anda'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No. Transaksi
                      </th>
                      {(userRole === 'administrator' || userRole === 'dinas_pertanian') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pemasok
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alasan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Catatan
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMovements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <IconFileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-900">
                              {movement.movement_number}
                            </span>
                          </div>
                        </td>
                        {(userRole === 'administrator' || userRole === 'dinas_pertanian') && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {movement.suppliers?.name || '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {movement.supplier_products?.commodities?.name || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {movement.supplier_products?.commodities?.unit || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-300">
                            <IconArrowUp className="h-4 w-4" />
                            +{movement.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {movement.previous_stock} → <span className="font-bold text-green-700">{movement.new_stock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {getReason(movement.reason)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <IconCalendar className="h-4 w-4 text-gray-400" />
                            {formatDate(movement.movement_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {movement.notes || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(movement)}
                              className="text-blue-600 hover:text-white hover:bg-blue-600 p-2 rounded-lg hover:shadow-md transition-all duration-200 border border-transparent hover:border-blue-600"
                              title="Edit Transaksi"
                            >
                              <IconEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(movement.id)}
                              className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg hover:shadow-md transition-all duration-200 border border-transparent hover:border-red-600"
                              title="Hapus Transaksi"
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
          </div>

          {/* Edit Modal */}
          {showEditModal && editingMovement && (
            <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-xl font-bold">Edit Stok Masuk</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMovement(null);
                      setFormData({
                        supplier_product_id: '',
                        quantity: '',
                        reason: 'purchase',
                        notes: '',
                        movement_date: new Date().toISOString().split('T')[0],
                      });
                    }}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                  >
                    <IconX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-blue-900">
                      Produk: {editingMovement.supplier_products?.commodities?.name}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Transaksi: {editingMovement.movement_number}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Masukkan jumlah"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alasan
                      </label>
                      <select
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="purchase">📦 Pembelian</option>
                        <option value="return">↩️ Return</option>
                        <option value="adjustment">⚙️ Penyesuaian</option>
                        <option value="production">🏭 Produksi</option>
                        <option value="other">📝 Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={formData.movement_date}
                        onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Catatan tambahan (opsional)"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingMovement(null);
                        setFormData({
                          supplier_product_id: '',
                          quantity: '',
                          reason: 'purchase',
                          notes: '',
                          movement_date: new Date().toISOString().split('T')[0],
                        });
                      }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Menyimpan...
                        </>
                      ) : (
                        'Simpan Perubahan'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
