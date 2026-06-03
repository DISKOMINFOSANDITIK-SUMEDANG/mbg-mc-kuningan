'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { IconSchool, IconBuilding, IconUsers, IconMapPin, IconCalendar, IconEdit, IconEye, IconArrowLeft, IconDeviceFloppy, IconX } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import MapView from '@/components/shared/MapView';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
interface School {
  id: string;
  name: string;
  level: string;
  address: string;
  district: string;
  village: string;
  student_count: number;
  program_start_date: string;
  status: string;
  latitude?: number;
  longitude?: number;
  sppg_id?: string;
  sppgs?: {
    id: string;
    name: string;
    type: string;
  };
  created_at?: string;
  updated_at?: string;
}

export default function SchoolManagementDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'location' | 'program' | 'sppg'>('info');
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    address: '',
    district: '',
    village: '',
    student_count: 0,
    program_start_date: '',
    status: '',
    latitude: 0,
    longitude: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserAndSchool = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, get user data to verify school access
        const userResponse = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), {
          credentials: 'include'
        });
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        if (!userData.school_id) {
          setError('Anda tidak memiliki sekolah yang terkait dengan akun ini');
          return;
        }

        // Check if user is trying to access their own school
        if (userData.school_id !== params.id) {
          setError('Anda hanya dapat mengelola sekolah yang terkait dengan akun Anda');
          return;
        }

        setUserSchoolId(userData.school_id);

        // Fetch school details
        const schoolResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SCHOOLS}/${params.id}`), {
          credentials: 'include'
        });
        if (!schoolResponse.ok) {
          throw new Error('Failed to fetch school data');
        }
        
        const schoolData = await schoolResponse.json();
        setSchool(schoolData);
        
        // Initialize form data
        setFormData({
          name: schoolData.name || '',
          level: schoolData.level || '',
          address: schoolData.address || '',
          district: schoolData.district || '',
          village: schoolData.village || '',
          student_count: schoolData.student_count || 0,
          program_start_date: schoolData.program_start_date || '',
          status: schoolData.status || '',
          latitude: schoolData.latitude || 0,
          longitude: schoolData.longitude || 0
        });
      } catch (err) {
        console.error('Error loading school:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data sekolah');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadUserAndSchool();
    }
  }, [params.id]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'students', 'location', 'program', 'sppg'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!school) return;
    
    setSaving(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SCHOOLS}/${school.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update school data');
      }

      const updatedSchool = await response.json();
      setSchool(updatedSchool);
      setIsEditing(false);
      
      // Show success message
      alert('Data sekolah berhasil diperbarui!');
    } catch (err) {
      console.error('Error saving school:', err);
      alert('Terjadi kesalahan saat menyimpan data sekolah');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (school) {
      setFormData({
        name: school.name || '',
        level: school.level || '',
        address: school.address || '',
        district: school.district || '',
        village: school.village || '',
        student_count: school.student_count || 0,
        program_start_date: school.program_start_date || '',
        status: school.status || '',
        latitude: school.latitude || 0,
        longitude: school.longitude || 0
      });
    }
    setIsEditing(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SD':
        return 'bg-blue-100 text-blue-800';
      case 'SMP':
        return 'bg-green-100 text-green-800';
      case 'SMA':
        return 'bg-purple-100 text-purple-800';
      case 'SMK':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-800';
      case 'Tidak Aktif':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'info', name: 'Informasi Dasar', icon: IconBuilding },
    { id: 'students', name: 'Data Siswa', icon: IconUsers },
    { id: 'location', name: 'Lokasi & Peta', icon: IconMapPin },
    { id: 'program', name: 'Program & Jadwal', icon: IconCalendar },
    { id: 'sppg', name: 'SPPG Terkait', icon: IconSchool }
  ];

  if (loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </CMSLayout>
    );
  }

  if (error) {
    return (
      <CMSLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconSchool className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Dapat Memuat Data Sekolah</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </CMSLayout>
    );
  }

  if (!school) {
    return (
      <CMSLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconSchool className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sekolah Tidak Ditemukan</h3>
          <p className="text-gray-600">Sekolah yang Anda cari tidak ditemukan.</p>
        </div>
      </CMSLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Informasi Dasar</h3>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <IconX className="h-4 w-4" />
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <IconDeviceFloppy className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <IconEdit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  {isEditing ? (
                    <select
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Level</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="SMK">SMK</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(school.level)}`}>
                      {school.level}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.address}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distrik</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.district}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desa/Kelurahan</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) => handleInputChange('village', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.village}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Status</option>
                      <option value="Active">Aktif</option>
                      <option value="Pilot">Pilot</option>
                      <option value="Inactive">Tidak Aktif</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
                      {school.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Siswa</h3>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <IconX className="h-4 w-4" />
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <IconDeviceFloppy className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <IconEdit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Siswa</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.student_count}
                      onChange={(e) => handleInputChange('student_count', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.student_count?.toLocaleString() || 0} siswa</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai Program</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.program_start_date ? formData.program_start_date.split('T')[0] : ''}
                      onChange={(e) => handleInputChange('program_start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {school.program_start_date ? new Date(school.program_start_date).toLocaleDateString('id-ID') : 'Belum ditentukan'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <IconUsers className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Total Siswa</p>
                      <p className="text-2xl font-bold text-blue-600">{school.student_count?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <IconCalendar className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Program Dimulai</p>
                      <p className="text-sm font-bold text-green-600">
                        {school.program_start_date ? new Date(school.program_start_date).toLocaleDateString('id-ID') : 'Belum ditentukan'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <IconSchool className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">Level Pendidikan</p>
                      <p className="text-sm font-bold text-purple-600">{school.level}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lokasi & Peta</h3>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <IconX className="h-4 w-4" />
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <IconDeviceFloppy className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <IconEdit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.address}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distrik</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.district}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desa/Kelurahan</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) => handleInputChange('village', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.village}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Koordinat</label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                        placeholder="Latitude"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                        placeholder="Longitude"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {school.latitude && school.longitude 
                        ? `${school.latitude}, ${school.longitude}`
                        : 'Koordinat belum tersedia'
                      }
                    </p>
                  )}
                </div>
              </div>
              
              {school.latitude && school.longitude && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peta Lokasi</label>
                  <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                    <MapView
                      latitude={school.latitude}
                      longitude={school.longitude}
                      title={school.name}
                      description={school.address}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'program':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Program & Jadwal</h3>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <IconX className="h-4 w-4" />
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <IconDeviceFloppy className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <IconEdit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai Program</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.program_start_date ? formData.program_start_date.split('T')[0] : ''}
                      onChange={(e) => handleInputChange('program_start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {school.program_start_date 
                        ? new Date(school.program_start_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Belum ditentukan'
                      }
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Program</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Status</option>
                      <option value="Active">Aktif</option>
                      <option value="Pilot">Pilot</option>
                      <option value="Inactive">Tidak Aktif</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
                      {school.status}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Peserta</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.student_count}
                      onChange={(e) => handleInputChange('student_count', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{school.student_count?.toLocaleString() || 0} siswa</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level Pendidikan</label>
                  {isEditing ? (
                    <select
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Level</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="SMK">SMK</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(school.level)}`}>
                      {school.level}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sppg':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SPPG Terkait</h3>
              
              {school.sppgs ? (
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <IconSchool className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-blue-900">{school.sppgs.name}</h4>
                      <p className="text-sm text-blue-700 mb-2">{school.sppgs.type}</p>
                      <p className="text-sm text-blue-600">
                        SPPG ini bertanggung jawab untuk menyediakan makanan bergizi untuk sekolah Anda.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconSchool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada SPPG Terkait</h4>
                  <p className="text-gray-600">Sekolah ini belum memiliki SPPG yang ditugaskan.</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <a
                  href="/cms/school-management"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <IconArrowLeft className="h-5 w-5" />
                </a>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
                  <p className="text-gray-600">Kelola informasi dan data sekolah</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(school.level)}`}>
                  {school.level}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(school.status)}`}>
                  {school.status}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
