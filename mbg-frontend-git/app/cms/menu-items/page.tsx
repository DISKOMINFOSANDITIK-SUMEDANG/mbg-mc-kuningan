'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconFileText, IconFlame, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import MenuItemForm from '@/components/cms/menu-items/MenuItemForm';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url?: string;
  sppg_id?: string;
  sppg_name?: string;
  sppg_type?: string;
  sppg_location?: string;
  created_at: string;
  updated_at: string;
}

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  const loadMenuItems = async (page = currentPage, search = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search) params.set('q', search);

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENU_ITEMS}?${params.toString()}`), {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const result = await response.json();
      const data = result.data ?? [];
      setMenuItems(data);
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages || 1);
        setTotalItems(result.pagination.total || 0);
        setCurrentPage(result.pagination.page || 1);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems(1, searchQuery);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadMenuItems(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = () => {
    setSelectedMenuItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const item = menuItems.find(i => i.id === id);
    setSelectedMenuItem(item || null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item menu ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENU_ITEMS}/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu item');
      }

      await loadMenuItems(currentPage, searchQuery);
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      alert('Gagal menghapus item menu: ' + error.message);
    }
  };

  const handleFormSuccess = () => {
    loadMenuItems(currentPage, searchQuery);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedMenuItem(null);
  };

  if (loading && menuItems.length === 0) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data item menu..." />
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <IconFileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Item Menu</h1>
                <p className="text-sm text-gray-500">
                  {totalItems > 0 ? `${totalItems} item terdaftar` : 'Kelola komponen item makanan'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
            >
              <IconPlus className="h-4 w-4" />
              Tambah Item Menu
            </button>
          </div>

          {/* ── Toolbar ── */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama item atau SPPG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400 shadow-sm"
            />
          </div>

          {/* ── Table ── */}
          {menuItems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconFileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {searchQuery ? 'Tidak ada hasil ditemukan' : 'Belum ada item menu'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchQuery ? `Tidak ada item yang cocok dengan "${searchQuery}"` : 'Mulai dengan menambahkan item menu pertama'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <IconPlus className="h-4 w-4" />
                  Tambah Item Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Foto</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Item</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SPPG</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Kalori</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nutrisi (P / K / L)</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dibuat</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {menuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors group">
                        <td className="px-5 py-3.5">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-11 w-11 rounded-xl object-cover"
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/44x44/f3f4f6/9ca3af?text=I'; }}
                            />
                          ) : (
                            <div className="h-11 w-11 bg-gray-100 rounded-xl flex items-center justify-center">
                              <IconFileText className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                        </td>
                        <td className="px-5 py-3.5 max-w-[180px]">
                          <p className="text-sm font-medium text-gray-700 line-clamp-1">{item.sppg_name || '—'}</p>
                          {(item.sppg_type || item.sppg_location) && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {[item.sppg_type, item.sppg_location].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 text-sm font-semibold text-orange-600">
                            <IconFlame className="h-3.5 w-3.5" />
                            {item.calories}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">kkal</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md">P {item.protein}g</span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded-md">K {item.carbs}g</span>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded-md">L {item.fat}g</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                              <IconEdit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500">
                    Menampilkan <span className="font-semibold text-gray-700">{menuItems.length}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span> item
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setCurrentPage(p => p - 1); loadMenuItems(currentPage - 1, searchQuery); }}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) page = i + 1;
                      else if (currentPage <= 3) page = i + 1;
                      else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                      else page = currentPage - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => { setCurrentPage(page); loadMenuItems(page, searchQuery); }}
                          className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { setCurrentPage(p => p + 1); loadMenuItems(currentPage + 1, searchQuery); }}
                      disabled={currentPage >= totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu Item Form Modal */}
          <MenuItemForm
            menuItem={selectedMenuItem}
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}