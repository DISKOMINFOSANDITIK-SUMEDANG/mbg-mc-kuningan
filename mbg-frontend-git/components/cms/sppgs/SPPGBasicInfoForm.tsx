'use client';

import { useState, useEffect } from 'react';
import { IconDeviceFloppy, IconX, IconChefHat, IconMapPin, IconPhone, IconBuilding } from '@tabler/icons-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface SPPG {
  id: string;
  id_sppg?: string;
  name: string;
  type: string;
  capacity?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  address?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
  foundation_id?: string;
}

interface SPPGBasicInfoFormProps {
  sppg: SPPG;
  onSuccess: (updatedSppg: SPPG) => void;
  onCancel: () => void;
}

export default function SPPGBasicInfoForm({ sppg, onSuccess, onCancel }: SPPGBasicInfoFormProps) {
  const [formData, setFormData] = useState({
    id_sppg: sppg.id_sppg || '',
    name: sppg.name || '',
    type: sppg.type || '',
    capacity: sppg.capacity || 0,
    location: sppg.location || '',
    latitude: sppg.latitude || 0,
    longitude: sppg.longitude || 0,
    phone: sppg.phone || '',
    email: sppg.email || '',
    address: sppg.address || '',
    operating_hours_start: sppg.operating_hours_start || '',
    operating_hours_end: sppg.operating_hours_end || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'latitude' || name === 'longitude' 
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppg.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update SPPG information');
      }

      const updatedSppg = await response.json();
      onSuccess(updatedSppg);
    } catch (err) {
      console.error('Error updating SPPG:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui informasi SPPG');
    } finally {
      setLoading(false);
    }
  };

  const sppgTypes = [
    'Dapur Satelit Modular',
    'Dapur Konvensional',
    'Dapur Pusat'
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <IconChefHat className="h-5 w-5 mr-2 text-blue-600" />
          Edit Informasi Dasar SPPG
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IconX className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <IconBuilding className="h-4 w-4 mr-2 text-gray-500" />
              Informasi Dasar
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID SPPG *
              </label>
              <input
                type="text"
                name="id_sppg"
                value={formData.id_sppg}
                onChange={handleInputChange}
                required
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="Contoh: SPPG-001"
              />
              <p className="mt-1 text-xs text-gray-500">Format: SPPG-XXX (maks 50 karakter)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama SPPG *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama SPPG"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe SPPG *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih tipe SPPG</option>
                {sppgTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kapasitas (porsi/hari)
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan kapasitas harian"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan lokasi SPPG"
              />
            </div>
          </div>

          {/* Contact & Operational Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <IconPhone className="h-4 w-4 mr-2 text-gray-500" />
              Kontak & Operasional
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan alamat email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan alamat lengkap SPPG"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jam Mulai Operasional
                </label>
                <input
                  type="time"
                  name="operating_hours_start"
                  value={formData.operating_hours_start}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jam Selesai Operasional
                </label>
                <input
                  type="time"
                  name="operating_hours_end"
                  value={formData.operating_hours_end}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 flex items-center">
            <IconMapPin className="h-4 w-4 mr-2 text-gray-500" />
            Koordinat Lokasi
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan latitude"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan longitude"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
