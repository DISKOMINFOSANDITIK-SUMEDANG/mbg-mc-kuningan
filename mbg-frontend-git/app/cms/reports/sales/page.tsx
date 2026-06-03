'use client';

import { useState, useEffect } from 'react';
import { IconShoppingCart, IconPlus, IconReceipt, IconTrendingUp, IconCalendar, IconEye, IconEdit, IconTrash, IconX, IconDownload, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  notes: string;
  supplier_id: string;
  offtaker_id?: string;
  transaction_type?: 'supplier' | 'offtaker'; // Added to distinguish transaction types
  sppgs: {
    id: string;
    name: string;
    address: string;
  };
  suppliers?: {
    id: string;
    name: string;
  };
  offtakers?: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface GroupedTransaction {
  sppgId: string;
  sppgName: string;
  sppgAddress: string;
  date: string;
  transactions: Transaction[];
  totalAmount: number;
}

export default function SalesReportPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSupplierId, setUserSupplierId] = useState<string | null>(null);
  const [userOfftakerId, setUserOfftakerId] = useState<string | null>(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportingGroupKey, setExportingGroupKey] = useState<string | null>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, dateFrom, dateTo, paymentStatus, searchQuery]);

  useEffect(() => {
    groupTransactions();
  }, [filteredTransactions]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('State Update:', {
      userRole,
      userSupplierId,
      transactionCount: transactions.length
    });
  }, [userRole, userSupplierId, transactions]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Get user info
      const userRes = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.role);
        
        // Get supplier_id if user is pemasok
        if (userData.role === 'pemasok') {
          // First, try to get supplierId from userData (JWT token)
          if (userData.supplierId) {
            console.log('Setting supplierId from JWT:', userData.supplierId);
            setUserSupplierId(userData.supplierId);
          } else {
            // Fallback: fetch from supplier_users table
            console.log('Fetching supplierId from supplier_users table');
            const supplierUserRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-users/by-user/${userData.id}`), {
              credentials: 'include',
            });
            if (supplierUserRes.ok) {
              const supplierUserData = await supplierUserRes.json();
              console.log('SupplierUser data:', supplierUserData);
              if (supplierUserData && supplierUserData.supplier_id) {
                setUserSupplierId(supplierUserData.supplier_id);
              }
            }
          }
        }
        
        // Get offtaker_id if user is offtaker
        if (userData.role === 'offtaker') {
          if (userData.offtakerId) {
            console.log('Setting offtakerId from JWT:', userData.offtakerId);
            setUserOfftakerId(userData.offtakerId);
          } else {
            // Fallback: fetch from offtaker_users table
            console.log('Fetching offtakerId from offtaker_users table');
            const offtakerUserRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/offtaker-users/by-user/${userData.id}`), {
              credentials: 'include',
            });
            if (offtakerUserRes.ok) {
              const offtakerUserData = await offtakerUserRes.json();
              console.log('OfftakerUser data:', offtakerUserData);
              if (offtakerUserData && offtakerUserData.offtaker_id) {
                setUserOfftakerId(offtakerUserData.offtaker_id);
              }
            }
          }
        }
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sales-transactions`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date filter
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(dateTo));
    }

    // Payment status filter
    if (paymentStatus !== 'all') {
      filtered = filtered.filter(t => t.payment_status === paymentStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.transaction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sppgs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.suppliers?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.offtakers?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const groupTransactions = () => {
    const grouped: { [key: string]: GroupedTransaction } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const key = `${transaction.sppgs.id}-${transaction.transaction_date}`;

      if (!grouped[key]) {
        grouped[key] = {
          sppgId: transaction.sppgs.id,
          sppgName: transaction.sppgs.name,
          sppgAddress: transaction.sppgs.address,
          date: date,
          transactions: [],
          totalAmount: 0
        };
      }

      grouped[key].transactions.push(transaction);
      grouped[key].totalAmount += parseFloat(transaction.total_amount.toString());
    });

    // Convert to array and sort by date (newest first)
    const groupedArray = Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.transactions[0].transaction_date);
      const dateB = new Date(b.transactions[0].transaction_date);
      return dateB.getTime() - dateA.getTime();
    });

    setGroupedTransactions(groupedArray);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allKeys = groupedTransactions.map((group, idx) => `${group.sppgId}-${group.date}-${idx}`);
    setExpandedGroups(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getTotalRevenue = () => {
    return filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
  };

  const getPaidRevenue = () => {
    return filteredTransactions
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
  };

  const getPendingRevenue = () => {
    return filteredTransactions
      .filter(t => t.payment_status === 'pending' || t.payment_status === 'partial')
      .reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Belum Lunas' },
      'partial': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dibayar Sebagian' },
      'paid': { bg: 'bg-green-100', text: 'text-green-700', label: 'Lunas' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-700', label: 'Batal' },
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} rounded-full text-sm font-medium`}>
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'cash': 'Tunai',
      'transfer': 'Transfer',
      'credit': 'Kredit'
    };
    return labels[method] || method;
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sales-transactions/${transactionToDelete.id}`),
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete transaction');
      }

      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      alert(error.message || 'Gagal menghapus transaksi');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (paymentStatus !== 'all') params.append('paymentStatus', paymentStatus);

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/reports/sales/export-excel?${params.toString()}`), {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export Excel');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      alert('Gagal mengekspor Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportGroupExcel = async (group: GroupedTransaction, groupKey: string) => {
    setExportingGroupKey(groupKey);
    try {
      // Get transaction IDs from this group
      const transactionIds = group.transactions.map(t => t.id);
      
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/reports/sales/export-excel`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to export Excel');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link with group info
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Format: Laporan_SPPG-Name_Date.xlsx
      const filename = `Laporan_${group.sppgName.replace(/\s+/g, '-')}_${group.transactions[0].transaction_date}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      alert('Gagal mengekspor Excel');
    } finally {
      setExportingGroupKey(null);
    }
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat laporan..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
              <p className="text-gray-600 mt-1">Pantau semua transaksi penjualan (Supplier & Offtaker) ke SPPG</p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={exporting || filteredTransactions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Mengekspor...
                </>
              ) : (
                <>
                  <IconDownload className="h-5 w-5" />
                  Export Excel
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconReceipt className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <IconTrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rp {getTotalRevenue().toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Lunas</p>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <IconShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                Rp {getPaidRevenue().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Filter Transaksi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Pembayaran
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Belum Lunas</option>
                  <option value="partial">Dibayar Sebagian</option>
                  <option value="paid">Lunas</option>
                  <option value="cancelled">Batal</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="No. transaksi atau SPPG..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(dateFrom || dateTo || paymentStatus !== 'all' || searchQuery) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setPaymentStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* Grouped Transactions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Daftar Transaksi</h2>
              {groupedTransactions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
                  >
                    Buka Semua
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  >
                    Tutup Semua
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat transaksi...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <IconShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada transaksi</p>
                {(dateFrom || dateTo || paymentStatus !== 'all' || searchQuery) && (
                  <p className="text-sm mt-2">Coba ubah filter pencarian</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {groupedTransactions.map((group, groupIdx) => {
                  const groupKey = `${group.sppgId}-${group.date}-${groupIdx}`;
                  const isExpanded = expandedGroups.has(groupKey);

                  return (
                    <div key={groupKey} className="border-b border-gray-200 last:border-b-0">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <IconCalendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">{group.sppgName}</div>
                            <div className="text-sm text-gray-500">{group.sppgAddress}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">{group.date}</span>
                              <span className="mx-2">•</span>
                              <span>{group.transactions.length} transaksi</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-lg font-bold text-green-700">
                              Rp {group.totalAmount.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportGroupExcel(group, groupKey);
                            }}
                            disabled={exportingGroupKey === groupKey}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export Excel Grup Ini"
                          >
                            {exportingGroupKey === groupKey ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            ) : (
                              <IconDownload className="h-5 w-5" />
                            )}
                          </button>
                          {isExpanded ? (
                            <IconChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <IconChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Group Content */}
                      {isExpanded && (
                        <div className="bg-gray-50">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No. Transaksi</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Penjual</th>
                                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {group.transactions.map((transaction) => (
                                  <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                      <div className="font-mono text-sm font-semibold text-gray-900">
                                        {transaction.transaction_number}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {formatDateTime(transaction.created_at)}
                                      </div>
                                      {transaction.transaction_type && (
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                          transaction.transaction_type === 'offtaker' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {transaction.transaction_type === 'offtaker' ? 'Offtaker' : 'Supplier'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="font-medium text-gray-900">
                                        {transaction.suppliers?.name || transaction.offtakers?.name || '-'}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {getPaymentMethodLabel(transaction.payment_method)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="font-bold text-gray-900">
                                        Rp {parseFloat(transaction.total_amount.toString()).toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {getPaymentStatusBadge(transaction.payment_status)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        {/* View button */}
                                        <Link
                                          href={`/cms/reports/sales/${transaction.id}`}
                                          className="inline-block p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Lihat Detail"
                                        >
                                          <IconEye className="h-5 w-5" />
                                        </Link>
                                        
                                        {/* Edit button - show if admin or if pemasok owns this transaction */}
                                        {(() => {
                                          const isAdmin = userRole === 'administrator';
                                          const isPemasokOwner = userRole === 'pemasok' && userSupplierId && transaction.supplier_id === userSupplierId;
                                          const shouldShow = isAdmin || isPemasokOwner;
                                          
                                          return shouldShow ? (
                                            <Link
                                              href={`/cms/sales/${transaction.id}/edit`}
                                              className="inline-block p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                              title="Edit Transaksi"
                                            >
                                              <IconEdit className="h-5 w-5" />
                                            </Link>
                                          ) : null;
                                        })()}
                                        
                                        {/* Delete button */}
                                        <button
                                          onClick={() => handleDeleteClick(transaction)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Hapus Transaksi"
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
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grand Total Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t-2 border-gray-300">
                  <div className="font-semibold text-gray-900">
                    GRAND TOTAL ({filteredTransactions.length} transaksi dari {groupedTransactions.length} grup):
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    Rp {getTotalRevenue().toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && transactionToDelete && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
                  <button
                    onClick={handleDeleteCancel}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={deleting}
                  >
                    <IconX className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Apakah Anda yakin ingin menghapus transaksi ini?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">No. Transaksi:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {transactionToDelete.transaction_number}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SPPG:</span>
                      <span className="font-medium text-gray-900">
                        {transactionToDelete.sppgs.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-gray-900">
                        Rp {parseFloat(transactionToDelete.total_amount.toString()).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span>{getPaymentStatusBadge(transactionToDelete.payment_status)}</span>
                    </div>
                  </div>
                  <p className="text-red-600 text-sm mt-4 font-medium">
                    ⚠️ Tindakan ini tidak dapat dibatalkan!
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={deleting}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={deleting}
                  >
                    {deleting ? 'Menghapus...' : 'Hapus'}
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
