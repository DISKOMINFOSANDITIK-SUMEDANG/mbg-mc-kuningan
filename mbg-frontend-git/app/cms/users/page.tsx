'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconUser, IconShield, IconChefHat, IconBuilding, IconTruck, IconShoppingCart, IconKey, IconX, IconLeaf } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import UserForm from '@/components/cms/users/UserForm';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';

interface User {
  id: string;
  email: string;
  role: 'administrator' | 'sekolah' | 'sppg' | 'pemasok' | 'offtaker' | 'dinas_pertanian';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  status: string;
  role_display: string;
  // Profile data
  full_name: string;
  phone: string;
  avatar_url: string;
  // School data (for sekolah role)
  school_id: string;
  school_name: string;
  school_level: string;
  school_district: string;
  position: string;
  // SPPG data (for sppg role)
  sppg_id: string;
  sppg_name: string;
  sppg_type: string;
  sppg_location: string;
  // Supplier data (for pemasok role)
  supplier_id: string;
  supplier_name: string;
  supplier_address: string;
  supplier_district: string;
  // Offtaker data (for offtaker role)
  offtaker_id: string;
  offtaker_name: string;
  offtaker_address: string;
  offtaker_district: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageLimit] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sppgUnlinked, setSppgUnlinked] = useState(false);
  const [clientPage, setClientPage] = useState(1);
  const CLIENT_PAGE_SIZE = 20;
  const [resetPasswordData, setResetPasswordData] = useState<{
    user: User;
    tempPassword: string;
  } | null>(null);

  const loadUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: sppgUnlinked ? '500' : pageLimit.toString(),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter === 'active' ? 'true' : 'false' }),
        ...(searchQuery && { q: searchQuery }),
        ...(sppgUnlinked && { sppg_unlinked: 'true' })
      });
      
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_USERS}?${params}`), {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch users:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 401) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.');
        } else if (response.status === 403) {
          setError('Anda tidak memiliki izin untuk mengakses halaman ini.');
        } else {
          setError(errorData.error || errorData.details || `Gagal memuat data: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      // Handle both old format (array) and new format (object with data and pagination)
      const usersData = Array.isArray(data) ? data : (data.data || data.users || []);
      setUsers(usersData);
      
      // Update pagination info
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Terjadi kesalahan saat memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  useEffect(() => {
    // Debounce ALL filter changes (search, role, status) and reload from server
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadUsers(1);
    }, searchQuery ? 300 : 0); // 300ms debounce for search, instant for filters

    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter, sppgUnlinked]);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (userId: string) => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_USERS}/${userId}`), {
        credentials: 'include',
      });
      if (response.ok) {
        const user = await response.json();
        setSelectedUser(user);
        setIsFormOpen(true);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleDelete = async (userId: string, isActive: boolean) => {
    if (isActive) {
      if (!confirm('Apakah Anda yakin ingin menonaktifkan pengguna ini?')) return;

      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_USERS}/${userId}`), {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          await loadUsers();
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to deactivate user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to deactivate user');
      }
    } else {
      if (!confirm('Pengguna ini sudah nonaktif. Apakah Anda yakin ingin MENGHAPUS PERMANEN akun ini? Tindakan ini tidak dapat dibatalkan.')) return;

      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_USERS}/${userId}/permanent`), {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          await loadUsers();
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to permanently delete user');
        }
      } catch (error) {
        console.error('Error permanently deleting user:', error);
        alert('Failed to permanently delete user');
      }
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin mereset password pengguna ini? Password baru akan dibuat secara otomatis.')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_USERS}/${userId}/reset-password`), {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const user = users.find(u => u.id === userId);
        if (user) {
          setResetPasswordData({
            user: user,
            tempPassword: data.tempPassword || data.temp_password
          });
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleResetPasswordClose = () => {
    setResetPasswordData(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator':
        return <IconShield className="h-4 w-4" />;
      case 'sekolah':
        return <IconBuilding className="h-4 w-4" />;
      case 'sppg':
        return <IconChefHat className="h-4 w-4" />;
      case 'pemasok':
        return <IconTruck className="h-4 w-4" />;
      case 'offtaker':
        return <IconShoppingCart className="h-4 w-4" />;
      case 'dinas_pertanian':
        return <IconLeaf className="h-4 w-4" />;
      default:
        return <IconUser className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    );
  };

  // Client-side filter for sppgUnlinked (fallback for when backend hasn't deployed yet)
  const filteredUsers = sppgUnlinked
    ? users.filter(u =>
        (u.role === 'sppg' || (u.full_name || '').toLowerCase().includes('sppg')) &&
        !u.sppg_id
      )
    : users;

  const clientTotalPages = Math.ceil(filteredUsers.length / CLIENT_PAGE_SIZE);
  const displayedUsers = sppgUnlinked
    ? filteredUsers.slice((clientPage - 1) * CLIENT_PAGE_SIZE, clientPage * CLIENT_PAGE_SIZE)
    : filteredUsers;

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
              <p className="text-gray-600">Kelola akun pengguna sistem</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconPlus className="h-5 w-5" />
              Tambah Pengguna
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => loadUsers(currentPage)}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau posisi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {searchQuery.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 ml-1">
                    {searchQuery.length < 2 ? (
                      <span>Ketik minimal 2 karakter untuk mencari</span>
                    ) : !loading ? (
                      <span className="text-blue-600 font-medium">
                        {totalUsers} hasil ditemukan
                      </span>
                    ) : (
                      <span className="text-gray-400">Mencari...</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <SearchableSelect
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value)}
                  options={[
                    { value: "", label: "Semua Role" },
                    { value: "administrator", label: "Administrator" },
                    { value: "sekolah", label: "Sekolah" },
                    { value: "sppg", label: "SPPG" },
                    { value: "pemasok", label: "Pemasok" },
                    { value: "offtaker", label: "Offtaker" },
                    { value: "dinas_pertanian", label: "Dinas Pertanian" }
                  ]}
                  placeholder="Pilih role..."
                  searchPlaceholder="Cari role..."
                />
              </div>
              <div>
                <SearchableSelect
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={[
                    { value: "", label: "Semua Status" },
                    { value: "active", label: "Aktif" },
                    { value: "inactive", label: "Nonaktif" }
                  ]}
                  placeholder="Pilih status..."
                  searchPlaceholder="Cari status..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSppgUnlinked(prev => !prev);
                    setRoleFilter('');
                    setClientPage(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    sppgUnlinked
                      ? 'bg-orange-100 border-orange-400 text-orange-700 font-medium'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Tampilkan akun SPPG yang belum terhubung ke data SPPG"
                >
                  <IconFilter className="h-4 w-4" />
                  SPPG Belum Terhubung
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Memuat data...</p>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Posisi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instansi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Login Terakhir
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                {getRoleIcon(user.role)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          {getRoleIcon(user.role)}
                          <div className="ml-2">
                            <div className="font-medium">{user.role_display}</div>
                            {user.position && (
                              <div className="text-xs text-gray-500">{user.position}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.role === 'sekolah' && user.school_name ? (
                            <div>
                              <div className="font-medium text-blue-600">{user.school_name}</div>
                              <div className="text-xs text-gray-500">{user.school_level} • {user.school_district}</div>
                            </div>
                          ) : user.role === 'sppg' && user.sppg_name ? (
                            <div>
                              <div className="font-medium text-green-600">{user.sppg_name}</div>
                              <div className="text-xs text-gray-500">{user.sppg_type}</div>
                            </div>
                          ) : user.role === 'pemasok' && user.supplier_name ? (
                            <div>
                              <div className="font-medium text-orange-600">{user.supplier_name}</div>
                              <div className="text-xs text-gray-500">{user.supplier_district}</div>
                            </div>
                          ) : user.role === 'offtaker' && user.offtaker_name ? (
                            <div>
                              <div className="font-medium text-purple-600">{user.offtaker_name}</div>
                              <div className="text-xs text-gray-500">{user.offtaker_district}</div>
                            </div>
                          ) : user.role === 'administrator' ? (
                            <span className="text-gray-600">Administrator</span>
                          ) : user.role === 'dinas_pertanian' ? (
                            <span className="text-gray-600">Dinas Pertanian Sumedang</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Belum pernah login'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                            title="Reset Password"
                          >
                            <IconKey className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.is_active)}
                            className={user.is_active ? 'text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50' : 'text-red-800 hover:text-red-950 p-1 rounded hover:bg-red-100'}
                            title={user.is_active ? 'Nonaktifkan' : 'Hapus Permanen'}
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {displayedUsers.length === 0 && !loading && (
              <div className="text-center py-12">
                <IconUser className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || roleFilter || statusFilter || sppgUnlinked ? 'Tidak ada pengguna yang ditemukan' : 'Belum ada pengguna'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || roleFilter || statusFilter || sppgUnlinked
                    ? 'Coba ubah filter pencarian Anda' 
                    : 'Mulai dengan menambahkan pengguna pertama'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {sppgUnlinked ? (
            clientTotalPages > 1 && (
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">{Math.min(clientPage * CLIENT_PAGE_SIZE, filteredUsers.length)}</span>{' '}
                    dari <span className="font-medium">{filteredUsers.length}</span> pengguna
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setClientPage(p => Math.max(1, p - 1))}
                      disabled={clientPage === 1 || loading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(clientTotalPages, 5))].map((_, i) => {
                        let pageNum;
                        if (clientTotalPages <= 5) pageNum = i + 1;
                        else if (clientPage <= 3) pageNum = i + 1;
                        else if (clientPage >= clientTotalPages - 2) pageNum = clientTotalPages - 4 + i;
                        else pageNum = clientPage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setClientPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded-lg ${
                              clientPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setClientPage(p => Math.min(clientTotalPages, p + 1))}
                      disabled={clientPage === clientTotalPages || loading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">{users.length}</span> dari{' '}
                  <span className="font-medium">{totalUsers}</span> pengguna
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadUsers(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => loadUsers(pageNum)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => loadUsers(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
            )
          )}

          {/* User Form Modal */}
          {isFormOpen && (
            <UserForm
              user={selectedUser}
              isOpen={isFormOpen}
              onClose={handleFormClose}
              onSuccess={loadUsers}
            />
          )}

          {/* Reset Password Modal */}
          {resetPasswordData && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-600/75" onClick={handleResetPasswordClose} />
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Password Berhasil Direset
                    </h3>
                    <button 
                      onClick={handleResetPasswordClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <IconX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                      <strong className="font-bold">Berhasil!</strong>
                      <span className="block sm:inline"> Password pengguna berhasil direset.</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pengguna
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {resetPasswordData.user.full_name} ({resetPasswordData.user.email})
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password Baru
                        </label>
                        <div className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border">
                          {resetPasswordData.tempPassword}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Berikan password ini kepada pengguna untuk login.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleResetPasswordClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}