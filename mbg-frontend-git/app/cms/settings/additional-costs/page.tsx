'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSettings,
  IconCurrencyDollar
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface AdditionalCost {
  id: string;
  name: string;
  description: string | null;
  unit_type: 'per_kg' | 'per_km' | 'flat' | 'percentage';
  default_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdditionalCostsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<AdditionalCost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user role
      const userRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.role);
      }

      const response = await fetch('/api/cms/additional-costs', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch additional costs');
      }

      const result = await response.json();
      setCosts(result.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Gagal memuat data biaya tambahan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus biaya tambahan ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/additional-costs?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      alert('Biaya tambahan berhasil dihapus');
      loadData();
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(error.message || 'Gagal menghapus biaya tambahan');
    }
  };

  const getUnitTypeLabel = (unitType: string) => {
    const labels: Record<string, string> = {
      per_kg: 'Per Kg',
      per_km: 'Per Km',
      flat: 'Flat',
      percentage: 'Persentase (%)'
    };
    return labels[unitType] || unitType;
  };

  const isAdmin = userRole === 'administrator';

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IconCurrencyDollar className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Referensi Biaya Tambahan</h1>
                  <p className="text-purple-100">Kelola jenis biaya tambahan untuk transaksi</p>
                </div>
              </div>
              <Link
                href="/cms/settings/additional-costs/new"
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium transition-colors flex items-center gap-2"
              >
                <IconPlus className="h-5 w-5" />
                Tambah Biaya
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <PageLoadingState message="Memuat data..." />
            ) : costs.length === 0 ? (
              <div className="p-12 text-center">
                <IconCurrencyDollar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Biaya Tambahan
                </h3>
                <p className="text-gray-600 mb-4">
                  Tambahkan referensi biaya tambahan untuk transaksi
                </p>
                <Link
                  href="/cms/settings/additional-costs/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  <IconPlus className="h-5 w-5" />
                  Tambah Biaya Pertama
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Nama Biaya
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                        Default Amount
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {costs.map((cost) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{cost.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {cost.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            Rp {cost.default_amount?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              cost.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {cost.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/cms/settings/additional-costs/${cost.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <IconEdit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(cost.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <IconTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IconSettings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Tentang Biaya Tambahan:</p>
                <p className="text-blue-800">
                  Biaya tambahan adalah biaya tetap yang dapat ditambahkan ke setiap transaksi penjualan.
                  Contoh: Ongkos Kirim, Biaya Admin, Biaya Kemasan, dll.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
