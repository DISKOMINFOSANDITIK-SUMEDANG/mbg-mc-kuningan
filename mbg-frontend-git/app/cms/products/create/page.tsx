'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconLeaf, IconPlus, IconCheck } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';
import SearchableSelect from '@/components/shared/SearchableSelect';

// Common commodity units
const COMMON_UNITS = [
  { value: 'Kg', label: 'Kilogram (Kg)', description: 'Berat - untuk beras, sayur, daging, dll' },
  { value: 'Gram', label: 'Gram', description: 'Berat - untuk bumbu, rempah' },
  { value: 'Liter', label: 'Liter', description: 'Volume - untuk minyak, susu, air' },
  { value: 'Ml', label: 'Mililiter (Ml)', description: 'Volume - untuk saus, kecap' },
  { value: 'Pcs', label: 'Pieces (Pcs)', description: 'Satuan - untuk telur, buah' },
  { value: 'Pack', label: 'Pack', description: 'Kemasan - untuk gula, garam' },
  { value: 'Box', label: 'Box', description: 'Kemasan - untuk teh, kopi' },
  { value: 'Karung', label: 'Karung', description: 'Kemasan besar - untuk beras, tepung' },
  { value: 'Ikat', label: 'Ikat', description: 'Bundel - untuk sayuran' },
  { value: 'Buah', label: 'Buah', description: 'Satuan - untuk buah-buahan' },
  { value: 'Butir', label: 'Butir', description: 'Satuan - untuk telur, bawang' },
  { value: 'Ekor', label: 'Ekor', description: 'Satuan - untuk ikan, ayam' },
  { value: 'Potong', label: 'Potong', description: 'Satuan - untuk ikan, daging' },
  { value: 'Lembar', label: 'Lembar', description: 'Satuan - untuk tahu, tempe' },
  { value: 'Sachet', label: 'Sachet', description: 'Kemasan - untuk bumbu instant' },
  { value: 'Botol', label: 'Botol', description: 'Kemasan - untuk minuman' },
  { value: 'Kaleng', label: 'Kaleng', description: 'Kemasan - untuk makanan kaleng' },
  { value: 'Karton', label: 'Karton', description: 'Kemasan - untuk susu, mie instant' },
  { value: 'Roll', label: 'Roll', description: 'Gulungan - untuk plastik wrap' },
  { value: 'Dus', label: 'Dus', description: 'Kemasan besar - untuk produk kemasan' }
];

