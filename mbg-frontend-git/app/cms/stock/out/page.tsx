'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconMinus, IconCheck, IconPackage, IconAlertTriangle } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';
import SearchableSelect from '@/components/shared/SearchableSelect';

interface Product {
  id: string;
  commodity_id: string;
  price_per_unit: number;
  stock: number;
  commodities: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export default function StockOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  
  const [form, setForm] = useState({
    supplier_product_id: '',
    quantity: 0,
    reason: 'Penyesuaian Stok',
    notes: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Get user role
      const meResponse = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setUserRole(meData.role);
        
        // Load suppliers for admin
        if (meData.role === 'administrator') {
          const suppliersResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers?limit=1000`), {
            credentials: 'include',
          });
          
          if (suppliersResponse.ok) {
            const suppliersData = await suppliersResponse.json();
            // API returns { suppliers: [], pagination: {} }
            setSuppliers(Array.isArray(suppliersData.suppliers) ? suppliersData.suppliers : []);
          }
        }
      }
      
      // Load products
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.supplier_product_id) {
      setError('Pilih produk terlebih dahulu');
      return;
    }

    if (form.quantity <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }

    const selectedProduct = products.find(p => p.id === form.supplier_product_id);
    if (selectedProduct && form.quantity > selectedProduct.stock) {
      setError(`Jumlah tidak boleh melebihi stok tersedia (${selectedProduct.stock} ${selectedProduct.commodities.unit})`);
      return;
    }

    setSaving(true);
    try {
      // Prepare request body
      const requestBody: Record<string, unknown> = {
        supplier_product_id: form.supplier_product_id,
        movement_type: 'out',
        quantity: parseFloat(form.quantity.toString()),
        reference_type: 'manual_out',
        notes: `${form.reason}: ${form.notes}`
      };
      
      // Add supplier_id for admin
      if (userRole === 'administrator' && selectedSupplierId) {
        requestBody.supplier_id = selectedSupplierId;
      }
      
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan stok keluar');
        return;
      }

      setSuccess(true);
      
      // Reset form
      setForm({
        supplier_product_id: '',
        quantity: 0,
        reason: 'Penyesuaian Stok',
        notes: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/cms/reports/stock');
      }, 2000);
    } catch (error) {
      console.error('Error saving stock out:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => p.id === form.supplier_product_id);

  const filteredProducts = products.filter(p => 
    p.commodities.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reasonOptions = [
    { value: 'Penyesuaian Stok', label: 'Penyesuaian Stok' },
    { value: 'Barang Rusak', label: 'Barang Rusak' },
    { value: 'Kadaluarsa', label: 'Kadaluarsa' },
    { value: 'Hilang', label: 'Hilang' },
  ];

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
                <h1 className="text-2xl font-bold text-gray-900">Catat Stok Keluar</h1>
                <p className="text-gray-600 mt-1">Kurangi stok untuk adjustment, barang rusak, atau kehilangan</p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IconAlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Catatan Penting:</p>
                <p>Stok keluar dari penjualan akan <strong>otomatis tercatat</strong> saat Anda membuat transaksi penjualan. 
                Halaman ini hanya untuk mencatat pengurangan stok manual seperti kerusakan, kehilangan, atau penyesuaian.</p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Stok berhasil dikurangi!</p>
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Supplier Selection - Admin Only */}
                  {userRole === 'administrator' && (
                    <SearchableSelect
                      label="Pilih Pemasok"
                      options={suppliers.map(supplier => ({
                        value: supplier.id,
                        label: supplier.name,
                        description: supplier.address || ''
                      }))}
                      value={selectedSupplierId}
                      onChange={(value) => setSelectedSupplierId(value)}
                      placeholder="-- Pilih Pemasok --"
                      searchPlaceholder="Cari pemasok..."
                      emptyMessage="Tidak ada pemasok tersedia"
                      required
                    />
                  )}
                  
                  {/* Product Selection */}
                  <SearchableSelect
                    label="Pilih Produk"
                    options={products.map(product => ({
                      value: product.id,
                      label: product.commodities.name,
                      description: `Stok saat ini: ${product.stock} ${product.commodities.unit}`
                    }))}
                    value={form.supplier_product_id}
                    onChange={(value) => setForm({ ...form, supplier_product_id: value })}
                    placeholder="-- Pilih Produk --"
                    searchPlaceholder="Cari produk..."
                    emptyMessage="Tidak ada produk tersedia"
                    required
                  />

                  {/* Selected Product Info */}
                  {selectedProduct && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconPackage className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{selectedProduct.commodities.name}</h4>
                          <p className="text-sm text-gray-600">
                            Stok sekarang: <span className="font-semibold">{selectedProduct.stock} {selectedProduct.commodities.unit}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <SearchableSelect
                    label="Alasan"
                    options={reasonOptions.map(option => ({
                      value: option.value,
                      label: option.label
                    }))}
                    value={form.reason}
                    onChange={(value) => setForm({ ...form, reason: value })}
                    placeholder="-- Pilih Alasan --"
                    searchPlaceholder="Cari alasan..."
                    required
                  />

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Keluar <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.quantity || ''}
                        onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max={selectedProduct?.stock || 0}
                        step="0.1"
                        placeholder="10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={!selectedProduct}
                      />
                      {selectedProduct && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          {selectedProduct.commodities.unit}
                        </span>
                      )}
                    </div>
                    {selectedProduct && form.quantity > 0 && (
                      <p className={`text-sm mt-2 ${
                        form.quantity > selectedProduct.stock ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {form.quantity > selectedProduct.stock ? (
                          <>⚠️ Melebihi stok tersedia!</>
                        ) : (
                          <>Stok akan menjadi: {selectedProduct.stock - form.quantity} {selectedProduct.commodities.unit}</>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan Detail <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      placeholder="Jelaskan detail alasan pengurangan stok..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
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
                      disabled={saving || !form.supplier_product_id || form.quantity <= 0 || !form.notes}
                      className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                    >
                      <IconMinus className="h-5 w-5" />
                      {saving ? 'Menyimpan...' : 'Kurangi Stok'}
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
