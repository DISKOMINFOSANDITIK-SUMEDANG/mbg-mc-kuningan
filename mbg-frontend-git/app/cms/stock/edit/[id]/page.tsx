'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconArrowLeft, IconCheck, IconPackage, IconEdit } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';
import SearchableSelect from '@/components/shared/SearchableSelect';

interface StockMovement {
  id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: string | number;
  reference_type: string;
  reason?: string;
  notes: string;
  movement_date: string;
  created_at: string;
  supplier_id: string;
  supplier_product_id: string;
  is_expirable?: boolean;
  expired_from?: string;
  expired_until?: string;
  suppliers?: {
    id: string;
    name: string;
  };
  supplier_products: {
    id: string;
    stock: number;
    commodities: {
      id: string;
      name: string;
      unit: string;
    };
  };
}

export default function EditStockMovementPage() {
  const router = useRouter();
  const params = useParams();
  const movementId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    quantity: 0,
    reason: '',
    notes: '',
    movement_date: '',
    is_expirable: false,
    expired_from: '',
    expired_until: ''
  });

  useEffect(() => {
    loadMovement();
  }, [movementId]);

  const loadMovement = async () => {
    setLoading(true);
    try {
      // Get user info
      const userRes = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.role);
      }

      // Load movement details
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${movementId}`), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Gagal memuat data pergerakan stok');
      }

      const data = await response.json();
      setMovement(data);
      
      // Set form values
      setForm({
        quantity: parseFloat(data.quantity.toString()),
        reason: data.reason || '',
        notes: data.notes || '',
        movement_date: data.movement_date || new Date().toISOString().split('T')[0],
        is_expirable: data.is_expirable || false,
        expired_from: data.expired_from || '',
        expired_until: data.expired_until || ''
      });
    } catch (error) {
      console.error('Error loading movement:', error);
      setError('Gagal memuat data pergerakan stok');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.quantity <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    
    // Validate expirable fields
    if (form.is_expirable) {
      if (!form.expired_from || !form.expired_until) {
        setError('Rentang tanggal kadaluarsa wajib diisi untuk produk yang dapat kadaluarsa');
        return;
      }
      
      const fromDate = new Date(form.expired_from);
      const untilDate = new Date(form.expired_until);
      
      if (untilDate <= fromDate) {
        setError('Tanggal akhir kadaluarsa harus setelah tanggal mulai');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${movementId}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(form.quantity.toString()),
          reason: form.reason,
          notes: form.notes,
          movement_date: form.movement_date,
          is_expirable: form.is_expirable,
          expired_from: form.is_expirable ? form.expired_from : null,
          expired_until: form.is_expirable ? form.expired_until : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal mengupdate pergerakan stok');
        return;
      }

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/cms/reports/stock');
      }, 2000);
    } catch (error) {
      console.error('Error updating movement:', error);
      setError('Terjadi kesalahan saat mengupdate');
    } finally {
      setSaving(false);
    }
  };

  const calculateNewStock = () => {
    if (!movement) return 0;
    
    const currentStock = parseFloat(movement.supplier_products.stock.toString());
    const oldQuantity = parseFloat(movement.quantity.toString());
    const newQuantity = form.quantity;

    let stock = currentStock;
    
    // Reverse old movement
    if (movement.movement_type === 'in') {
      stock -= oldQuantity;
    } else if (movement.movement_type === 'out') {
      stock += oldQuantity;
    }

    // Apply new movement
    if (movement.movement_type === 'in') {
      stock += newQuantity;
    } else if (movement.movement_type === 'out') {
      stock -= newQuantity;
    }

    return stock;
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
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
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Edit Pergerakan Stok</h1>
                  {userRole === 'pemasok' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Mode Pemasok
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  Ubah data pergerakan stok dan stok akan disesuaikan otomatis
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Pergerakan stok berhasil diperbarui!</p>
                  <p className="text-sm text-green-700 mt-1">Anda akan dialihkan ke laporan stok...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : !movement ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">Data pergerakan stok tidak ditemukan</p>
              <Link
                href="/cms/reports/stock"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Kembali ke Laporan Stok
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Movement Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconPackage className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {movement.supplier_products.commodities.name}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Tipe:</span>{' '}
                            {movement.movement_type === 'in' ? (
                              <span className="text-green-600 font-medium">Stok Masuk</span>
                            ) : (
                              <span className="text-orange-600 font-medium">Stok Keluar</span>
                            )}
                          </p>
                          <p>
                            <span className="font-medium">Stok sekarang:</span>{' '}
                            {movement.supplier_products.stock} {movement.supplier_products.commodities.unit}
                          </p>
                          {userRole === 'administrator' && movement.suppliers && (
                            <p>
                              <span className="font-medium">Pemasok:</span>{' '}
                              {movement.suppliers.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.quantity || ''}
                        onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.1"
                        placeholder="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {movement.supplier_products.commodities.unit}
                      </span>
                    </div>
                    {form.quantity > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        Stok akan menjadi: {calculateNewStock()} {movement.supplier_products.commodities.unit}
                      </p>
                    )}
                  </div>

                  {/* Movement Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Pergerakan
                    </label>
                    <input
                      type="date"
                      value={form.movement_date}
                      onChange={(e) => setForm({ ...form, movement_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Reason */}
                  <SearchableSelect
                    label="Alasan"
                    options={[
                      { value: 'Pembelian', label: 'Pembelian' },
                      { value: 'Penjualan', label: 'Penjualan' },
                      { value: 'Retur', label: 'Retur' },
                      { value: 'Koreksi', label: 'Koreksi stok' },
                      { value: 'Penyesuaian', label: 'Penyesuaian' },
                      { value: 'Barang Rusak', label: 'Barang Rusak' },
                      { value: 'Kadaluarsa', label: 'Kadaluarsa' },
                      { value: 'Hilang', label: 'Hilang' },
                      { value: 'Lainnya', label: 'Lainnya' }
                    ]}
                    value={form.reason}
                    onChange={(value) => setForm({ ...form, reason: value })}
                    placeholder="-- Pilih Alasan --"
                    searchPlaceholder="Cari alasan..."
                  />

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      placeholder="Tambahkan catatan..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Expirable Status - Only for 'in' movements */}
                  {movement.movement_type === 'in' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="is_expirable"
                          checked={form.is_expirable}
                          onChange={(e) => setForm({ 
                            ...form, 
                            is_expirable: e.target.checked,
                            expired_from: e.target.checked ? form.expired_from : '',
                            expired_until: e.target.checked ? form.expired_until : ''
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor="is_expirable" className="block text-sm font-medium text-gray-900 cursor-pointer">
                            Produk dapat kadaluarsa
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Centang jika produk ini memiliki tanggal kadaluarsa
                          </p>
                        </div>
                      </div>
                      
                      {/* Expiry Date Range - Only show if is_expirable is checked */}
                      {form.is_expirable && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800">
                              <strong>Perhatian:</strong> Sistem akan otomatis memindahkan stok ke "Stok Keluar" setelah melewati tanggal akhir kadaluarsa.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Mulai Kadaluarsa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={form.expired_from}
                                onChange={(e) => setForm({ ...form, expired_from: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required={form.is_expirable}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Akhir Kadaluarsa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={form.expired_until}
                                onChange={(e) => setForm({ ...form, expired_until: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required={form.is_expirable}
                                min={form.expired_from || undefined}
                              />
                            </div>
                          </div>
                          
                          {form.expired_from && form.expired_until && (
                            <div className="text-sm text-gray-600">
                              Rentang kadaluarsa: {new Date(form.expired_from).toLocaleDateString('id-ID')} - {new Date(form.expired_until).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Perhatian:</strong> Perubahan jumlah akan otomatis menyesuaikan stok produk.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Link
                      href="/cms/reports/stock"
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Batal
                    </Link>
                    <button
                      type="submit"
                      disabled={saving || form.quantity <= 0}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                    >
                      <IconEdit className="h-5 w-5" />
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
