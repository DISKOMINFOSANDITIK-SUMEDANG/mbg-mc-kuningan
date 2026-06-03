'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconEdit, IconTrash, IconChefHat, IconClipboardList } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import FileDisplay from '@/components/cms/shared/FileDisplay';
import MenuForm from '@/components/cms/menus/MenuForm';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
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
  sppg?: {
    name: string;
    type: string;
    location: string;
  };
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

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadMenu(params.id as string);
    }
  }, [params.id]);

  const loadMenu = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENUS}/${id}`), {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }
      const data = await response.json();
      setMenu(data);
    } catch (error: any) {
      console.error('Error loading menu:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENUS}/${menu?.id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu');
      }

      router.push('/cms/menus');
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      alert('Gagal menghapus menu: ' + error.message);
    }
  };

  const handleFormSuccess = () => {
    loadMenu(menu?.id || '');
    setIsEditing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'school_specific':
        return 'bg-green-100 text-green-800';
      case 'group_specific':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'general':
        return 'Umum';
      case 'school_specific':
        return 'Khusus Sekolah';
      case 'group_specific':
        return 'Khusus Kelompok';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data..." />
      </CMSLayout>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Menu tidak ditemukan</p>
      </div>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <IconArrowLeft className="h-5 w-5" />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detail Menu</h1>
                <p className="text-gray-600">Informasi lengkap menu makanan</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconEdit className="h-4 w-4" />
                Edit Menu
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <IconTrash className="h-4 w-4" />
                Hapus
              </button>
            </div>
          </div>

          {/* Menu Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Menu Image & Basic Info */}
              <div className="space-y-6">
                {/* Menu Image */}
                {menu.image_url && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Foto Menu</h3>
                    <FileDisplay
                      url={menu.image_url}
                      type="image"
                      className="w-full h-64"
                      showDownload={true}
                      showExternal={true}
                    />
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi Dasar</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <IconClipboardList className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Nama Menu</p>
                          <p className="text-sm text-gray-600 font-semibold">{menu.name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <IconChefHat className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">SPPG</p>
                          <p className="text-sm text-gray-600">{menu.sppg?.name || menu.sppg_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{menu.sppg?.type || menu.sppg_type || ''} • {menu.sppg?.location || ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <IconClipboardList className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tipe Menu</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(menu.menu_type)}`}>
                            {getTypeLabel(menu.menu_type)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600">K</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Kalori</p>
                          <p className="text-sm text-gray-600">{menu.total_calories} kkal</p>
                        </div>
                      </div>

                      {menu.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Catatan</p>
                          <p className="text-sm text-gray-600">{menu.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Menu Items */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Item Menu ({menu.menu_items?.length || 0})
                  </h3>
                  
                  {menu.menu_items && menu.menu_items.length > 0 ? (
                    <div className="space-y-3">
                      {menu.menu_items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/64x64/cccccc/666666?text=Item';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  {item.calories} kkal
                                </span>
                                <span>Protein: {item.protein}g</span>
                                <span>Karbohidrat: {item.carbs}g</span>
                                <span>Lemak: {item.fat}g</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <IconClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Belum ada item menu</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Dibuat: {new Date(menu.created_at).toLocaleString('id-ID')}</span>
              <span>Diperbarui: {new Date(menu.updated_at).toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Edit Form Modal */}
          <MenuForm
            menu={menu}
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            onSuccess={handleFormSuccess}
          />
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
