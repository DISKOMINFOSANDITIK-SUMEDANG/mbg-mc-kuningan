'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconLeaf, IconEdit, IconCheck, IconX, IconTruck } from '@tabler/icons-react';
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

interface SupplierProduct {
  id: string;
  supplier_id: string;
  commodity_id: string;
  price_per_unit: number;
  stock: number;
  availability_status: string;
  notes: string;
  commodities?: {
    id: string;
    name: string;
    unit: string;
    category_id?: string;
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

interface Supplier {
  id: string;
  name: string;
  logo_url?: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<SupplierProduct | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // Commodity editing
  const [editingCommodity, setEditingCommodity] = useState(false);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState(false);
  const [editingUnit, setEditingUnit] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [createNewCommodity, setCreateNewCommodity] = useState(false);
  const [newCommodity, setNewCommodity] = useState({
    name: '',
    category_id: '',
    unit: '',
    description: ''
  });
  
  const [form, setForm] = useState({
    supplier_id: '',
    commodity_id: '',
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
    loadProduct();
    loadCommoditiesAndCategories();
    loadSuppliers();
  }, [productId]);

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

  const loadCommoditiesAndCategories = async () => {
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
      console.error('Error loading commodities and categories:', error);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products/${productId}`), {
        credentials: 'include',
      });

      if (!response.ok) {
        setError('Gagal memuat data produk');
        return;
      }

      const data = await response.json();
      setProduct(data);
      setSelectedCommodityId(data.commodity_id);
      setSelectedSupplierId(data.supplier_id);
      setSelectedUnit(data.commodities?.unit || '');
      setSelectedCategoryId(data.commodities?.category_id || '');
      setForm({
        supplier_id: data.supplier_id,
        commodity_id: data.commodity_id,
        price_per_unit: data.price_per_unit,
        stock: data.stock || 0,
        availability_status: data.availability_status,
        notes: data.notes || '',
        is_expirable: data.is_expirable || false,
        expired_from: data.expired_from || '',
        expired_until: data.expired_until || ''
      });
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommodity = async () => {
    setError(null);

    if (createNewCommodity) {
      // Create new commodity
      if (!newCommodity.name || !newCommodity.unit) {
        setError('Nama komoditas dan satuan wajib diisi');
        return;
      }

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
        setForm({ ...form, commodity_id: createdCommodity.id });
        
        // Reload commodities
        await loadCommoditiesAndCategories();
        
        setEditingCommodity(false);
        setCreateNewCommodity(false);
      } catch (error) {
        console.error('Error creating commodity:', error);
        setError('Terjadi kesalahan saat membuat komoditas');
      }
    } else {
      // Use selected commodity
      if (!selectedCommodityId) {
        setError('Pilih komoditas terlebih dahulu');
        return;
      }
      
      setForm({ ...form, commodity_id: selectedCommodityId });
      setEditingCommodity(false);
    }
  };

  const handleCancelCommodityEdit = () => {
    setEditingCommodity(false);
    setCreateNewCommodity(false);
    setSelectedCommodityId(product?.commodity_id || '');
    setNewCommodity({
      name: '',
      category_id: '',
      unit: '',
      description: ''
    });
    setError(null);
  };

  const handleSaveSupplier = () => {
    if (!selectedSupplierId) {
      setError('Pilih pemasok terlebih dahulu');
      return;
    }
    setForm({ ...form, supplier_id: selectedSupplierId });
    setEditingSupplier(false);
    setError(null);
  };

  const handleCancelSupplierEdit = () => {
    setEditingSupplier(false);
    setSelectedSupplierId(product?.supplier_id || '');
    setError(null);
  };

  const handleSaveUnit = async () => {
    if (!selectedUnit) {
      setError('Pilih satuan terlebih dahulu');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities/${product?.commodity_id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: selectedUnit })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan satuan');
        return;
      }

      // Reload product data to get updated commodity info
      await loadProduct();
      setEditingUnit(false);
    } catch (error) {
      console.error('Error saving unit:', error);
      setError('Terjadi kesalahan saat menyimpan satuan');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelUnitEdit = () => {
    setEditingUnit(false);
    setSelectedUnit(product?.commodities?.unit || '');
    setError(null);
  };

  const handleSaveCategory = async () => {
    if (!selectedCategoryId) {
      setError('Pilih kategori terlebih dahulu');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities/${product?.commodity_id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: selectedCategoryId })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan kategori');
        return;
      }

      // Reload product data to get updated commodity info
      await loadProduct();
      setEditingCategory(false);
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Terjadi kesalahan saat menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(false);
    setSelectedCategoryId(product?.commodities?.category_id || '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.price_per_unit <= 0) {
      setError('Harga harus lebih dari 0');
      return;
    }

    // Validate expirable dates
    if (form.is_expirable) {
      if (!form.expired_from || !form.expired_until) {
        setError('Tanggal kadaluarsa wajib diisi untuk produk yang dapat kadaluarsa');
        return;
      }
      if (new Date(form.expired_from) >= new Date(form.expired_until)) {
        setError('Tanggal akhir kadaluarsa harus setelah tanggal mulai');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products/${productId}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan perubahan');
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

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data produk..." />
      </CMSLayout>
    );
  }

  if (!product) {
    return (
      <CMSLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Produk tidak ditemukan</p>
          <Link href="/cms/products" className="text-green-600 hover:text-green-700 font-medium mt-4 inline-block">
            Kembali ke Daftar Produk
          </Link>
        </div>
      </CMSLayout>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
                <p className="text-gray-600 mt-1">Perbarui informasi produk Anda</p>
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
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                {/* Commodity Section */}
                {!editingCommodity ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconLeaf className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-600">Komoditas:</div>
                          <button
                            type="button"
                            onClick={() => setEditingCommodity(true)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <IconEdit className="h-4 w-4" />
                            Ubah Komoditas
                          </button>
                        </div>
                        <div className="font-semibold text-gray-900 mb-1">
                          {commodities.find(c => c.id === selectedCommodityId)?.name || product?.commodities?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Kategori: {commodities.find(c => c.id === selectedCommodityId)?.commodity_categories?.name || product?.commodities?.commodity_categories?.name} • 
                          Satuan: {commodities.find(c => c.id === selectedCommodityId)?.unit || product?.commodities?.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Edit Komoditas</h3>
                      <button
                        type="button"
                        onClick={handleCancelCommodityEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <IconX className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Toggle: Select existing or create new */}
                    <div className="mb-4">
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={!createNewCommodity}
                            onChange={() => setCreateNewCommodity(false)}
                            className="mr-2"
                          />
                          <span className="text-sm">Pilih Komoditas yang Ada</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={createNewCommodity}
                            onChange={() => setCreateNewCommodity(true)}
                            className="mr-2"
                          />
                          <span className="text-sm">Buat Komoditas Baru</span>
                        </label>
                      </div>
                    </div>

                    {!createNewCommodity ? (
                      /* Select Existing Commodity */
                      <div className="space-y-4">
                        <SearchableSelect
                          label="Pilih Komoditas"
                          options={commodities.map(commodity => ({
                            value: commodity.id,
                            label: commodity.name,
                            description: `${commodity.commodity_categories?.name || 'Tanpa Kategori'} • ${commodity.unit}`
                          }))}
                          value={selectedCommodityId}
                          onChange={setSelectedCommodityId}
                          placeholder="-- Pilih Komoditas --"
                          searchPlaceholder="Cari komoditas..."
                          emptyMessage="Tidak ada komoditas tersedia"
                          required
                        />
                      </div>
                    ) : (
                      /* Create New Commodity */
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Komoditas <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCommodity.name}
                            onChange={(e) => setNewCommodity({ ...newCommodity, name: e.target.value })}
                            placeholder="Contoh: Beras Premium"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kategori
                          </label>
                          <select
                            value={newCommodity.category_id}
                            onChange={(e) => setNewCommodity({ ...newCommodity, category_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">-- Pilih Kategori --</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
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
                            rows={2}
                            placeholder="Deskripsi komoditas..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleCancelCommodityEdit}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCommodity}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <IconCheck className="h-4 w-4" />
                        Simpan Komoditas
                      </button>
                    </div>
                  </div>
                )}

                {/* Supplier Section - Only for Admin and Dinas Pertanian */}
                {(userRole === 'administrator' || userRole === 'dinas_pertanian') && (
                  !editingSupplier ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconTruck className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-600">Pemasok:</div>
                            <button
                              type="button"
                              onClick={() => setEditingSupplier(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <IconEdit className="h-4 w-4" />
                              Ubah Pemasok
                            </button>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {suppliers.find(s => s.id === selectedSupplierId)?.name || product?.suppliers?.name || 'Belum dipilih'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Edit Pemasok</h3>
                        <button
                          type="button"
                          onClick={handleCancelSupplierEdit}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <IconX className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <SearchableSelect
                          label="Pilih Pemasok"
                          options={suppliers.map(supplier => ({
                            value: supplier.id,
                            label: supplier.name
                          }))}
                          value={selectedSupplierId}
                          onChange={setSelectedSupplierId}
                          placeholder="-- Pilih Pemasok --"
                          searchPlaceholder="Cari pemasok..."
                          emptyMessage="Tidak ada pemasok tersedia"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          type="button"
                          onClick={handleCancelSupplierEdit}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSupplier}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <IconCheck className="h-4 w-4" />
                          Simpan Pemasok
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Unit Section */}
                {!editingUnit ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconLeaf className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-600">Satuan:</div>
                          <button
                            type="button"
                            onClick={() => setEditingUnit(true)}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <IconEdit className="h-4 w-4" />
                            Ubah Satuan
                          </button>
                        </div>
                        <div className="font-semibold text-gray-900">{product.commodities?.unit}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Edit Satuan</h3>
                      <button
                        type="button"
                        onClick={handleCancelUnitEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <IconX className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <SearchableSelect
                        label="Pilih Satuan"
                        options={COMMON_UNITS}
                        value={selectedUnit}
                        onChange={setSelectedUnit}
                        placeholder="-- Pilih Satuan --"
                        searchPlaceholder="Cari satuan..."
                        emptyMessage="Tidak ada satuan tersedia"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleCancelUnitEdit}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveUnit}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        <IconCheck className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Satuan'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Section */}
                {!editingCategory ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconLeaf className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-600">Kategori:</div>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(true)}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                          >
                            <IconEdit className="h-4 w-4" />
                            Ubah Kategori
                          </button>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {product.commodities?.commodity_categories?.name || 'Tanpa Kategori'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Edit Kategori</h3>
                      <button
                        type="button"
                        onClick={handleCancelCategoryEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <IconX className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <SearchableSelect
                        label="Pilih Kategori"
                        options={categories.map(category => ({
                          value: category.id,
                          label: category.name
                        }))}
                        value={selectedCategoryId}
                        onChange={setSelectedCategoryId}
                        placeholder="-- Pilih Kategori --"
                        searchPlaceholder="Cari kategori..."
                        emptyMessage="Tidak ada kategori tersedia"
                      />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleCancelCategoryEdit}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCategory}
                        disabled={saving}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        <IconCheck className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga per {commodities.find(c => c.id === selectedCommodityId)?.unit || product?.commodities?.unit} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                      <input
                        type="text"
                        value={form.price_per_unit ? form.price_per_unit.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setForm({ ...form, price_per_unit: parseInt(value) || 0 });
                        }}
                        placeholder="15.000"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
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
                        value={form.stock || ''}
                        onChange={(e) => setForm({ ...form, stock: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.1"
                        placeholder="Harap masukkan jumlah stok"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {commodities.find(c => c.id === selectedCommodityId)?.unit || product?.commodities?.unit || 'Unit'}
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
                    value={form.availability_status}
                    onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
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
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                        checked={form.is_expirable}
                        onChange={(e) => setForm({ 
                          ...form, 
                          is_expirable: e.target.checked,
                          expired_from: e.target.checked ? form.expired_from : '',
                          expired_until: e.target.checked ? form.expired_until : ''
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

                    {form.is_expirable && (
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
                              min={form.expired_from}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              required={form.is_expirable}
                            />
                          </div>
                        </div>

                        {form.expired_from && form.expired_until && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              📅 Rentang kadaluarsa: {new Date(form.expired_from).toLocaleDateString('id-ID')} - {new Date(form.expired_until).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <Link
                    href="/cms/products"
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
