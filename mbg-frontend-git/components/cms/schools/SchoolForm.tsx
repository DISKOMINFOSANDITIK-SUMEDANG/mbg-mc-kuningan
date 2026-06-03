'use client';

import { useState, useEffect } from 'react';
import { IconX, IconMapPin, IconUsers, IconBuilding } from '@tabler/icons-react';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

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
  created_at: string;
  updated_at: string;
}

interface SPPGOption {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

interface SchoolFormProps {
  school?: School | null;
  sppgOptions: SPPGOption[];
  onClose: () => void;
  onSuccess: () => void;
  disableName?: boolean;
  hideStatusAndSppg?: boolean;
  defaultSppgId?: string;
}

export default function SchoolForm({ school, sppgOptions, onClose, onSuccess, disableName = false, hideStatusAndSppg = false, defaultSppgId }: SchoolFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    level: 'SD',
    address: '',
    district: '',
    village: '',
    student_count: 0,
    program_start_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    latitude: '',
    longitude: '',
    sppg_id: defaultSppgId || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name,
        level: school.level,
        address: school.address,
        district: school.district,
        village: school.village,
        student_count: school.student_count,
        program_start_date: school.program_start_date,
        status: school.status,
        latitude: school.latitude?.toString() || '',
        longitude: school.longitude?.toString() || '',
        sppg_id: school.sppg_id || ''
      });
    }
  }, [school]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama sekolah harus diisi';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Alamat harus diisi';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'Kecamatan harus diisi';
    }
    if (!formData.village.trim()) {
      newErrors.village = 'Desa harus diisi';
    }
    if (formData.student_count < 0) {
      newErrors.student_count = 'Jumlah siswa tidak boleh negatif';
    }
    if (formData.latitude && (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude harus berupa angka antara -90 dan 90';
    }
    if (formData.longitude && (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude harus berupa angka antara -180 dan 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = school ? buildApiUrl(`${API_ENDPOINTS.CMS_SCHOOLS}/${school.id}`) : buildApiUrl(API_ENDPOINTS.CMS_SCHOOLS);
      const method = school ? 'PUT' : 'POST';
      
      console.log('Submitting school data:', {
        url,
        method,
        formData,
        schoolId: school?.id
      });

      const parsedStudentCount = parseInt(formData.student_count.toString());
      const requestBody = {
        ...formData,
        student_count: isNaN(parsedStudentCount) ? 0 : parsedStudentCount,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        sppg_id: formData.sppg_id || null
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response from server:', { status: response.status, data });

      if (response.ok) {
        console.log('School saved successfully');
        onSuccess();
      } else if (
        response.status === 409 ||
        (data.details && data.details.includes('schools_name_district_village_key'))
      ) {
        // Duplicate constraint violation — show inline error on the name field
        setErrors(prev => ({
          ...prev,
          name: `Sekolah dengan nama "${formData.name}" di kecamatan "${formData.district}" desa "${formData.village}" sudah terdaftar`
        }));
      } else {
        console.error('Error saving school:', data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving school:', error);
      alert('Terjadi kesalahan saat menyimpan data sekolah');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {school ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <IconBuilding className="w-5 h-5 mr-2" />
              Informasi Dasar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Sekolah *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={disableName}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } ${disableName ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="Masukkan nama sekolah"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Pendidikan *
                </label>
                <SearchableSelect
                  value={formData.level}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      level: value
                    }));
                  }}
                  placeholder="Pilih tingkat pendidikan"
                  searchPlaceholder="Cari tingkat pendidikan..."
                  options={[
                    { value: 'PAUD', label: 'PAUD (Pendidikan Anak Usia Dini)' },
                    { value: 'KB', label: 'KB (Kelompok Bermain)' },
                    { value: 'TK', label: 'TK (Taman Kanak-kanak)' },
                    { value: 'RA', label: 'RA (Raudhatul Athfal)' },
                    { value: 'SD', label: 'SD (Sekolah Dasar)' },
                    { value: 'MI', label: 'MI (Madrasah Ibtidaiyah)' },
                    { value: 'SMP', label: 'SMP (Sekolah Menengah Pertama)' },
                    { value: 'MTs', label: 'MTs (Madrasah Tsanawiyah)' },
                    { value: 'SMA', label: 'SMA (Sekolah Menengah Atas)' },
                    { value: 'MA', label: 'MA (Madrasah Aliyah)' },
                    { value: 'SMK', label: 'SMK (Sekolah Menengah Kejuruan)' },
                    { value: 'MAK', label: 'MAK (Madrasah Aliyah Kejuruan)' },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Masukkan alamat lengkap sekolah"
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kecamatan *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.district ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan kecamatan"
                />
                {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desa/Kelurahan *
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.village ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan desa/kelurahan"
                />
                {errors.village && <p className="mt-1 text-sm text-red-600">{errors.village}</p>}
              </div>
            </div>
          </div>

          {/* Program Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <IconUsers className="w-5 h-5 mr-2" />
              Informasi Program
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Siswa
                </label>
                <input
                  type="number"
                  name="student_count"
                  value={formData.student_count}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.student_count ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.student_count && <p className="mt-1 text-sm text-red-600">{errors.student_count}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai Program
                </label>
                <input
                  type="date"
                  name="program_start_date"
                  value={formData.program_start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {!hideStatusAndSppg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <SearchableSelect
                  value={formData.status}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      status: value
                    }));
                  }}
                  placeholder="Pilih status"
                  searchPlaceholder="Cari status..."
                  options={[
                    { value: 'Active', label: 'Aktif' },
                    { value: 'Pilot', label: 'Pilot' },
                    { value: 'Inactive', label: 'Tidak Aktif' }
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SPPG (Dapur)
                </label>
                <SearchableSelect
                  value={formData.sppg_id}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      sppg_id: value
                    }));
                  }}
                  placeholder="Pilih SPPG"
                  searchPlaceholder="Cari SPPG..."
                  options={[
                    { value: '', label: 'Pilih SPPG' },
                    ...sppgOptions.map((sppg) => ({
                      value: sppg.id,
                      label: `${sppg.name} (${sppg.type})`
                    }))
                  ]}
                  className="w-full"
                />
              </div>
            </div>
            )}
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <IconMapPin className="w-5 h-5 mr-2" />
              Koordinat Lokasi (Opsional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.latitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="-6.8333"
                />
                {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.longitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="107.9167"
                />
                {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : (school ? 'Update Sekolah' : 'Tambah Sekolah')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
