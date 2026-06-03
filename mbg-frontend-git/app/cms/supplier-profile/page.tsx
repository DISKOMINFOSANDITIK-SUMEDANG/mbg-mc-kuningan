'use client';

import { useState, useEffect } from 'react';
import { IconDeviceFloppy, IconTruck, IconMail, IconPhone, IconWorld, IconMapPin, IconEdit } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import FileUpload from '@/components/cms/shared/FileUpload';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface Supplier {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierForm {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
}

export default function SupplierProfilePage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<SupplierForm>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get current user's supplier data
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers`), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini');
        } else {
          setError('Gagal memuat profil pemasok');
        }
        return;
      }
      
      const data = await response.json();
      // For pemasok role, the API returns only their supplier(s)
      const suppliers = Array.isArray(data) ? data : (data.data || []);
      
      if (suppliers.length > 0) {
        const supplierData = suppliers[0];
        setSupplier(supplierData);
        setForm({
          name: supplierData.name || '',
          description: supplierData.description || '',
          address: supplierData.address || '',
          phone: supplierData.phone || '',
          email: supplierData.email || '',
          website: supplierData.website || '',
          logo_url: supplierData.logo_url || '',
        });
      } else {
        setError('Profil pemasok tidak ditemukan. Hubungi administrator.');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Terjadi kesalahan saat memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers/${supplier.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan perubahan');
        return;
      }

      const updatedSupplier = await response.json();
      setSupplier(updatedSupplier);
      setIsEditing(false);
      setSuccessMessage('Profil berhasil diperbarui');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        description: supplier.description || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        website: supplier.website || '',
        logo_url: supplier.logo_url || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Profil Pemasok</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <IconTruck className="h-3 w-3 mr-1" />
                  Mode Pemasok
                </span>
              </div>
              <p className="text-gray-600">Kelola informasi profil pemasok Anda</p>
            </div>
            {supplier && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconEdit className="h-5 w-5" />
                Edit Profil
              </button>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat profil...</p>
            </div>
          ) : supplier ? (
            isEditing ? (
              /* Edit Form */
              <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Pemasok <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Deskripsi singkat tentang pemasok Anda..."
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telepon
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo Pemasok
                    </label>
                    <FileUpload
                      onUpload={(url) => setForm({ ...form, logo_url: url })}
                      onRemove={() => setForm({ ...form, logo_url: '' })}
                      currentUrl={form.logo_url}
                      accept="image/*"
                      maxSize={3}
                      folder="supplier-logos"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <IconDeviceFloppy className="h-5 w-5" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {supplier.logo_url ? (
                        <img
                          className="h-24 w-24 rounded-lg object-cover"
                          src={supplier.logo_url}
                          alt={supplier.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%23e5e7eb"/></svg>';
                          }}
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                          <IconTruck className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.status ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {supplier.description && (
                        <p className="mt-2 text-gray-600">{supplier.description}</p>
                      )}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supplier.address && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <IconMapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{supplier.address}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconPhone className="h-5 w-5 flex-shrink-0" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconMail className="h-5 w-5 flex-shrink-0" />
                            <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.website && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconWorld className="h-5 w-5 flex-shrink-0" />
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {supplier.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Dibuat:</span> {formatDate(supplier.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Diperbarui:</span> {formatDate(supplier.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
