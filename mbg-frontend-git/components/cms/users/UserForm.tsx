'use client';

import { useState, useEffect } from 'react';
import { IconX, IconKey } from '@tabler/icons-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';
import AsyncSearchableSelect from '@/components/cms/shared/AsyncSearchableSelect';

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

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({ user, isOpen, onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState(() => user ? {
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    full_name: user.full_name || '',
    phone: user.phone || '',
    avatar_url: user.avatar_url || '',
    school_id: user.school_id || '',
    position: user.position || '',
    sppg_id: user.sppg_id || '',
    supplier_id: user.supplier_id || '',
    offtaker_id: user.offtaker_id || ''
  } : {
    email: '',
    role: 'sekolah' as 'administrator' | 'sekolah' | 'sppg' | 'pemasok' | 'offtaker' | 'dinas_pertanian',
    is_active: true,
    full_name: '',
    phone: '',
    avatar_url: '',
    school_id: '',
    position: '',
    sppg_id: '',
    supplier_id: '',
    offtaker_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [initialSchoolLabel, setInitialSchoolLabel] = useState(() => user?.school_name || '');
  const [initialSppgLabel, setInitialSppgLabel] = useState(() => user?.sppg_name || '');
  const [initialSupplierLabel, setInitialSupplierLabel] = useState(() => user?.supplier_name || '');
  const [initialOfftakerLabel, setInitialOfftakerLabel] = useState(() => user?.offtaker_name || '');

  // Fetch function for schools search
  const fetchSchools = async (query: string) => {
    try {
      const response = await fetch(buildApiUrl(`/api/cms/schools/search?q=${encodeURIComponent(query)}`), {
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching schools:', error);
      return [];
    }
  };

  // Fetch function for SPPGs search
  const fetchSppgs = async (query: string) => {
    try {
      const response = await fetch(buildApiUrl(`/api/cms/sppgs/search?q=${encodeURIComponent(query)}`), {
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching SPPGs:', error);
      return [];
    }
  };

  // Fetch function for Suppliers search
  const fetchSuppliers = async (query: string) => {
    try {
      const response = await fetch(buildApiUrl(`/api/cms/suppliers/search?q=${encodeURIComponent(query)}`), {
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching Suppliers:', error);
      return [];
    }
  };

  // Fetch function for Offtakers search
  const fetchOfftakers = async (query: string) => {
    try {
      const response = await fetch(buildApiUrl(`/api/cms/offtakers/search?q=${encodeURIComponent(query)}`), {
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching Offtakers:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        school_id: user.school_id || '',
        position: user.position || '',
        sppg_id: user.sppg_id || '',
        supplier_id: user.supplier_id || '',
        offtaker_id: user.offtaker_id || ''
      });
      // Set initial labels for editing
      setInitialSchoolLabel(user.school_name || '');
      setInitialSppgLabel(user.sppg_name || '');
      setInitialSupplierLabel(user.supplier_name || '');
      setInitialOfftakerLabel(user.offtaker_name || '');
    } else {
      setFormData({
        email: '',
        role: 'sekolah',
        is_active: true,
        full_name: '',
        phone: '',
        avatar_url: '',
        school_id: '',
        position: '',
        sppg_id: '',
        supplier_id: '',
        offtaker_id: ''
      });
      setInitialSchoolLabel('');
      setInitialSppgLabel('');
      setInitialSupplierLabel('');
      setInitialOfftakerLabel('');
    }
    setError(null);
    setTempPassword(null);
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = user 
        ? buildApiUrl(`${API_ENDPOINTS.CMS_USERS}/${user.id}`)
        : buildApiUrl(API_ENDPOINTS.CMS_USERS);

      const method = user ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      const result = await response.json();
      
      // Show temporary password for new users
      if (!user && (result.temp_password || result.tempPassword)) {
        setTempPassword(result.temp_password || result.tempPassword);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('User form submission error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (tempPassword) {
      setTempPassword(null);
    } else {
      onClose();
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    
    if (!confirm('Apakah Anda yakin ingin mereset password pengguna ini? Password baru akan dibuat secara otomatis.')) {
      return;
    }

    setResetPasswordLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_USERS}/${user.id}/reset-password`), {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTempPassword(data.tempPassword || data.temp_password);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600/75" onClick={handleClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {user ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {tempPassword ? (
            <div className="p-6">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Berhasil!</strong>
                <span className="block sm:inline"> Pengguna berhasil dibuat.</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formData.email}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password Sementara
                  </label>
                  <div className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border">
                    {tempPassword}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Berikan password ini kepada pengguna untuk login pertama kali.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setTempPassword(null);
                    onSuccess();
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error!</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contoh@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nama lengkap pengguna"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="081234567890"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <SearchableSelect
                      options={[
                        { value: 'sekolah', label: 'Sekolah' },
                        { value: 'sppg', label: 'SPPG' },
                        { value: 'pemasok', label: 'Pemasok' },
                        { value: 'offtaker', label: 'Offtaker' },
                        { value: 'dinas_pertanian', label: 'Dinas Pertanian' },
                        { value: 'administrator', label: 'Administrator' }
                      ]}
                      value={formData.role}
                      onChange={(value) => setFormData(prev => ({ ...prev, role: value as 'administrator' | 'sekolah' | 'sppg' | 'pemasok' | 'offtaker' | 'dinas_pertanian' }))}
                      placeholder="Pilih Role"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Akun Aktif
                    </label>
                  </div>
                </div>

                {/* Right Column - Role-specific fields */}
                <div className="space-y-4">
                  {formData.role === 'sekolah' && (
                    <>
                      <div>
                        <label htmlFor="school_id" className="block text-sm font-medium text-gray-700 mb-1">
                          Sekolah *
                        </label>
                        <AsyncSearchableSelect
                          value={formData.school_id}
                          onChange={(value) => setFormData(prev => ({ ...prev, school_id: value }))}
                          fetchOptions={fetchSchools}
                          placeholder="Ketik untuk mencari sekolah..."
                          searchPlaceholder="Cari nama sekolah..."
                          initialLabel={initialSchoolLabel}
                        />
                      </div>
                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                          Posisi/Jabatan *
                        </label>
                        <input
                          type="text"
                          name="position"
                          id="position"
                          value={formData.position}
                          onChange={handleChange}
                          required={formData.role === 'sekolah'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contoh: Kepala Sekolah, Guru, dll"
                        />
                      </div>
                    </>
                  )}

                  {formData.role === 'sppg' && (
                    <>
                      <div>
                        <label htmlFor="sppg_id" className="block text-sm font-medium text-gray-700 mb-1">
                          SPPG *
                        </label>
                        <AsyncSearchableSelect
                          value={formData.sppg_id}
                          onChange={(value) => setFormData(prev => ({ ...prev, sppg_id: value }))}
                          fetchOptions={fetchSppgs}
                          placeholder="Ketik untuk mencari SPPG..."
                          searchPlaceholder="Cari nama SPPG..."
                          initialLabel={initialSppgLabel}
                        />
                      </div>
                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                          Posisi/Jabatan *
                        </label>
                        <input
                          type="text"
                          name="position"
                          id="position"
                          value={formData.position}
                          onChange={handleChange}
                          required={formData.role === 'sppg'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contoh: Manager, Kook, dll"
                        />
                      </div>
                    </>
                  )}

                  {formData.role === 'pemasok' && (
                    <>
                      <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                          Pemasok *
                        </label>
                        <AsyncSearchableSelect
                          value={formData.supplier_id}
                          onChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                          fetchOptions={fetchSuppliers}
                          placeholder="Ketik untuk mencari pemasok..."
                          searchPlaceholder="Cari nama pemasok..."
                          initialLabel={initialSupplierLabel}
                        />
                      </div>
                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                          Posisi/Jabatan *
                        </label>
                        <input
                          type="text"
                          name="position"
                          id="position"
                          value={formData.position}
                          onChange={handleChange}
                          required={formData.role === 'pemasok'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contoh: Manager, Kook, dll"
                        />
                      </div>
                    </>
                  )}

                  {formData.role === 'offtaker' && (
                    <>
                      <div>
                        <label htmlFor="offtaker_id" className="block text-sm font-medium text-gray-700 mb-1">
                          Offtaker *
                        </label>
                        <AsyncSearchableSelect
                          value={formData.offtaker_id}
                          onChange={(value) => setFormData(prev => ({ ...prev, offtaker_id: value }))}
                          fetchOptions={fetchOfftakers}
                          placeholder="Ketik untuk mencari offtaker..."
                          searchPlaceholder="Cari nama offtaker..."
                          initialLabel={initialOfftakerLabel}
                        />
                      </div>
                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                          Posisi/Jabatan *
                        </label>
                        <input
                          type="text"
                          name="position"
                          id="position"
                          value={formData.position}
                          onChange={handleChange}
                          required={formData.role === 'offtaker'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contoh: Owner, Manager, Staff, dll"
                        />
                      </div>
                    </>
                  )}

                  {formData.role === 'administrator' && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Administrator tidak memerlukan instansi atau posisi khusus.</p>
                    </div>
                  )}

                  {formData.role === 'dinas_pertanian' && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Dinas Pertanian tidak memerlukan instansi atau posisi khusus.</p>
                      <p className="text-sm mt-2">Pengguna ini akan memiliki akses untuk mengelola semua pemasok dan produk.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div>
                  {user && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetPasswordLoading}
                      className="flex items-center gap-2 px-3 py-2 text-yellow-600 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IconKey className="h-4 w-4" />
                      {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Menyimpan...' : (user ? 'Update' : 'Buat')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
