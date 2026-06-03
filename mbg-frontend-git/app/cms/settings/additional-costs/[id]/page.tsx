'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconCurrencyDollar
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';

interface FormData {
  name: string;
  description: string;
  default_amount: string;
  is_active: boolean;
}

export default function AdditionalCostFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params?.id !== 'new';
  const costId = isEdit ? params?.id as string : null;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    default_amount: '0',
    is_active: true
  });

  useEffect(() => {
    if (isEdit && costId) {
      loadCost();
    }
  }, [isEdit, costId]);

  const loadCost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cms/additional-costs', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch additional cost');
      }

      const result = await response.json();
      const cost = result.data?.find((c: any) => c.id === costId);

      if (cost) {
        setForm({
          name: cost.name,
          description: cost.description || '',
          default_amount: cost.default_amount?.toString() || '0',
          is_active: cost.is_active
        });
      } else {
        setError('Biaya tambahan tidak ditemukan');
      }
    } catch (error) {
      console.error('Error loading cost:', error);
      setError('Gagal memuat data biaya tambahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.name.trim()) {
      setError('Nama wajib diisi');
      return;
    }

    const amount = parseFloat(form.default_amount);
    if (isNaN(amount) || amount < 0) {
      setError('Default amount harus berupa angka positif');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(isEdit && { id: costId }),
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_amount: amount,
        is_active: form.is_active
      };

      const response = await fetch('/api/cms/additional-costs', {
        method: isEdit ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      alert(`Biaya tambahan berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
      router.push('/cms/settings/additional-costs');
    } catch (error: any) {
      console.error('Error saving:', error);
      setError(error.message || 'Gagal menyimpan biaya tambahan');
    } finally {
      setSaving(false);
    }
  };

  const unitTypeOptions = [
    { value: 'per_kg', label: 'Per Kg', description: 'Biaya dikalikan dengan berat (kg)' },
    { value: 'per_km', label: 'Per Km', description: 'Biaya dikalikan dengan jarak (km)' },
    { value: 'flat', label: 'Flat', description: 'Biaya tetap, tidak dikalikan' },
    { value: 'percentage', label: 'Persentase (%)', description: 'Biaya berdasarkan % dari total' }
  ];

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  href="/cms/settings/additional-costs"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Biaya Tambahan' : 'Tambah Biaya Tambahan'}
                  </h1>
                  <p className="text-purple-100">
                    {isEdit ? 'Perbarui data biaya tambahan' : 'Tambahkan biaya tambahan baru'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          {loading ? (
            <PageLoadingState message="Memuat data..." />
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Biaya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Ongkos Kirim, Biaya Admin, dll"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Deskripsi singkat tentang biaya ini (opsional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Default Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={form.default_amount}
                      onChange={(e) => setForm({ ...form, default_amount: e.target.value })}
                      min="0"
                      step="1"
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Biaya tetap yang akan ditambahkan ke transaksi
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Aktif (tampilkan dalam pilihan transaksi)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <Link
                    href="/cms/settings/additional-costs"
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                  >
                    <IconDeviceFloppy className="h-5 w-5" />
                    {saving ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
