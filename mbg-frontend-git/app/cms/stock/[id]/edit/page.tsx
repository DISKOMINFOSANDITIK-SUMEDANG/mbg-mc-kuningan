'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconDeviceFloppy, IconAlertCircle, IconPackage, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
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
  supplier_id: string;
  supplier_product_id: string;
  suppliers?: {
    id: string;
    name: string;
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

export default function EditStockMovementPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // For stock calculation preview
  const [currentProductStock, setCurrentProductStock] = useState(0);
  const [originalQuantity, setOriginalQuantity] = useState(0);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');

  useEffect(() => {
    loadMovement();
  }, [params.id]);

  const loadMovement = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${params.id}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data: StockMovement = await response.json();
        setMovement(data);
        
        // Set form values
        setQuantity(data.quantity.toString());
        setReason(data.reason || '');
        setNotes(data.notes || '');
        setOriginalQuantity(Number(data.quantity));
        setMovementType(data.movement_type);
        setCurrentProductStock(data.supplier_products.stock);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Data tidak ditemukan');
      }
    } catch (error) {
      console.error('Error loading movement:', error);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movement) return;

    // Validations
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }

    if (!reason.trim()) {
      setError('Alasan harus diisi');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${params.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity: qty,
          reason: reason.trim(),
          notes: notes.trim(),
        }),
      });

      if (response.ok) {
        router.push(`/cms/stock/${params.id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (error) {
      console.error('Error saving movement:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  // Calculate what the new stock will be
  const calculateNewStock = () => {
    const qty = Number(quantity) || 0;
    const original = originalQuantity;
    let stockAfterReversal = currentProductStock;

    // Reverse the original movement
    if (movementType === 'in') {
      stockAfterReversal -= original;
    } else if (movementType === 'out') {
      stockAfterReversal += original;
    }

    // Apply the new movement
    if (movementType === 'in') {
      stockAfterReversal += qty;
    } else if (movementType === 'out') {
      stockAfterReversal -= qty;
    }

    return stockAfterReversal;
  };

  const getReasonOptions = () => {
    if (movementType === 'in') {
      return ['Pembelian', 'Retur', 'Produksi', 'Penyesuaian'];
    } else if (movementType === 'out') {
      return ['Penjualan', 'Barang Rusak', 'Kadaluarsa', 'Hilang', 'Penyesuaian'];
    }
    return ['Penyesuaian'];
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data..." />
      </CMSLayout>
    );
  }

  if (error && !movement) {
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Pergerakan Stok</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700">{error}</p>
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

  if (!movement) return null;

  const newStock = calculateNewStock();
  const stockWillBeNegative = newStock < 0;

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat..." />}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
            <div className="flex items-center gap-4">
              <Link
                href={`/cms/stock/${params.id}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Edit Pergerakan Stok</h1>
                <p className="text-gray-600 mt-1">
                  No. Movement: <span className="font-mono font-semibold">{movement.movement_number}</span>
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                movementType === 'in' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {movementType === 'in' ? 'Stok Masuk' : movementType === 'out' ? 'Stok Keluar' : 'Penyesuaian'}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <IconAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Terjadi Kesalahan</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Product Info & Form */}
            <div className="space-y-6">
              {/* Product Info (Read-only) */}
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
                      <p className="text-sm text-gray-600 mb-1">Stok Saat Ini</p>
                      <p className="font-medium text-gray-900">
                        {currentProductStock.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {movement.suppliers && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Pemasok</p>
                      <p className="font-medium text-gray-900">{movement.suppliers.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Edit Detail Pergerakan</h3>
                <div className="space-y-4">
                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        step="1"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Masukkan jumlah"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {movement.supplier_products.commodities.unit}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Jumlah asli: {originalQuantity.toLocaleString()} {movement.supplier_products.commodities.unit}
                    </p>
                  </div>

                  {/* Reason */}
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Alasan <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Alasan</option>
                      {getReasonOptions().map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tambahkan catatan jika diperlukan..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stock Calculation Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    movementType === 'in' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {movementType === 'in' ? (
                      <IconTrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <IconTrendingDown className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">Preview Perubahan Stok</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Stok Produk Saat Ini</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentProductStock.toLocaleString()} {movement.supplier_products.commodities.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Perubahan</p>
                      <p className={`text-3xl font-bold ${
                        movementType === 'in' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {movementType === 'in' ? '+' : '-'}
                        {(Number(quantity) || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        (asli: {movementType === 'in' ? '+' : '-'}{originalQuantity.toLocaleString()})
                      </p>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 ${
                    stockWillBeNegative ? 'bg-red-50 border-2 border-red-300' : 'bg-blue-50 border-2 border-blue-300'
                  }`}>
                    <p className="text-sm font-medium mb-1 text-gray-700">Stok Setelah Update</p>
                    <p className={`text-3xl font-bold ${
                      stockWillBeNegative ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {newStock.toLocaleString()} {movement.supplier_products.commodities.unit}
                    </p>
                  </div>

                  {stockWillBeNegative && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900">Peringatan Stok Negatif</h4>
                          <p className="text-red-700 text-sm mt-1">
                            Perubahan ini akan menghasilkan stok negatif. Pastikan jumlah yang Anda masukkan sudah benar.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Cara Perhitungan:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Batalkan pergerakan asli ({movementType === 'in' ? '-' : '+'}{originalQuantity})</li>
                      <li>Terapkan pergerakan baru ({movementType === 'in' ? '+' : '-'}{Number(quantity) || 0})</li>
                      <li>Hasil: {currentProductStock} {movementType === 'in' ? '-' : '+'} {originalQuantity} {movementType === 'in' ? '+' : '-'} {Number(quantity) || 0} = {newStock}</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Link
              href={`/cms/stock/${params.id}`}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving || stockWillBeNegative}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              <IconDeviceFloppy className="h-5 w-5" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </ClientOnly>
    </CMSLayout>
  );
}
