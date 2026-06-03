'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconBuildingWarehouse,
  IconMapPin,
  IconPhone,
  IconMail,
  IconUser,
  IconPackage
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface Offtaker {
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
  product_count: number;
  created_at: string;
}

export default function OfftakersPage() {
  const router = useRouter();
  const [offtakers, setOfftakers] = useState<Offtaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOfftakers();
  }, [search, statusFilter]);

  const fetchOfftakers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/cms/offtakers?${params}`);
      const data = await response.json();
      setOfftakers(data.data || []);
    } catch (error) {
      console.error('Error fetching offtakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus offtaker ini?')) return;

    try {
      const response = await fetch(`/api/cms/offtakers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Offtaker berhasil dihapus');
        fetchOfftakers();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus offtaker');
      }
    } catch (error) {
      console.error('Error deleting offtaker:', error);
      alert('Terjadi kesalahan saat menghapus offtaker');
    }
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <IconBuildingWarehouse className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Daftar Offtaker</h1>
                  <p className="text-blue-100">Kelola data offtaker dan gudang distribusi</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/cms/offtakers/create')}
                className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <IconPlus className="w-5 h-5 mr-2" />
                Tambah Offtaker
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, PIC, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : offtakers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <IconBuildingWarehouse className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada data offtaker</p>
        </div>
      ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offtaker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gudang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offtakers.map((offtaker) => (
                  <tr key={offtaker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconBuildingWarehouse className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{offtaker.name}</div>
                          {offtaker.email && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <IconMail className="w-4 h-4 mr-1" />
                              {offtaker.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <IconMapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {offtaker.subdistrict}, {offtaker.district}
                        </div>
                        <div className="text-gray-500 mt-1">{offtaker.province}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 flex items-center">
                          <IconUser className="w-4 h-4 mr-1 text-gray-400" />
                          {offtaker.pic_name || '-'}
                        </div>
                        {offtaker.pic_phone && (
                          <div className="text-gray-500 flex items-center mt-1">
                            <IconPhone className="w-4 h-4 mr-1" />
                            {offtaker.pic_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {offtaker.warehouse_capacity ? (
                          <span className="font-medium">{offtaker.warehouse_capacity} kg</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <IconPackage className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="font-medium text-gray-900">{offtaker.product_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          offtaker.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {offtaker.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/cms/offtakers/${offtaker.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <IconEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(offtaker.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <IconTrash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
