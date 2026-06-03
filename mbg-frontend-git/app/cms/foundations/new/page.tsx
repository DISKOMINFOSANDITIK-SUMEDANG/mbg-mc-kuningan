'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import { IconBuilding, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function NewFoundationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama yayasan harus diisi');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/cms/foundations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (response.ok) {
        router.push('/cms/foundations');
        router.refresh();
      } else {
        setError(responseData.error || 'Terjadi kesalahan saat menyimpan');
      }
    } catch (error) {
      console.error('Error saving foundation:', error);
      setError('Terjadi kesalahan saat menyimpan yayasan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CMSLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/cms/foundations"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IconArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Yayasan Baru</h1>
            <p className="mt-1 text-sm text-gray-600">
              Tambahkan yayasan baru yang mengelola SPPG
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <IconBuilding className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informasi Yayasan</h2>
                <p className="text-sm text-gray-600">Isi data yayasan dengan lengkap</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Yayasan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Contoh: Yayasan Pendidikan Indonesia"
                  required
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Masukkan nama lengkap yayasan yang akan mengelola SPPG
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Yayasan'
                  )}
                </button>
                <Link
                  href="/cms/foundations"
                  className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CMSLayout>
  );
}
