'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconEye, IconClipboardList, IconFlame, IconChefHat, IconLayoutGrid, IconLayoutList, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import MenuForm from '@/components/cms/menus/MenuForm';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface Menu {
  id: string;
  name: string;
  sppg_id: string;
  total_calories: number;
  notes?: string;
  menu_type: string;
  target_recipients?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
  sppg_name?: string;
  sppg_type?: string;
  menu_items?: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url?: string;
}

export default function MenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const pageSize = 20;

  const loadMenus = async (page = currentPage, search = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search) params.set('q', search);

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENUS}?${params.toString()}`), {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }
      const result = await response.json();
      const data = result.data ?? [];
      setMenus(data);
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages || 1);
        setTotalItems(result.pagination.total || 0);
        setCurrentPage(result.pagination.page || 1);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus(1, searchQuery);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadMenus(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = () => {
    setSelectedMenu(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const menu = menus.find(m => m.id === id);
    setSelectedMenu(menu || null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENUS}/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu');
      }

      await loadMenus(currentPage, searchQuery);
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      alert('Gagal menghapus menu: ' + error.message);
    }
  };

  const handleView = (id: string) => {
    router.push(`/cms/menus/${id}`);
  };

  const handleFormSuccess = () => {
    loadMenus(currentPage, searchQuery);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedMenu(null);
  };

  const getTypeColor = (_type: string) => 'bg-emerald-100 text-emerald-800';

  if (loading && menus.length === 0) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data menu..." />
      </CMSLayout>
    );
  }

  const getType = (_t: string) => ({ label: 'Menu Sekolah', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' });

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <IconChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menu Makanan</h1>
                <p className="text-sm text-gray-500">
                  {totalItems > 0 ? `${totalItems} menu terdaftar` : 'Kelola semua menu makanan'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <IconPlus className="h-4 w-4" />
              Tambah Menu
            </button>
          </div>

          {/* ── Stats Bar ── */}
          {totalItems > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-blue-700">Total Menu</p>
                <p className="text-2xl font-bold mt-0.5 text-blue-900">{totalItems}</p>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama menu atau SPPG..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Tampilan tabel"
                >
                  <IconLayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Tampilan grid"
                >
                  <IconLayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {menus.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconClipboardList className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {searchQuery ? 'Tidak ada hasil ditemukan' : 'Belum ada menu'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchQuery ? `Tidak ada menu yang cocok dengan "${searchQuery}"` : 'Mulai dengan menambahkan menu pertama Anda'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <IconPlus className="h-4 w-4" />
                  Tambah Menu Pertama
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid View ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menus.map((menu) => {
                const type = getType(menu.menu_type);
                return (
                  <div key={menu.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    {/* Image */}
                    <div className="relative h-36 bg-gray-100 overflow-hidden">
                      {menu.image_url ? (
                        <img
                          src={menu.image_url}
                          alt={menu.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Menu'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <IconChefHat className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${type.color} text-xs font-semibold rounded-full`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${type.dot}`} />
                          {type.label}
                        </span>
                      </div>
                    </div>
                    {/* Body */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 mb-1">{menu.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-3">{menu.sppg_name || '—'}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                          <IconFlame className="h-3.5 w-3.5" />
                          {menu.total_calories ?? '—'} kkal
                        </div>
                        <span className="text-xs text-gray-400">{menu.menu_items?.length ?? 0} item</span>
                      </div>
                      <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
                        <button onClick={() => handleView(menu.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                          <IconEye className="h-3.5 w-3.5" /> Detail
                        </button>
                        <button onClick={() => handleEdit(menu.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <IconEdit className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(menu.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <IconTrash className="h-3.5 w-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Table View ── */
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Foto</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Menu</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SPPG</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Kalori</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dibuat</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {menus.map((menu) => {
                      const type = getType(menu.menu_type);
                      return (
                        <tr key={menu.id} className="hover:bg-gray-50/70 transition-colors group">
                          <td className="px-5 py-3.5">
                            {menu.image_url ? (
                              <img
                                src={menu.image_url}
                                alt={menu.name}
                                className="h-11 w-11 rounded-xl object-cover"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/44x44/f3f4f6/9ca3af?text=M'; }}
                              />
                            ) : (
                              <div className="h-11 w-11 bg-gray-100 rounded-xl flex items-center justify-center">
                                <IconChefHat className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-semibold text-gray-900">{menu.name || '—'}</p>
                            {menu.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{menu.notes}</p>}
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px]">
                            <p className="text-sm text-gray-700 font-medium line-clamp-1">{menu.sppg_name || '—'}</p>
                            {menu.sppg_type && <p className="text-xs text-gray-400 mt-0.5">{menu.sppg_type}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                              <IconFlame className="h-3.5 w-3.5" />
                              {menu.total_calories ?? '—'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-full">
                              {menu.menu_items?.length ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-400">
                            {new Date(menu.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleView(menu.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                                <IconEye className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleEdit(menu.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                                <IconEdit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(menu.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                <IconTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500">
                    Menampilkan <span className="font-semibold text-gray-700">{menus.length}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span> menu
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setCurrentPage(p => p - 1); loadMenus(currentPage - 1, searchQuery); }}
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
                          onClick={() => { setCurrentPage(page); loadMenus(page, searchQuery); }}
                          className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { setCurrentPage(p => p + 1); loadMenus(currentPage + 1, searchQuery); }}
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

          {/* Menu Form Modal */}
          <MenuForm
            menu={selectedMenu}
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}