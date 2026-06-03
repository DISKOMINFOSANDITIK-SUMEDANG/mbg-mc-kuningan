'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconEye, IconChefHat, IconUsers } from '@tabler/icons-react';
import { SPPG } from '@/lib/api-client';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import SPPGForm from '@/components/cms/sppgs/SPPGForm';
import SPPGSchoolsModal from '@/components/cms/sppgs/SPPGSchoolsModal';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

import { PageLoadingState } from '@/components/cms/shared/LoadingState';
export default function SPPGsPage() {
  const router = useRouter();
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSppg, setSelectedSppg] = useState<SPPG | null>(null);
  const [isSchoolsModalOpen, setIsSchoolsModalOpen] = useState(false);
  const [selectedSppgForSchools, setSelectedSppgForSchools] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  useEffect(() => {
    loadSppgs();
  }, [currentPage]);

  // Debounced search: reset to page 1 and reload
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadSppgs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSppgs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '20');
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}?${params.toString()}`), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch SPPGs');
      }
      
      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      
      setSppgs(data);
    } catch (error) {
      console.error('Error loading SPPGs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSppg(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const sppg = sppgs.find(s => s.id === id);
    console.log('handleEdit - Selected SPPG:', sppg);
    console.log('handleEdit - foundation_id:', sppg?.foundation_id, 'Type:', typeof sppg?.foundation_id);
    setSelectedSppg(sppg || null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus SPPG ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete SPPG');
      }

      // Reload SPPGs
      await loadSppgs();
    } catch (error: any) {
      console.error('Error deleting SPPG:', error);
      alert('Gagal menghapus SPPG: ' + error.message);
    }
  };

  const handleFormSuccess = () => {
    loadSppgs();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedSppg(null);
  };

  const handleView = (id: string) => {
    // Navigate to SPPG detail page
    router.push(`/cms/sppgs/${id}`);
  };

  const handleViewSchools = (sppg: SPPG) => {
    setSelectedSppgForSchools({ id: sppg.id, name: sppg.name });
    setIsSchoolsModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dapur Satelit Modular':
        return 'bg-blue-100 text-blue-800';
      case 'Dapur Konvensional':
        return 'bg-green-100 text-green-800';
      case 'Dapur Pusat':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data..." />
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SPPG (Dapur Penyedia)</h1>
            <p className="text-gray-600">Kelola data dapur penyedia makanan bergizi gratis</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <IconPlus className="h-5 w-5" />
            Tambah SPPG
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari SPPG..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <IconFilter className="h-5 w-5" />
              Filter
            </button>
          </div>
        </div>

        {/* SPPGs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID SPPG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama SPPG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapasitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penerima Manfaat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sppgs.map((sppg, index) => (
                  <tr key={sppg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + index + 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{sppg.id_sppg || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sppg.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(sppg.type)}`}>
                        {sppg.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {sppg.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(sppg.capacity || 0).toLocaleString()} porsi/hari
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewSchools(sppg)}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:from-blue-100 hover:to-green-100 transition-all group"
                      >
                        <IconUsers className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-xs text-gray-600">Sekolah</div>
                          <div className="text-sm font-bold text-gray-900">{sppg.school_count || 0}</div>
                        </div>
                        <div className="w-px h-6 bg-blue-300"></div>
                        <div className="text-left">
                          <div className="text-xs text-gray-600">Siswa</div>
                          <div className="text-sm font-bold text-green-700">{(sppg.beneficiary_count || 0).toLocaleString()}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleView(sppg.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Lihat Detail"
                        >
                          <IconEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(sppg.id)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sppg.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Hapus"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sppgs.length === 0 && !loading && (
            <div className="text-center py-12">
              <IconChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Tidak ada SPPG yang ditemukan' : 'Belum ada SPPG'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Coba ubah kata kunci pencarian Anda'
                  : 'Mulai dengan menambahkan SPPG pertama'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  Menampilkan {((pagination.page - 1) * pagination.limit) + 1} sampai{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
                  {pagination.total} SPPG
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let startPage = Math.max(1, pagination.page - 2);
                    if (startPage + 4 > pagination.totalPages) startPage = Math.max(1, pagination.totalPages - 4);
                    const pageNum = startPage + i;
                    if (pageNum > pagination.totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SPPG Form Modal */}
        <SPPGForm
          sppg={selectedSppg}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />

        {/* SPPG Schools Modal */}
        {selectedSppgForSchools && (
          <SPPGSchoolsModal
            isOpen={isSchoolsModalOpen}
            onClose={() => {
              setIsSchoolsModalOpen(false);
              setSelectedSppgForSchools(null);
            }}
            sppgId={selectedSppgForSchools.id}
            sppgName={selectedSppgForSchools.name}
          />
        )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}