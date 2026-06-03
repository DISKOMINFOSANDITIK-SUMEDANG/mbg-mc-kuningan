'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconPackage, IconCheck, IconX, IconFilter } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

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
  suppliers?: {
    id: string;
    name: string;
  };
  commodities?: {
    id: string;
    name: string;
    unit: string;
    commodity_categories?: {
      id: string;
      name: string;
    };
  };
}

interface Supplier {
  id: string;
  name: string;
}

interface Commodity {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  commodity_categories?: {
    id: string;
    name: string;
  };
}

interface ProductForm {
  supplier_id: string;
  commodity_id: string;
  price_per_unit: number;
  stock: number;
  availability_status: string;
  notes: string;
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    supplier_id: '',
    commodity_id: '',
    price_per_unit: 0,
    stock: 0,
    availability_status: 'available',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user info first
      const userResponse = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserRole(userData.role);
        
        // If pemasok, get their supplier ID
        if (userData.role === 'pemasok') {
          const suppliersResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers`), {
            credentials: 'include',
          });
          
          if (suppliersResponse.ok) {
            const suppliersData = await suppliersResponse.json();
            const suppliersArray = Array.isArray(suppliersData) ? suppliersData : (suppliersData.data || []);
            if (suppliersArray.length > 0) {
              setCurrentSupplierId(suppliersArray[0].id);
            }
          }
        }
      }
      
      // Load products
      const productsResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      
      if (!productsResponse.ok) {
        if (productsResponse.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini');
        } else {
          setError('Gagal memuat data produk');
        }
        return;
      }
      
      const productsData = await productsResponse.json();
      setProducts(Array.isArray(productsData) ? productsData : (productsData.data || []));

      // Load suppliers (only for admin)
      if (userRole === 'administrator') {
        const suppliersResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers?limit=1000`), {
          credentials: 'include',
        });
        
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          setSuppliers(Array.isArray(suppliersData) ? suppliersData : (suppliersData.data || []));
        }
      }

      // Load commodities
      const commoditiesResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities`), {
        credentials: 'include',
      });
      
      if (commoditiesResponse.ok) {
        const commoditiesData = await commoditiesResponse.json();
        setCommodities(Array.isArray(commoditiesData) ? commoditiesData : (commoditiesData.data || []));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.commodities?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.commodities?.commodity_categories?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = !supplierFilter || product.supplier_id === supplierFilter;
    const matchesAvailability = !availabilityFilter || 
      (availabilityFilter === 'available' ? product.availability_status === 'available' : product.availability_status !== 'available');
    return matchesSearch && matchesSupplier && matchesAvailability;
  });

  const handleCreate = () => {
    setEditingProduct(null);
    setForm({
      supplier_id: userRole === 'pemasok' && currentSupplierId ? currentSupplierId : '',
      commodity_id: '',
      price_per_unit: 0,
      stock: 0,
      availability_status: 'available',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (product: SupplierProduct) => {
    setEditingProduct(product);
    setForm({
      supplier_id: product.supplier_id,
      commodity_id: product.commodity_id,
      price_per_unit: product.price_per_unit,
      stock: product.stock || 0,
      availability_status: product.availability_status || 'available',
      notes: product.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingProduct 
        ? buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products/${editingProduct.id}`)
        : buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`);
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan produk');
        return;
      }

      await loadData();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

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
        await loadData();
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
        await loadData();
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

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Produk Pemasok</h1>
                {userRole === 'pemasok' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Mode Pemasok
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {userRole === 'pemasok' ? 'Kelola produk komoditas Anda' : 'Kelola produk komoditas dari semua pemasok'}
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconPlus className="h-5 w-5" />
              Tambah Produk
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className={`grid grid-cols-1 ${userRole === 'administrator' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={userRole === 'pemasok' ? 'Cari produk atau kategori...' : 'Cari produk, pemasok, atau kategori...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {userRole === 'administrator' && (
                <div className="relative">
                  <IconFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Semua Pemasok</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="available">Tersedia</option>
                  <option value="unavailable">Tidak Tersedia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <IconPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Belum ada produk</h3>
                <p className="text-gray-600">Mulai dengan menambahkan produk komoditas dari pemasok.</p>
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
                        Komoditas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga
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
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.suppliers?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.commodities?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.commodities?.commodity_categories?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(product.price_per_unit)} / {product.commodities?.unit || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {product.stock} {product.commodities?.unit || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.availability_status === 'available'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.availability_status === 'available' ? 'Tersedia' : 'Tidak Tersedia'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit"
                            >
                              <IconEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleToggleAvailability(product)}
                              className={`p-1 rounded ${
                                product.availability_status === 'available'
                                  ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={product.availability_status === 'available' ? 'Tandai Tidak Tersedia' : 'Tandai Tersedia'}
                            >
                              {product.availability_status === 'available' ? <IconX className="h-5 w-5" /> : <IconCheck className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
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
          </div>

          {/* Product Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsFormOpen(false)} />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <form onSubmit={handleSubmit}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Supplier Select - Only for admin */}
                        {userRole === 'administrator' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pemasok <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={form.supplier_id}
                              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                              disabled={!!editingProduct}
                            >
                              <option value="">Pilih pemasok...</option>
                              {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {userRole === 'pemasok' && (
                          <input type="hidden" name="supplier_id" value={form.supplier_id} />
                        )}

                        {/* Commodity Select */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Komoditas <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={form.commodity_id}
                            onChange={(e) => setForm({ ...form, commodity_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={!!editingProduct}
                          >
                            <option value="">Pilih komoditas...</option>
                            {commodities.map((commodity) => (
                              <option key={commodity.id} value={commodity.id}>
                                {commodity.name} ({commodity.commodity_categories?.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga per Unit <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={form.price_per_unit}
                            onChange={(e) => setForm({ ...form, price_per_unit: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="100"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contoh: 15000"
                            required
                          />
                        </div>

                        {/* Stock */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stok
                          </label>
                          <input
                            type="number"
                            value={form.stock}
                            onChange={(e) => setForm({ ...form, stock: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contoh: 100"
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan
                          </label>
                          <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Catatan tambahan..."
                          />
                        </div>

                        {/* Availability */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status Ketersediaan
                          </label>
                          <select
                            value={form.availability_status}
                            onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="available">Tersedia</option>
                            <option value="limited">Terbatas</option>
                            <option value="out_of_stock">Habis</option>
                            <option value="discontinued">Discontinued</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
                      >
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