interface Commodity {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  photo_url?: string;
  commodity_categories?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  logo_url?: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<'commodity' | 'product'>('commodity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // Data
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  
  // Step 1: Commodity selection/creation
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  const [createNewCommodity, setCreateNewCommodity] = useState(false);
  const [newCommodity, setNewCommodity] = useState({
    name: '',
    category_id: '',
    unit: '',
    description: '',
    photo_url: ''
  });
  
  // Step 2: Product details
  const [productForm, setProductForm] = useState({
    supplier_id: '',
    price_per_unit: 0,
    stock: 0,
    availability_status: 'available',
    notes: '',
    is_expirable: false,
    expired_from: '',
    expired_until: ''
  });

  useEffect(() => {
    loadUserRole();
    loadData();
    loadSuppliers();
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

  const loadSuppliers = async () => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers`), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const suppliersList = Array.isArray(data) ? data : (data.data || []);
        setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load commodities
      const commoditiesRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities`), {
        credentials: 'include',
      });
      if (commoditiesRes.ok) {
        const commoditiesData = await commoditiesRes.json();
        setCommodities(Array.isArray(commoditiesData) ? commoditiesData : []);
      }

      // Load categories
      const categoriesRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodity-categories`), {
        credentials: 'include',
      });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleCommodityStep = async () => {
    setError(null);

    if (createNewCommodity) {
      // Validate new commodity
      if (!newCommodity.name || !newCommodity.unit) {
        setError('Nama komoditas dan satuan wajib diisi');
        return;
      }

      // Create new commodity
      setSaving(true);
      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities`), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCommodity)
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Gagal membuat komoditas baru');
          return;
        }

        const createdCommodity = await response.json();
        setSelectedCommodityId(createdCommodity.id);
        setStep('product');
      } catch (error) {
        console.error('Error creating commodity:', error);
        setError('Terjadi kesalahan saat membuat komoditas');
      } finally {
        setSaving(false);
      }
    } else {
      // Validate selection
      if (!selectedCommodityId) {
        setError('Pilih komoditas terlebih dahulu');
        return;
      }
      setStep('product');
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (productForm.price_per_unit <= 0) {
      setError('Harga harus lebih dari 0');
      return;
    }

    if ((userRole === 'administrator' || userRole === 'dinas_pertanian') && !productForm.supplier_id) {
      setError('Pilih pemasok terlebih dahulu');
      return;
    }

    // Validate expirable dates
    if (productForm.is_expirable) {
      if (!productForm.expired_from || !productForm.expired_until) {
        setError('Tanggal kadaluarsa wajib diisi untuk produk yang dapat kadaluarsa');
        return;
      }
      if (new Date(productForm.expired_from) >= new Date(productForm.expired_until)) {
        setError('Tanggal akhir kadaluarsa harus setelah tanggal mulai');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity_id: selectedCommodityId,
          ...productForm
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan produk');
        return;
      }

      router.push('/cms/products');
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const selectedCommodity = commodities.find(c => c.id === selectedCommodityId);

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/cms/products"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
                <p className="text-gray-600 mt-1">
                  {step === 'commodity' ? 'Pilih atau buat komoditas baru' : 'Atur harga dan stok produk'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === 'commodity' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  {step === 'product' ? <IconCheck className="h-5 w-5" /> : '1'}
                </div>
                <span className="font-medium text-gray-900">Pilih Komoditas</span>
              </div>
              <div className="w-24 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === 'product' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`font-medium ${step === 'product' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Detail Produk
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : step === 'commodity' ? (
            /* Step 1: Commodity Selection */
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                {/* Toggle: Select or Create */}
                <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setCreateNewCommodity(false)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      !createNewCommodity
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Pilih Komoditas Yang Sudah Ada
                  </button>
                  <button
                    onClick={() => setCreateNewCommodity(true)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      createNewCommodity
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Buat Komoditas Baru
                  </button>
                </div>

                {!createNewCommodity ? (
                  /* Select existing commodity */
                  <div className="space-y-4">
                    <SearchableSelect
                      label="Pilih Komoditas"
                      options={commodities.map(commodity => ({
                        value: commodity.id,
                        label: commodity.name,
                        description: `${commodity.unit} - ${commodity.commodity_categories?.name || 'Tanpa Kategori'}`
                      }))}
                      value={selectedCommodityId}
                      onChange={setSelectedCommodityId}
                      placeholder="-- Pilih Komoditas --"
                      searchPlaceholder="Cari komoditas..."
                      emptyMessage="Tidak ada komoditas tersedia"
                      required
                    />

                    {selectedCommodity && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <IconLeaf className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{selectedCommodity.name}</h4>
                            <p className="text-sm text-gray-600">
                              Kategori: {selectedCommodity.commodity_categories?.name} • Satuan: {selectedCommodity.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Create new commodity */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Komoditas <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCommodity.name}
                        onChange={(e) => setNewCommodity({ ...newCommodity, name: e.target.value })}
                        placeholder="Contoh: Beras Merah"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori
                      </label>
                      <SearchableSelect
                        options={categories.map(category => ({
                          value: category.id,
                          label: category.name
                        }))}
                        value={newCommodity.category_id}
                        onChange={(value) => setNewCommodity({ ...newCommodity, category_id: value })}
                        placeholder="-- Pilih Kategori --"
                        searchPlaceholder="Cari kategori..."
                        emptyMessage="Tidak ada kategori tersedia"
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        label="Satuan"
                        options={COMMON_UNITS}
                        value={newCommodity.unit}
                        onChange={(value) => setNewCommodity({ ...newCommodity, unit: value })}
                        placeholder="-- Pilih Satuan --"
                        searchPlaceholder="Cari satuan..."
                        emptyMessage="Tidak ada satuan tersedia"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        value={newCommodity.description}
                        onChange={(e) => setNewCommodity({ ...newCommodity, description: e.target.value })}
                        rows={3}
                        placeholder="Deskripsi singkat tentang komoditas..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCommodityStep}
                    disabled={saving || (!createNewCommodity && !selectedCommodityId)}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {saving ? 'Menyimpan...' : 'Lanjutkan'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Product Details */
            <form onSubmit={handleSubmitProduct}>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Selected Commodity Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Komoditas Terpilih:</div>
                        <div className="font-semibold text-gray-900">{selectedCommodity?.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('commodity')}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Ubah
                      </button>
                    </div>
                  </div>

                  {/* Supplier Selection - Only for Admin and Dinas Pertanian */}
                  {(userRole === 'administrator' || userRole === 'dinas_pertanian') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pemasok <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={suppliers.map(supplier => ({
                          value: supplier.id,
                          label: supplier.name
                        }))}
                        value={productForm.supplier_id}
                        onChange={(value) => setProductForm({ ...productForm, supplier_id: value })}
                        placeholder="-- Pilih Pemasok --"
                        searchPlaceholder="Cari pemasok..."
                        emptyMessage="Tidak ada pemasok tersedia"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga per {selectedCommodity?.unit} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                        <input
                          type="text"
                          value={productForm.price_per_unit ? productForm.price_per_unit.toLocaleString('id-ID') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setProductForm({ ...productForm, price_per_unit: parseInt(value) || 0 });
                          }}
                          placeholder="15.000"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok Tersedia
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={productForm.stock || ''}
                          onChange={(e) => setProductForm({ ...productForm, stock: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.1"
                          placeholder="Harap masukkan jumlah stok"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          {(createNewCommodity ? newCommodity.unit : selectedCommodity?.unit) || 'Unit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Ketersediaan
                    </label>
                    <select
                      value={productForm.availability_status}
                      onChange={(e) => setProductForm({ ...productForm, availability_status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="available">Tersedia</option>
                      <option value="limited">Terbatas</option>
                      <option value="out_of_stock">Habis</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      value={productForm.notes}
                      onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Catatan tambahan tentang produk..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Expirable Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="is_expirable"
                          checked={productForm.is_expirable}
                          onChange={(e) => setProductForm({ 
                            ...productForm, 
                            is_expirable: e.target.checked,
                            expired_from: e.target.checked ? productForm.expired_from : '',
                            expired_until: e.target.checked ? productForm.expired_until : ''
                          })}
                          className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <label htmlFor="is_expirable" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Produk dapat kadaluarsa
                          </label>
                          <p className="text-sm text-gray-500 mt-1">
                            Aktifkan jika produk memiliki masa kadaluarsa
                          </p>
                        </div>
                      </div>

                      {productForm.is_expirable && (
                        <div className="ml-7 space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                              ⚠️ <strong>Perhatian:</strong> Sistem akan otomatis memindahkan stok ke "Stok Keluar" setelah melewati tanggal akhir kadaluarsa.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Mulai Kadaluarsa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={productForm.expired_from}
                                onChange={(e) => setProductForm({ ...productForm, expired_from: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required={productForm.is_expirable}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Akhir Kadaluarsa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={productForm.expired_until}
                                onChange={(e) => setProductForm({ ...productForm, expired_until: e.target.value })}
                                min={productForm.expired_from}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required={productForm.is_expirable}
                              />
                            </div>
                          </div>

                          {productForm.expired_from && productForm.expired_until && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                📅 Rentang kadaluarsa: {new Date(productForm.expired_from).toLocaleDateString('id-ID')} - {new Date(productForm.expired_until).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setStep('commodity')}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Produk'}
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
