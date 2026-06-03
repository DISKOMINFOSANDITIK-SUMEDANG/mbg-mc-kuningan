'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import { IconBuilding, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface Foundation {
  id: string;
  name: string;
  created_at: string;
}

export default function EditFoundationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [foundation, setFoundation] = useState<Foundation | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFoundation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchFoundation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/foundations/${id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFoundation(data.foundation);
        setFormData({ name: data.foundation.name });
      } else {
        setError('Gagal memuat data yayasan');
      }
    } catch (error) {
      console.error('Error fetching foundation:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama yayasan harus diisi');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/cms/foundations/${id}`, {
        method: 'PUT',
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

  if (loading) {
    return (
      <CMSLayout>
        <div className="max-w-3xl mx-auto">
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data yayasan...</p>
          </div>
        </div>
      </CMSLayout>
    );
  }

  if (error && !foundation) {
    return (
      <CMSLayout>
        <div className="max-w-3xl mx-auto">
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <IconBuilding className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Yayasan Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/cms/foundations"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali ke Daftar Yayasan
            </Link>
          </div>
        </div>
      </CMSLayout>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Yayasan</h1>
            <p className="mt-1 text-sm text-gray-600">
              Perbarui informasi yayasan
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
                <p className="text-sm text-gray-600">Perbarui data yayasan dengan lengkap</p>
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

              {foundation && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Tanggal Dibuat</p>
                  <p className="text-sm text-gray-900">
                    {new Date(foundation.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

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
                    'Simpan Perubahan'
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
