'use client';

import { useState, useEffect } from 'react';
import { IconPackage, IconPlus, IconMinus, IconTrendingUp, IconTrendingDown, IconRefresh, IconEdit, IconTrash, IconX, IconSearch, IconFilter, IconDownload, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface StockData {
  supplier_product_id: string;
  commodity_name: string;
  supplier_name?: string;
  unit: string;
  initial_stock: number;
  total_in: number;
  total_out: number;
  current_stock: number;
}

interface StockMovement {
  id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: string | number;
  reference_type: string;
  notes: string;
  reason?: string;
  movement_date: string;
  created_at: string;
  is_expirable?: boolean;
  expired_from?: string;
  expired_until?: string;
  suppliers?: {
    id: string;
    name: string;
  };
  supplier_products: {
    commodities: {
      name: string;
      unit: string;
    };
  };
}

interface Supplier {
  id: string;
  name: string;
  address?: string;
}

export default function StockReportPage() {
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [userRole, setUserRole] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedSupplierId, dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user role
      const meResponse = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      let currentUserRole = userRole;
      
      if (meResponse.ok) {
        const meData = await meResponse.json();
        currentUserRole = meData.role;
        setUserRole(meData.role);
        
        // Load suppliers for admin
        if (meData.role === 'administrator' && suppliers.length === 0) {
          const suppliersResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers?limit=1000`), {
            credentials: 'include',
          });
          
          if (suppliersResponse.ok) {
            const suppliersData = await suppliersResponse.json();
            const suppliersArray = Array.isArray(suppliersData) ? suppliersData : (suppliersData.data || []);
            setSuppliers(suppliersArray);
          }
        }
      }
      
      // Build query params for filters
      const params = new URLSearchParams();
      // Only send supplier_id filter for administrator role
      if (selectedSupplierId && currentUserRole === 'administrator') {
        params.append('supplier_id', selectedSupplierId);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      
      const queryString = params.toString();
      const movementsUrl = `${API_ENDPOINTS.CMS_BASE}/stock/movements${queryString ? `?${queryString}` : ''}`;
      const productsUrl = `${API_ENDPOINTS.CMS_BASE}/supplier-products?limit=1000${queryString ? `&${queryString}` : ''}`;
      
      // Load stock data (we'll calculate from supplier_products + movements)
      const [productsRes, movementsRes] = await Promise.all([
        fetch(buildApiUrl(productsUrl), {
          credentials: 'include',
        }),
        fetch(buildApiUrl(movementsUrl), {
          credentials: 'include',
        })
      ]);

      if (productsRes.ok && movementsRes.ok) {
        const productsRaw = await productsRes.json();
        const movementsRaw = await movementsRes.json();
        const productsArray = Array.isArray(productsRaw) ? productsRaw : (productsRaw.data || []);
        const movementsArray = Array.isArray(movementsRaw) ? movementsRaw : (movementsRaw.data || []);

        // Calculate current stock for each product
        const stockCalculations: StockData[] = productsArray.map((product: any) => {
          const productMovements = movementsArray.filter((m: any) => 
            m.supplier_product_id === product.id
          );

          const total_in = productMovements
            .filter((m: any) => m.movement_type === 'in')
            .reduce((sum: number, m: any) => sum + parseFloat(m.quantity), 0);

          const total_out = productMovements
            .filter((m: any) => m.movement_type === 'out')
            .reduce((sum: number, m: any) => sum + parseFloat(m.quantity), 0);

          return {
            supplier_product_id: product.id,
            commodity_name: product.commodities.name,
            supplier_name: product.suppliers?.name,
            unit: product.commodities.unit,
            initial_stock: parseFloat(product.stock),
            total_in,
            total_out,
            current_stock: parseFloat(product.stock) + total_in - total_out
          };
        });

        setStockData(stockCalculations);

        // Get recent 10 movements
        const sortedMovements = [...movementsArray].sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10);

        setRecentMovements(sortedMovements);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stockData.filter(item =>
    item.commodity_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalStockValue = () => {
    // This is a simple count, could be enhanced with pricing
    return filteredStock.reduce((sum, item) => sum + item.current_stock, 0);
  };

  const getLowStockCount = () => {
    return filteredStock.filter(item => item.current_stock < 10).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReferenceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'manual_in': 'Stok Masuk Manual',
      'manual_out': 'Stok Keluar Manual',
      'sales_transaction': 'Penjualan',
      'adjustment': 'Penyesuaian',
      'initial_stock': 'Stok Awal',
      'damaged': 'Barang Rusak',
      'expired': 'Kadaluarsa',
      'lost': 'Hilang',
      'purchase': 'Pembelian',
      'return': 'Retur',
      'production': 'Produksi'
    };
    return labels[type] || type;
  };

  const parseNotesForDisplay = (notes: string) => {
    if (!notes) return '';
    
    // Parse format "reason: notes" jika ada
    const reasonLabels: { [key: string]: string } = {
      'adjustment': 'Penyesuaian',
      'damaged': 'Barang Rusak',
      'expired': 'Kadaluarsa',
      'lost': 'Hilang'
    };
    
    // Check if notes contains English reason prefix
    for (const [key, label] of Object.entries(reasonLabels)) {
      if (notes.toLowerCase().startsWith(key + ':')) {
        const actualNotes = notes.substring(key.length + 1).trim();
        return `${label}: ${actualNotes}`;
      }
    }
    
    return notes;
  };

  const handleDeleteClick = (movement: StockMovement, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMovement(movement);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMovement) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements/${selectedMovement.id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menghapus pergerakan stok');
      }

      alert('Pergerakan stok berhasil dihapus!');
      setShowDeleteModal(false);
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error deleting movement:', error);
      alert(error.message || 'Gagal menghapus pergerakan stok');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat laporan..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Laporan Stok</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Pantau stok produk secara real-time</p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {/* <Link
                href="/cms/stock/in"
                className="px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all hover:shadow-md flex items-center gap-2 text-sm md:text-base"
              >
                <IconPlus className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Tambah Stok</span>
                <span className="sm:hidden">Masuk</span>
              </Link>
              <Link
                href="/cms/stock/out"
                className="px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-all hover:shadow-md flex items-center gap-2 text-sm md:text-base"
              >
                <IconMinus className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Keluar Stok</span>
                <span className="sm:hidden">Keluar</span>
              </Link> */}
              <button
                onClick={loadData}
                className="px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all hover:shadow-sm flex items-center gap-2 text-sm md:text-base"
              >
                <IconRefresh className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden md:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 md:p-6 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <IconFilter className="h-5 w-5 text-gray-600" />
                <h3 className="text-sm md:text-base font-semibold text-gray-700">Filter Data</h3>
                {(selectedSupplierId || dateFrom || dateTo) && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                {showFilters ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            
            {showFilters && (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Supplier Filter - Admin Only */}
                  {userRole === 'administrator' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pemasok
                      </label>
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      >
                        <option value="">Semua Pemasok</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                  
                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                {(selectedSupplierId || dateFrom || dateTo) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedSupplierId('');
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 mb-1">Total Produk</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{filteredStock.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Item tersedia</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <IconPackage className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 mb-1">Stok Menipis</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600">{getLowStockCount()}</p>
                  <p className="text-xs text-gray-500 mt-1">Stok {'<'} 10 unit</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <IconTrendingDown className="h-7 w-7 md:h-8 md:w-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 mb-1">Pergerakan Stok</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">{recentMovements.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Transaksi terakhir</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <IconTrendingUp className="h-7 w-7 md:h-8 md:w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Current Stock Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Stok Saat Ini</h2>
                {filteredStock.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Menampilkan <span className="font-semibold text-gray-900">{filteredStock.length}</span> produk
                  </div>
                )}
              </div>
              
              {/* Search */}
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk berdasarkan nama..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 md:p-16 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat data stok...</p>
                <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
              </div>
            ) : filteredStock.length === 0 ? (
              <div className="p-12 md:p-16 text-center text-gray-500">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <IconPackage className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada data stok</h3>
                <p className="text-sm text-gray-500 mb-6">Belum ada produk atau tidak ditemukan dengan pencarian Anda</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Hapus Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 md:px-6 py-3.5 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Produk</th>
                      {userRole === 'administrator' && (
                        <th className="px-4 md:px-6 py-3.5 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Pemasok</th>
                      )}
                      <th className="px-4 md:px-6 py-3.5 text-right text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Stok Awal</th>
                      <th className="px-4 md:px-6 py-3.5 text-right text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Masuk</th>
                      <th className="px-4 md:px-6 py-3.5 text-right text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Keluar</th>
                      <th className="px-4 md:px-6 py-3.5 text-right text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Stok Saat Ini</th>
                      <th className="px-4 md:px-6 py-3.5 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStock.map((item, index) => (
                      <tr key={item.supplier_product_id} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 md:px-6 py-3.5 md:py-4">
                          <div className="font-semibold text-gray-900 text-sm md:text-base">{item.commodity_name}</div>
                          <div className="text-xs md:text-sm text-gray-500 mt-0.5">Satuan: {item.unit}</div>
                        </td>
                        {userRole === 'administrator' && (
                          <td className="px-4 md:px-6 py-3.5 md:py-4">
                            <div className="text-xs md:text-sm text-gray-700">{item.supplier_name || '-'}</div>
                          </td>
                        )}
                        <td className="px-4 md:px-6 py-3.5 md:py-4 text-right text-gray-600 text-xs md:text-sm">
                          {item.initial_stock.toLocaleString()} <span className="text-gray-400">{item.unit}</span>
                        </td>
                        <td className="px-4 md:px-6 py-3.5 md:py-4 text-right">
                          <span className="text-green-600 font-semibold text-xs md:text-sm">+{item.total_in.toLocaleString()}</span>
                          <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 md:px-6 py-3.5 md:py-4 text-right">
                          <span className="text-orange-600 font-semibold text-xs md:text-sm">-{item.total_out.toLocaleString()}</span>
                          <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 md:px-6 py-3.5 md:py-4 text-right">
                          <span className="font-bold text-base md:text-lg text-gray-900">
                            {item.current_stock.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs md:text-sm ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 md:px-6 py-3.5 md:py-4 text-center">
                          {item.current_stock === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs md:text-sm font-medium">
                              <IconX className="h-3 w-3" />
                              Habis
                            </span>
                          ) : item.current_stock < 10 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs md:text-sm font-medium">
                              <IconAlertCircle className="h-3 w-3" />
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm font-medium">
                              <IconCheck className="h-3 w-3" />
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Movements */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Riwayat Pergerakan Stok Terakhir</h2>
                {recentMovements.length > 0 && (
                  <span className="text-xs md:text-sm text-gray-600">
                    10 transaksi terakhir
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-12 md:p-16 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat riwayat...</p>
              </div>
            ) : recentMovements.length === 0 ? (
              <div className="p-12 md:p-16 text-center text-gray-500">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <IconTrendingUp className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada pergerakan stok</h3>
                <p className="text-sm text-gray-500">Transaksi stok akan muncul di sini</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentMovements.map((movement, index) => (
                  <div
                    key={movement.id}
                    className={`block p-4 md:p-5 hover:bg-green-50 transition-all relative ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        movement.movement_type === 'in' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {movement.movement_type === 'in' ? (
                          <IconPlus className="h-5 w-5 text-green-600" />
                        ) : (
                          <IconMinus className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/cms/stock/${movement.id}`}
                              className="hover:text-green-600 transition-colors"
                            >
                              <h4 className="font-semibold text-gray-900">
                                {movement.supplier_products.commodities.name}
                              </h4>
                              {userRole === 'administrator' && movement.suppliers && (
                                <p className="text-sm text-blue-600 font-medium mt-0.5">
                                  {movement.suppliers.name}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                {getReferenceTypeLabel(movement.reference_type)}
                              </p>
                              {movement.notes && (
                                <p className="text-sm text-gray-500 mt-1">{parseNotesForDisplay(movement.notes)}</p>
                              )}
                              {/* Expiry Badge */}
                              {movement.is_expirable && movement.expired_until && (
                                <div className="mt-2">
                                  {new Date(movement.expired_until) < new Date() ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                      <IconAlertCircle className="h-3 w-3" />
                                      Kadaluarsa: {new Date(movement.expired_until).toLocaleDateString('id-ID')}
                                    </span>
                                  ) : new Date(movement.expired_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                      <IconAlertCircle className="h-3 w-3" />
                                      Mendekati kadaluarsa: {new Date(movement.expired_until).toLocaleDateString('id-ID')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                      Kadaluarsa: {new Date(movement.expired_until).toLocaleDateString('id-ID')}
                                    </span>
                                  )}
                                </div>
                              )}
                            </Link>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              movement.movement_type === 'in' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {movement.movement_type === 'in' ? '+' : '-'}
                              {Number(movement.quantity).toLocaleString()} {movement.supplier_products.commodities.unit}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(movement.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedMovement && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <IconTrash className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">
                      Apakah Anda yakin ingin menghapus pergerakan stok ini?
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Produk: <span className="font-medium">{selectedMovement.supplier_products.commodities.name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Jumlah: <span className="font-medium">
                        {selectedMovement.movement_type === 'in' ? '+' : '-'}
                        {Number(selectedMovement.quantity).toLocaleString()} {selectedMovement.supplier_products.commodities.unit}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Perhatian:</strong> Stok produk akan disesuaikan secara otomatis setelah penghapusan.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:bg-gray-300"
                >
                  {submitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ClientOnly>
    </CMSLayout>
  );
}
