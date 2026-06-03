'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  IconArrowLeft,
  IconBuildingWarehouse,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconLoader2
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface FormData {
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
  warehouse_capacity: string;
  status: string;
  notes: string;
}

export default function EditOfftakerPage() {
  const router = useRouter();
  const params = useParams();
  const offtakerId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    phone: '',
    email: '',
    pic_name: '',
    pic_phone: '',
    warehouse_address: '',
    warehouse_capacity: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchOfftaker();
  }, [offtakerId]);

  const fetchOfftaker = async () => {
    try {
      const response = await fetch(`/api/cms/offtakers/${offtakerId}`);
      if (!response.ok) {
        setError('Offtaker tidak ditemukan');
        return;
      }
      const data = await response.json();
      const offtaker = data.data;
      
      setForm({
        name: offtaker.name || '',
        address: offtaker.address || '',
        subdistrict: offtaker.subdistrict || '',
        district: offtaker.district || '',
        province: offtaker.province || '',
        phone: offtaker.phone || '',
        email: offtaker.email || '',
        pic_name: offtaker.pic_name || '',
        pic_phone: offtaker.pic_phone || '',
        warehouse_address: offtaker.warehouse_address || '',
        warehouse_capacity: offtaker.warehouse_capacity?.toString() || '',
        status: offtaker.status || 'active',
        notes: offtaker.notes || ''
      });
    } catch (err) {
      console.error('Error fetching offtaker:', err);
      setError('Gagal memuat data offtaker');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Nama offtaker wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/cms/offtakers/${offtakerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          warehouse_capacity: form.warehouse_capacity ? parseFloat(form.warehouse_capacity) : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal mengupdate offtaker');
        return;
      }

      alert('Offtaker berhasil diupdate');
      router.push('/cms/offtakers');
    } catch (err) {
      console.error('Error updating offtaker:', err);
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data offtaker..." />
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-4">
              <Link
                href="/cms/offtakers"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <IconBuildingWarehouse className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Edit Offtaker</h1>
                  <p className="text-purple-100">Perbarui informasi offtaker</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Informasi Dasar */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <IconBuildingWarehouse className="w-5 h-5 mr-2 text-purple-600" />
                Informasi Dasar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Offtaker <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Masukkan nama offtaker"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <IconPhone className="w-4 h-4 inline mr-1" />
                    Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <IconMail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <IconMapPin className="w-5 h-5 mr-2 text-purple-600" />
                Alamat
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Jalan, nomor, RT/RW"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    name="subdistrict"
                    value={form.subdistrict}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nama kecamatan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kabupaten/Kota
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nama kabupaten/kota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nama provinsi"
                  />
                </div>
              </div>
            </div>

            {/* Penanggung Jawab */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <IconUser className="w-5 h-5 mr-2 text-purple-600" />
                Penanggung Jawab (PIC)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama PIC
                  </label>
                  <input
                    type="text"
                    name="pic_name"
                    value={form.pic_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nama penanggung jawab"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon PIC
                  </label>
                  <input
                    type="tel"
                    name="pic_phone"
                    value={form.pic_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Gudang */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <IconBuildingWarehouse className="w-5 h-5 mr-2 text-purple-600" />
                Informasi Gudang
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Gudang
                  </label>
                  <textarea
                    name="warehouse_address"
                    value={form.warehouse_address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Alamat lengkap gudang (kosongkan jika sama dengan alamat kantor)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kapasitas Gudang (Kg)
                  </label>
                  <input
                    type="number"
                    name="warehouse_capacity"
                    value={form.warehouse_capacity}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Kapasitas dalam Kg"
                  />
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="p-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Catatan tambahan (opsional)"
              />
            </div>

            {/* Actions */}
            <div className="p-6 flex justify-end space-x-3">
              <Link
                href="/cms/offtakers"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                {saving ? 'Menyimpan...' : 'Update Offtaker'}
              </button>
            </div>
          </form>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
