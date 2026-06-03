'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconApple, IconFilter } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface Commodity {
  id: string;
  name: string;
  description: string;
  category_id: string;
  unit: string;
  photo_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  commodity_categories?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface CommodityForm {
  name: string;
  description: string;
  category_id: string;
  unit: string;
  photo_url: string;
}

export default function CommoditiesPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);
  const [form, setForm] = useState<CommodityForm>({
    name: '',
    description: '',
    category_id: '',
    unit: 'kg',
    photo_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load commodities
      const commoditiesResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities`), {
        credentials: 'include',
      });
      
      if (!commoditiesResponse.ok) {
        if (commoditiesResponse.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini');
        } else {
          setError('Gagal memuat data komoditas');
        }
        return;
      }
      
      const commoditiesData = await commoditiesResponse.json();
      setCommodities(Array.isArray(commoditiesData) ? commoditiesData : (commoditiesData.data || []));

      // Load categories
      const categoriesResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodity-categories`), {
        credentials: 'include',
      });
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || []));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCommodities = commodities.filter(commodity => {
    const matchesSearch = 
      commodity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (commodity.description && commodity.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !categoryFilter || commodity.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    setEditingCommodity(null);
    setForm({
      name: '',
      description: '',
      category_id: '',
      unit: 'Kg',
      photo_url: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (commodity: Commodity) => {
    setEditingCommodity(commodity);
    setForm({
      name: commodity.name,
      description: commodity.description || '',
      category_id: commodity.category_id || '',
      unit: commodity.unit,
      photo_url: commodity.photo_url || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingCommodity 
        ? buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities/${editingCommodity.id}`)
        : buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities`);
      
      const response = await fetch(url, {
        method: editingCommodity ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan komoditas');
        return;
      }

      await loadData();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving commodity:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commodityId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komoditas ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/commodities/${commodityId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus komoditas');
      }
    } catch (error) {
      console.error('Error deleting commodity:', error);
      alert('Gagal menghapus komoditas');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Komoditas</h1>
              <p className="text-gray-600">Kelola data master komoditas bahan baku</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconPlus className="h-5 w-5" />
              Tambah Komoditas
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari komoditas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <IconFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Commodities Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            ) : filteredCommodities.length === 0 ? (
              <div className="p-8 text-center">
                <IconApple className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Belum ada komoditas</h3>
                <p className="text-gray-600">Mulai dengan menambahkan komoditas baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Komoditas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satuan Default
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCommodities.map((commodity) => (
                      <tr key={commodity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {commodity.photo_url ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={commodity.photo_url}
                                  alt={commodity.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                  <IconApple className="h-5 w-5 text-green-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{commodity.name}</div>
                              {commodity.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{commodity.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {commodity.commodity_categories?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{commodity.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(commodity.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(commodity)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit"
                            >
                              <IconEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(commodity.id)}
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

          {/* Commodity Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsFormOpen(false)} />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <form onSubmit={handleSubmit}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingCommodity ? 'Edit Komoditas' : 'Tambah Komoditas'}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Komoditas <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contoh: Beras, Ayam Potong, Wortel"
                            required
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={form.category_id}
                            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Pilih kategori...</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Satuan <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contoh: Kg, Liter, Butir"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                          </label>
                          <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Deskripsi singkat tentang komoditas..."
                          />
                        </div>

                        {/* Photo URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Foto
                          </label>
                          <input
                            type="url"
                            value={form.photo_url}
                            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://example.com/foto.jpg"
                          />
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
