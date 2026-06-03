'use client';

import { IconEdit, IconTrash, IconEye, IconCalendar, IconChefHat, IconUsers } from '@tabler/icons-react';

interface Menu {
  id: string;
  date: string;
  sppgId: string;
  sppg?: {
    id: string;
    name: string;
    type: string;
  };
  totalCalories: number;
  notes?: string;
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    nutritionInfo: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    image?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface MenuTableProps {
  menus: Menu[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onEdit: (menu: Menu) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export default function MenuTable({
  menus,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange
}: MenuTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Memuat data menu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center py-12">
            <IconChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada data menu
            </h3>
            <p className="text-gray-600">
              Belum ada menu yang terdaftar atau tidak ada data yang sesuai dengan filter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Menu ({pagination.total})
          </h2>
          <div className="text-sm text-gray-500">
            Halaman {pagination.page} dari {pagination.totalPages}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SPPG
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Menu Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kalori Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catatan
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {menus.map((menu) => (
              <tr key={menu.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <IconCalendar className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(menu.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Dibuat: {formatTime(menu.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {menu.sppg ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {menu.sppg.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {menu.sppg.type}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Tidak ada SPPG</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <IconChefHat className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {menu.menuItems.length} item
                    </span>
                  </div>
                  {menu.menuItems.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {menu.menuItems.slice(0, 2).map(item => item.name).join(', ')}
                      {menu.menuItems.length > 2 && ` +${menu.menuItems.length - 2} lainnya`}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <IconUsers className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {menu.totalCalories.toLocaleString()} kcal
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {menu.notes ? (
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {menu.notes}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Tidak ada catatan</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => window.open(`/menus/${menu.id}`, '_blank')}
                      className="text-gray-400 hover:text-gray-600"
                      title="Lihat Detail"
                    >
                      <IconEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(menu)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Edit"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(menu.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Hapus"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} sampai{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
              {pagination.total} data
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      pagination.page === pageNum
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
