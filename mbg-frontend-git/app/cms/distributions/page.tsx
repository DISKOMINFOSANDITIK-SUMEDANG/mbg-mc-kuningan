'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconTrash, IconEye, IconCalendar, IconTruck, IconClipboardList, IconBuilding, IconUsers, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import DistributionForm from '@/components/cms/distributions/DistributionForm';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import { setUserData } from '@/lib/auth/cookies';

interface Distribution {
  id: string;
  sppg_id: string;
  sppg_name: string;
  sppg_type: string;
  sppg_location: string;
  distribution_date: string;
  recipient_type: 'school' | 'group';
  recipient_id: string;
  recipient_name: string;
  recipient_info: {
    level?: string;
    district?: string;
    village?: string;
    description?: string;
  };
  menu_id: string;
  menu_name: string;
  menu_calories: number;
  menu_image?: string;
  portions: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface GroupedDistribution {
  key: string; // sppg_id + date
  sppg_id: string;
  sppg_name: string;
  sppg_type: string;
  sppg_location: string;
  distribution_date: string;
  total_portions: number;
  total_recipients: number;
  menus: Array<{
    id: string;
    name: string;
    calories: number;
    image?: string;
  }>;
  recipients: Array<{
    type: 'school' | 'group';
    id: string;
    name: string;
    info: {
      level?: string;
      district?: string;
      village?: string;
      description?: string;
    };
    portions: number;
    notes?: string;
  }>;
  distributions: Distribution[]; // Original distributions for modal
}

export default function DistributionsPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [groupedDistributions, setGroupedDistributions] = useState<GroupedDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDistributions, setFilteredDistributions] = useState<GroupedDistribution[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGroupedDistribution, setSelectedGroupedDistribution] = useState<GroupedDistribution | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const loadUserData = async () => {
    try {
      // Get user data from localStorage first for quick display
      const cachedUserData = localStorage.getItem('user_data');
      if (cachedUserData) {
        try {
          setUser(JSON.parse(cachedUserData));
        } catch (parseError) {
          console.warn('Invalid cached user_data, clearing cache:', parseError);
          localStorage.removeItem('user_data');
        }
      }

      // Then fetch fresh data from backend
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CMS_AUTH_ME), {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setUserData(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDistributions = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (searchQuery) params.set('q', searchQuery);
      if (dateFilter) params.set('date', dateFilter);
      if (recipientTypeFilter) params.set('recipient_type', recipientTypeFilter);

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_DISTRIBUTIONS}?${params.toString()}`), {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch distributions');
      }
      const result = await response.json();
      const data = result.data ?? [];

      if (result.pagination) {
        setTotalPages(result.pagination.totalPages || 1);
        setTotalItems(result.pagination.total || 0);
        setCurrentPage(result.pagination.page || 1);
      }
      
      // Filter distributions based on user role (client-side additional filter)
      let filteredData = data;
      if (user?.role === 'sekolah' && user?.school_id) {
        filteredData = data.filter((dist: any) => 
          dist.recipient_type === 'school' && dist.recipient_id === user.school_id
        );
      }
      
      setDistributions(filteredData);
      
      // Group distributions by SPPG and date
      const grouped = groupDistributionsByDate(filteredData);
      setGroupedDistributions(grouped);
      setFilteredDistributions(grouped);
    } catch (error) {
      console.error('Error loading distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupDistributionsByDate = (distributions: Distribution[]): GroupedDistribution[] => {
    const grouped = new Map<string, GroupedDistribution>();

    distributions.forEach(dist => {
      const key = `${dist.sppg_id}-${dist.distribution_date}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          sppg_id: dist.sppg_id,
          sppg_name: dist.sppg_name,
          sppg_type: dist.sppg_type,
          sppg_location: dist.sppg_location,
          distribution_date: dist.distribution_date,
          total_portions: 0,
          total_recipients: 0,
          menus: [],
          recipients: [],
          distributions: []
        });
      }

      const group = grouped.get(key)!;
      
      // Add distribution to the group
      group.distributions.push(dist);
      
      // Add menu if not already present
      const menuExists = group.menus.find(m => m.id === dist.menu_id);
      if (!menuExists) {
        group.menus.push({
          id: dist.menu_id,
          name: dist.menu_name,
          calories: dist.menu_calories,
          image: dist.menu_image
        });
      }
      
      // Add recipient if not already present
      const recipientExists = group.recipients.find(r => r.id === dist.recipient_id);
      if (!recipientExists) {
        group.recipients.push({
          type: dist.recipient_type,
          id: dist.recipient_id,
          name: dist.recipient_name,
          info: dist.recipient_info,
          portions: dist.portions,
          notes: dist.notes
        });
        group.total_recipients += 1;
      } else {
        // Update portions if recipient already exists
        recipientExists.portions += dist.portions;
      }
      
      group.total_portions += dist.portions;
    });

    return Array.from(grouped.values()).sort((a, b) => 
      new Date(b.distribution_date).getTime() - new Date(a.distribution_date).getTime()
    );
  };

  useEffect(() => {
    // Filters are now applied server-side; just sync filtered view
    setFilteredDistributions(groupedDistributions);
  }, [groupedDistributions]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadDistributions(1);
    }
  }, [user]);

  // Reload when filters change (debounced for search)
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadDistributions(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, dateFilter, recipientTypeFilter]);

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!confirm('Apakah Anda yakin ingin menghapus distribusi ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_DISTRIBUTIONS}/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete distribution');
      }

      await loadDistributions(currentPage);
    } catch (error: any) {
      console.error('Error deleting distribution:', error);
      alert('Gagal menghapus distribusi: ' + error.message);
    }
  };

  const handleFormSuccess = () => {
    loadDistributions(currentPage);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleViewDetail = (groupedDistribution: GroupedDistribution) => {
    setSelectedGroupedDistribution(groupedDistribution);
    setIsDetailModalOpen(true);
  };

  const handleDeleteGroup = async (groupedDistribution: GroupedDistribution, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus semua distribusi untuk ${groupedDistribution.sppg_name} pada tanggal ${formatDate(groupedDistribution.distribution_date)}?`)) {
      return;
    }

    try {
      // Delete all distributions in the group
      const deletePromises = groupedDistribution.distributions.map(dist =>
        fetch(buildApiUrl(`${API_ENDPOINTS.CMS_DISTRIBUTIONS}/${dist.id}`), {
          method: 'DELETE',
          credentials: 'include',
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete distribution');
        }
      }

      await loadDistributions(currentPage);
    } catch (error: any) {
      console.error('Error deleting distribution group:', error);
      alert('Gagal menghapus grup distribusi: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRecipientTypeLabel = (type: string) => {
    return type === 'school' ? 'Sekolah' : 'Kelompok';
  };

  const getRecipientTypeColor = (type: string) => {
    return type === 'school' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  if (loading && distributions.length === 0) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data distribusi..." />
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <IconTruck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Distribusi Harian</h1>
                  <p className="text-orange-100 text-sm mt-0.5">
                    {totalItems > 0 ? `${totalItems} grup distribusi` : 'Kelola data distribusi porsi harian'}
                  </p>
                </div>
              </div>
              {user?.role !== 'sekolah' && (
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-orange-700 rounded-xl font-semibold text-sm hover:bg-orange-50 transition-colors shadow-sm"
                >
                  <IconPlus className="h-4 w-4" />
                  Tambah Distribusi
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{totalItems}</div>
                <div className="text-orange-100 text-xs mt-0.5">Total Distribusi</div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">
                  {filteredDistributions.reduce((sum, d) => sum + d.total_portions, 0).toLocaleString('id-ID')}
                </div>
                <div className="text-orange-100 text-xs mt-0.5">Total Porsi</div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">
                  {filteredDistributions.reduce((sum, d) => sum + d.total_recipients, 0).toLocaleString('id-ID')}
                </div>
                <div className="text-orange-100 text-xs mt-0.5">Total Penerima</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari distribusi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div className="relative">
                <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <select
                value={recipientTypeFilter}
                onChange={(e) => setRecipientTypeFilter(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
              >
                <option value="">Semua Penerima</option>
                <option value="school">Sekolah</option>
                <option value="group">Kelompok</option>
              </select>
              {(searchQuery || dateFilter || recipientTypeFilter) && (
                <button
                  onClick={() => { setSearchQuery(''); setDateFilter(''); setRecipientTypeFilter(''); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <IconX className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Distributions Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredDistributions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <IconTruck className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {searchQuery || dateFilter || recipientTypeFilter ? 'Tidak ditemukan' : 'Belum ada distribusi'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || dateFilter || recipientTypeFilter
                    ? 'Coba ubah filter pencarian Anda'
                    : 'Mulai dengan menambahkan distribusi pertama'}
                </p>
                {!searchQuery && !dateFilter && !recipientTypeFilter && user?.role !== 'sekolah' && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    <IconPlus className="h-4 w-4" />
                    Tambah Distribusi Pertama
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="block md:hidden divide-y divide-gray-50">
                  {filteredDistributions.map((distribution) => (
                    <div key={distribution.key} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{distribution.sppg_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{distribution.sppg_type} · {distribution.sppg_location}</p>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0 ml-2">
                          {formatDate(distribution.distribution_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                          {distribution.total_portions.toLocaleString('id-ID')} porsi
                        </span>
                        <span className="text-xs text-gray-500">{distribution.total_recipients} penerima</span>
                        <span className="text-xs text-gray-500">{distribution.menus.length} menu</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleViewDetail(distribution)} className="flex-1 py-1.5 text-xs text-center bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">Lihat Detail</button>
                        {user?.role !== 'sekolah' && (
                          <>
                            <button onClick={(e) => handleDeleteGroup(distribution, e)} className="flex-1 py-1.5 text-xs text-center bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">Hapus</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SPPG</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Porsi</th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredDistributions.map((distribution) => (
                        <tr key={distribution.key} className="group hover:bg-orange-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconCalendar className="w-4 h-4 text-orange-500" />
                              </div>
                              <span className="text-sm text-gray-900">{formatDate(distribution.distribution_date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">{distribution.sppg_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{distribution.sppg_type} · {distribution.sppg_location}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{distribution.total_recipients} penerima</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {distribution.recipients.slice(0, 2).map((r, idx) => (
                                <span key={idx} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRecipientTypeColor(r.type)}`}>
                                  {getRecipientTypeLabel(r.type)}
                                </span>
                              ))}
                              {distribution.recipients.length > 2 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  +{distribution.recipients.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{distribution.menus.length} menu</p>
                            {distribution.menus.slice(0, 1).map((menu, idx) => (
                              <p key={idx} className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{menu.name}</p>
                            ))}
                            {distribution.menus.length > 1 && (
                              <p className="text-xs text-gray-400">+{distribution.menus.length - 1} lainnya</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold bg-orange-50 text-orange-700">
                              {distribution.total_portions.toLocaleString('id-ID')}
                              <span className="text-xs font-normal">porsi</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewDetail(distribution)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Lihat Detail"
                              >
                                <IconEye className="h-4 w-4" />
                              </button>
                              {user?.role !== 'sekolah' && (
                                <>
                                  <button
                                    onClick={(e) => handleDeleteGroup(distribution, e)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Halaman <span className="font-medium text-gray-900">{currentPage}</span> dari <span className="font-medium text-gray-900">{totalPages}</span>
                  {' '}· {totalItems} distribusi
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setCurrentPage(prev => prev - 1); loadDistributions(currentPage - 1); }}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => { setCurrentPage(page); loadDistributions(page); }}
                        className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-orange-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setCurrentPage(prev => prev + 1); loadDistributions(currentPage + 1); }}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Distribution Form Modal */}
          <DistributionForm
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />

          {/* Distribution Detail Modal */}
          {isDetailModalOpen && selectedGroupedDistribution && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <IconTruck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Detail Distribusi</h2>
                      <p className="text-orange-100 text-xs mt-0.5">
                        {selectedGroupedDistribution.sppg_name} · {formatDate(selectedGroupedDistribution.distribution_date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <IconX className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <IconUsers className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-700">{selectedGroupedDistribution.total_recipients}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Penerima</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <IconClipboardList className="h-6 w-6 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-700">{selectedGroupedDistribution.menus.length}</p>
                      <p className="text-xs text-green-600 mt-0.5">Menu</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <IconTruck className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-orange-700">{selectedGroupedDistribution.total_portions.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-orange-600 mt-0.5">Porsi</p>
                    </div>
                  </div>

                  {/* SPPG Info */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Informasi SPPG</h3>
                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Nama SPPG</p>
                        <p className="text-sm font-medium text-gray-900">{selectedGroupedDistribution.sppg_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tipe</p>
                        <p className="text-sm font-medium text-gray-900">{selectedGroupedDistribution.sppg_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lokasi</p>
                        <p className="text-sm font-medium text-gray-900">{selectedGroupedDistribution.sppg_location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tanggal</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedGroupedDistribution.distribution_date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menus */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu Didistribusikan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedGroupedDistribution.menus.map((menu) => (
                        <div key={menu.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          {menu.image ? (
                            <img src={menu.image} alt={menu.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconClipboardList className="w-6 h-6 text-orange-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{menu.name}</p>
                            <p className="text-xs text-gray-500">{menu.calories} kkal</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Daftar Penerima</h3>
                    <div className="space-y-2">
                      {selectedGroupedDistribution.recipients.map((recipient, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${recipient.type === 'school' ? 'bg-blue-100' : 'bg-green-100'}`}>
                              {recipient.type === 'school'
                                ? <IconBuilding className="w-4 h-4 text-blue-600" />
                                : <IconUsers className="w-4 h-4 text-green-600" />
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{recipient.name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRecipientTypeColor(recipient.type)}`}>
                                  {getRecipientTypeLabel(recipient.type)}
                                </span>
                              </div>
                              {recipient.type === 'school' && recipient.info.level && (
                                <p className="text-xs text-gray-500 mt-0.5">{recipient.info.level}{recipient.info.district ? ` · ${recipient.info.district}` : ''}</p>
                              )}
                              {recipient.notes && (
                                <p className="text-xs text-gray-400 mt-0.5 italic">"{recipient.notes}"</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-orange-600">{recipient.portions.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-gray-500">porsi</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
