'use client';

import { useState, useEffect } from 'react';
import { IconX, IconCheck, IconMapPin, IconPhone, IconMail, IconClock, IconBuilding } from '@tabler/icons-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';

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

interface SPPGFormProps {
  sppg?: SPPG | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SPPG_TYPES = [
  'Dapur Satelit Modular',
  'Dapur Konvensional',
  'Dapur Pusat'
];

interface Foundation {
  id: string;
  name: string;
}

export default function SPPGForm({ sppg, isOpen, onClose, onSuccess }: SPPGFormProps) {
  const [formData, setFormData] = useState({
    id_sppg: '',
    name: '',
    type: 'Dapur Satelit Modular',
    capacity: '',
    location: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    address: '',
    operating_hours_start: '',
    operating_hours_end: '',
    foundation_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [loadingFoundations, setLoadingFoundations] = useState(false);

  useEffect(() => {
    if (sppg) {
      setFormData({
        id_sppg: sppg.id_sppg || '',
        name: sppg.name || '',
        type: sppg.type || 'Dapur Satelit Modular',
        capacity: sppg.capacity?.toString() || '',
        location: sppg.location || '',
        latitude: sppg.latitude?.toString() || '',
        longitude: sppg.longitude?.toString() || '',
        phone: sppg.phone || '',
        email: sppg.email || '',
        address: sppg.address || '',
        operating_hours_start: sppg.operating_hours_start || '',
        operating_hours_end: sppg.operating_hours_end || '',
        foundation_id: sppg.foundation_id || ''
      });
      console.log('Editing SPPG - foundation_id:', sppg.foundation_id, 'Type:', typeof sppg.foundation_id);
      console.log('Full SPPG data:', sppg);
    } else {
      setFormData({
        id_sppg: '',
        name: '',
        type: 'Dapur Satelit Modular',
        capacity: '',
        location: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        address: '',
        operating_hours_start: '',
        operating_hours_end: '',
        foundation_id: ''
      });
    }
    setError('');
    setFieldErrors({});
  }, [sppg, isOpen]);

  // Load foundations when form opens
  useEffect(() => {
    if (isOpen) {
      loadFoundations();
    }
  }, [isOpen]);

  const loadFoundations = async () => {
    setLoadingFoundations(true);
    try {
      console.log('Loading foundations...');
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_FOUNDATIONS}?all=true`), {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.foundations || []);
        console.log('Foundations loaded:', list);
        setFoundations(list);
      } else {
        console.error('Failed to load foundations:', response.status);
      }
    } catch (error) {
      console.error('Error loading foundations:', error);
    } finally {
      setLoadingFoundations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const url = sppg 
        ? buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppg.id}`)
        : buildApiUrl(API_ENDPOINTS.CMS_SPPGS);
      
      const method = sppg ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData?.details && typeof errorData.details === 'object') {
          setFieldErrors(errorData.details);
        }
        throw new Error(errorData.error || 'Gagal menyimpan SPPG');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">
              {sppg ? 'Edit SPPG' : 'Tambah SPPG'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">{error}</p>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                    {Object.entries(fieldErrors).map(([key, message]) => (
                      <li key={key}>{message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <IconBuilding className="h-5 w-5 mr-2 text-blue-600" />
                  Informasi Dasar
                </h4>
                
                <div>
                  <label htmlFor="id_sppg" className="block text-sm font-medium text-gray-700 mb-1">
                    ID SPPG *
                  </label>
                  <input
                    type="text"
                    id="id_sppg"
                    name="id_sppg"
                    value={formData.id_sppg}
                    onChange={handleChange}
                    required
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: SPPG-001"
                  />
                  <p className="mt-1 text-xs text-gray-500">Format: SPPG-XXX (maks 50 karakter)</p>
                  {fieldErrors.id_sppg && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.id_sppg}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama SPPG *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama SPPG"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe SPPG *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SPPG_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Kapasitas (porsi/hari)
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan kapasitas"
                  />
                  {fieldErrors.capacity && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.capacity}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan lokasi"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <IconPhone className="h-5 w-5 mr-2 text-green-600" />
                  Informasi Kontak
                </h4>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nomor telepon"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan alamat email"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan alamat lengkap"
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                  )}
                </div>
              </div>

              {/* Location Coordinates */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <IconMapPin className="h-5 w-5 mr-2 text-red-600" />
                  Koordinat Lokasi
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Latitude"
                    />
                    {fieldErrors.latitude && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.latitude}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Longitude"
                    />
                    {fieldErrors.longitude && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.longitude}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <IconClock className="h-5 w-5 mr-2 text-purple-600" />
                  Jam Operasional
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="operating_hours_start" className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      id="operating_hours_start"
                      name="operating_hours_start"
                      value={formData.operating_hours_start}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {fieldErrors.operating_hours_start && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.operating_hours_start}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="operating_hours_end" className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      id="operating_hours_end"
                      name="operating_hours_end"
                      value={formData.operating_hours_end}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {fieldErrors.operating_hours_end && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.operating_hours_end}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Foundation Selection */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-md font-semibold text-gray-900">Yayasan</h4>

                <div>
                  <label htmlFor="foundation_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Yayasan
                  </label>
                  {loadingFoundations ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      Memuat daftar yayasan...
                    </div>
                  ) : (
                    <SearchableSelect
                      options={foundations.map(foundation => ({
                        value: foundation.id,
                        label: foundation.name
                      }))}
                      value={formData.foundation_id || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, foundation_id: value }))}
                      placeholder="-- Pilih Yayasan --"
                      searchPlaceholder="Cari yayasan..."
                      disabled={loadingFoundations}
                    />
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Total {foundations.length} yayasan tersedia
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading ||
                  !formData.id_sppg.trim() ||
                  !formData.name.trim() ||
                  !formData.type ||
                  !formData.location.trim()
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <IconCheck className="h-4 w-4" />
                )}
                {sppg ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
