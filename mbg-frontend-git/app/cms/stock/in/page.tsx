'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconPlus, IconCheck, IconPackage } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';
import SearchableSelect from '@/components/shared/SearchableSelect';

interface Product {
  id: string;
  supplier_id: string;
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
  address: string;
  phone: string;
}

export default function StockInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({
    supplier_product_id: '',
    quantity: 0,
    reason: '',
    notes: '',
    is_expirable: false,
    expired_from: '',
    expired_until: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
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

      // Load suppliers (for admin)
      const suppliersRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers?limit=1000`), {
        credentials: 'include',
      });
      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        const suppliersArray = Array.isArray(data) ? data : (data.data || []);
        setSuppliers(suppliersArray);
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
      const requestBody: any = {
        supplier_product_id: form.supplier_product_id,
        movement_type: 'in',
        quantity: parseFloat(form.quantity.toString()),
        reason: form.reason || 'Pembelian',
        notes: form.notes,
        is_expirable: form.is_expirable
      };
      
      // Add expirable date fields if applicable
      if (form.is_expirable) {
        requestBody.expired_from = form.expired_from;
        requestBody.expired_until = form.expired_until;
      }

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
        setError(data.error || 'Gagal menyimpan stok masuk');
        return;
      }

      setSuccess(true);
      
      // Reset form
      setForm({
        supplier_product_id: '',
        quantity: 0,
        reason: '',
        notes: '',
        is_expirable: false,
        expired_from: '',
        expired_until: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/cms/reports/stock');
      }, 2000);
    } catch (error) {
      console.error('Error saving stock in:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => p.id === form.supplier_product_id);

  const filteredProducts = products.filter(p => 
    p.commodities.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <h1 className="text-2xl font-bold text-gray-900">Tambah Stok Masuk</h1>
                  {userRole === 'pemasok' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Mode Pemasok
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {userRole === 'pemasok' ? 'Catat stok barang yang masuk ke gudang Anda' : 'Catat stok barang yang masuk ke gudang pemasok'}
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
                  <p className="font-semibold text-green-900">Stok berhasil ditambahkan!</p>
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
                  {/* Supplier Selection (Admin only) */}
                  {userRole === 'administrator' && (
                    <SearchableSelect
                      label="Pilih Pemasok"
                      options={suppliers.map(supplier => ({
                        value: supplier.id,
                        label: supplier.name,
                        description: supplier.address + (supplier.phone ? ` • 📞 ${supplier.phone}` : '')
                      }))}
                      value={selectedSupplierId}
                      onChange={setSelectedSupplierId}
                      placeholder="-- Pilih Pemasok --"
                      searchPlaceholder="Cari pemasok..."
                      emptyMessage="Tidak ada pemasok tersedia"
                      required
                    />
                  )}

                  {/* Product Selection */}
                  <SearchableSelect
                    label="Pilih Produk"
                    options={products
                      .filter(product => {
                        // If admin and supplier selected, filter by supplier
                        if (userRole === 'administrator' && selectedSupplierId) {
                          return product.supplier_id === selectedSupplierId;
                        }
                        // Pemasok already filtered from API
                        return true;
                      })
                      .map(product => ({
                        value: product.id,
                        label: product.commodities.name,
                        description: `Stok saat ini: ${product.stock} ${product.commodities.unit}`
                      }))}
                    value={form.supplier_product_id}
                    onChange={(value) => setForm({ ...form, supplier_product_id: value })}
                    placeholder={userRole === 'administrator' && !selectedSupplierId ? '-- Pilih Pemasok terlebih dahulu --' : '-- Pilih Produk --'}
                    searchPlaceholder="Cari produk..."
                    emptyMessage={userRole === 'administrator' && !selectedSupplierId ? 'Silakan pilih pemasok terlebih dahulu' : 'Tidak ada produk tersedia'}
                    required
                    disabled={userRole === 'administrator' && !selectedSupplierId}
                  />

                  {/* Selected Product Info */}
                  {selectedProduct && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconPackage className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{selectedProduct.commodities.name}</h4>
                          <p className="text-sm text-gray-600">
                            Stok sekarang: {selectedProduct.stock} {selectedProduct.commodities.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Masuk <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.quantity || ''}
                        onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.1"
                        placeholder="100"
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
                      <p className="text-sm text-green-600 mt-2">
                        Stok akan menjadi: {selectedProduct.stock + form.quantity} {selectedProduct.commodities.unit}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <SearchableSelect
                    label="Alasan"
                    options={[
                      { value: 'Pembelian', label: 'Pembelian' },
                      { value: 'Retur', label: 'Retur dari pelanggan' },
                      { value: 'Koreksi', label: 'Koreksi stok' },
                      { value: 'Stok awal', label: 'Stok awal' },
                      { value: 'Lainnya', label: 'Lainnya' }
                    ]}
                    value={form.reason}
                    onChange={(value) => setForm({ ...form, reason: value })}
                    placeholder="-- Pilih Alasan --"
                    searchPlaceholder="Cari alasan..."
                  />
                  
                  {/* Expirable Status */}
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
                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      placeholder="Contoh: Invoice #12345, Supplier X"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      disabled={saving || !form.supplier_product_id || form.quantity <= 0}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                    >
                      <IconPlus className="h-5 w-5" />
                      {saving ? 'Menyimpan...' : 'Tambah Stok'}
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
