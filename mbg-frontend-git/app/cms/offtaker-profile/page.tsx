'use client';

import { useEffect, useState } from 'react';
import { 
  IconBuildingWarehouse, 
  IconMapPin, 
  IconPhone, 
  IconMail, 
  IconUser,
  IconEdit,
  IconDeviceFloppy
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface OfftakerProfile {
  id: string;
  name: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  phone: string;
  email: string;
  pic_name: string;
  pic_phone: string;
  warehouse_address: string;
  warehouse_capacity: number;
  status: string;
  notes: string;
  product_count: number;
}

export default function OfftakerProfilePage() {
  const [profile, setProfile] = useState<OfftakerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<OfftakerProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/cms/offtaker-profile');
      const data = await response.json();
      setProfile(data.data);
      setForm(data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/cms/offtaker-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('Profil berhasil diperbarui');
        setEditing(false);
        fetchProfile();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Terjadi kesalahan saat memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat profil..." />
      </CMSLayout>
    );
  }

  if (!profile) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Profil offtaker tidak ditemukan</p>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <IconBuildingWarehouse className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Profil Offtaker</h1>
                  <p className="text-purple-100">Kelola informasi offtaker dan gudang Anda</p>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <IconEdit className="w-5 h-5 mr-2" />
                  Edit Profil
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <IconBuildingWarehouse className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Informasi Offtaker</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Offtaker <span className="text-red-500">*</span>
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <IconPhone className="w-4 h-4 inline mr-1" />
                    Telepon
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.phone || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <IconMail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.email || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <IconMapPin className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Alamat</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap
                  </label>
                  {editing ? (
                    <textarea
                      value={form.address || ''}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.address || '-'}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kecamatan
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.subdistrict || ''}
                        onChange={(e) => setForm({ ...form, subdistrict: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.subdistrict || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kabupaten/Kota
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.district || ''}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.district || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provinsi
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.province || ''}
                        onChange={(e) => setForm({ ...form, province: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.province || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <IconBuildingWarehouse className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Informasi Gudang</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Gudang
                  </label>
                  {editing ? (
                    <textarea
                      value={form.warehouse_address || ''}
                      onChange={(e) => setForm({ ...form, warehouse_address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.warehouse_address || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kapasitas Gudang (kg)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.warehouse_capacity || ''}
                      onChange={(e) => setForm({ ...form, warehouse_capacity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {profile.warehouse_capacity ? `${profile.warehouse_capacity.toLocaleString('id-ID')} kg` : '-'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* PIC Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <IconUser className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Penanggung Jawab</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama PIC
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.pic_name || ''}
                      onChange={(e) => setForm({ ...form, pic_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.pic_name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon PIC
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={form.pic_phone || ''}
                      onChange={(e) => setForm({ ...form, pic_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.pic_phone || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Statistik</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Jumlah Produk:</span>
                  <span className="text-sm font-medium text-blue-900">{profile.product_count}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {editing && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Catatan tambahan..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm(profile);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <IconDeviceFloppy className="w-5 h-5 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}
          </form>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
