'use client';

import { useEffect, useState } from 'react';
import { 
  IconFileInvoice,
  IconFilter,
  IconEye,
  IconDownload,
  IconCalendar,
  IconUser,
  IconBuildingStore,
  IconCash
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: string;
  transaction_date: string;
  seller_name: string;
  buyer_name: string;
  total_amount: number;
  additional_costs_total: number;
  grand_total: number;
  payment_status: string;
  payment_method: string;
  status: string;
  items_count: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter, paymentStatusFilter, startDate, endDate, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('page', page.toString());

      // Fetch both purchases and sales based on filter
      const fetchPurchases = !typeFilter || typeFilter === 'supplier_to_offtaker';
      const fetchSales = !typeFilter || typeFilter === 'offtaker_to_sppg';

      const promises = [];
      if (fetchPurchases) {
        promises.push(fetch(`/api/cms/offtaker-purchases?${params}`).then(res => res.json()));
      }
      if (fetchSales) {
        promises.push(fetch(`/api/cms/offtaker-sales?${params}`).then(res => res.json()));
      }

      const results = await Promise.all(promises);
      
      // Transform purchases to unified format
      let allTransactions: Transaction[] = [];
      
      if (fetchPurchases && results[0]?.data) {
        const purchases = results[0].data.map((p: any) => ({
          id: p.id,
          transaction_number: p.purchase_number,
          transaction_type: 'supplier_to_offtaker',
          transaction_date: p.purchase_date,
          seller_name: p.suppliers?.name || 'Pemasok',
          buyer_name: p.offtakers?.name || 'Offtaker',
          total_amount: p.subtotal || 0,
          additional_costs_total: p.additional_costs_total || 0,
          grand_total: p.total_amount || 0,
          payment_status: p.payment_status || 'pending',
          payment_method: p.payment_method || '-',
          status: p.status || 'pending',
          items_count: p.items?.length || 0
        }));
        allTransactions = [...allTransactions, ...purchases];
      }
      
      if (fetchSales) {
        const salesData = fetchPurchases ? results[1] : results[0];
        if (salesData?.data) {
          const sales = salesData.data.map((s: any) => ({
            id: s.id,
            transaction_number: s.sale_number,
            transaction_type: 'offtaker_to_sppg',
            transaction_date: s.sale_date,
            seller_name: s.offtakers?.name || 'Offtaker',
            buyer_name: s.sppgs?.name || 'SPPG',
            total_amount: s.subtotal || 0,
            additional_costs_total: s.additional_costs_total || 0,
            grand_total: s.total_amount || 0,
            payment_status: s.payment_status || 'pending',
            payment_method: s.payment_method || '-',
            status: s.status || 'pending',
            items_count: s.items?.length || 0
          }));
          allTransactions = [...allTransactions, ...sales];
        }
      }

      // Sort by date descending
      allTransactions.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      // Apply status filters client-side
      if (statusFilter) {
        allTransactions = allTransactions.filter(t => t.status === statusFilter);
      }
      if (paymentStatusFilter) {
        allTransactions = allTransactions.filter(t => t.payment_status === paymentStatusFilter);
      }

      setTransactions(allTransactions);
      setTotalPages(1); // For now, single page combining both
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier_to_offtaker':
        return 'Pembelian dari Pemasok';
      case 'offtaker_to_sppg':
        return 'Penjualan ke SPPG';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Dikembalikan' }
    };
    const config = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Lunas' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Belum Bayar' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' }
    };
    const config = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <IconFileInvoice className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
                <p className="text-indigo-100">Histori semua transaksi pembelian dan penjualan</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{transactions.length}</p>
            </div>
            <IconFileInvoice className="w-8 h-8 text-blue-600" />
          </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pembelian</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {transactions.filter(t => t.transaction_type === 'supplier_to_offtaker').length}
              </p>
            </div>
            <IconUser className="w-8 h-8 text-orange-600" />
          </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Penjualan</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {transactions.filter(t => t.transaction_type === 'offtaker_to_sppg').length}
              </p>
            </div>
            <IconBuildingStore className="w-8 h-8 text-green-600" />
          </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <IconFilter className="w-5 h-5 text-gray-400 mr-2" />
          <span className="font-medium text-gray-700">Filter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tipe</option>
            <option value="supplier_to_offtaker">Pembelian</option>
            <option value="offtaker_to_sppg">Penjualan</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Status Pembayaran</option>
            <option value="paid">Lunas</option>
            <option value="pending">Belum Bayar</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Dari Tanggal"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Sampai Tanggal"
          />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <IconFileInvoice className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada transaksi</p>
        </div>
      ) : (
        <>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No. Transaksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dari → Ke
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Pembayaran
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-600">
                          {transaction.transaction_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <IconCalendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.transaction_type === 'supplier_to_offtaker'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 font-medium">{transaction.seller_name}</div>
                        <div className="text-gray-500">→ {transaction.buyer_name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.items_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Rp {transaction.grand_total.toLocaleString('id-ID')}
                        </div>
                        {transaction.additional_costs_total > 0 && (
                          <div className="text-xs text-gray-500">
                            +Rp {transaction.additional_costs_total.toLocaleString('id-ID')} biaya
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getPaymentStatusBadge(transaction.payment_status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="Lihat Detail"
                        >
                          <IconEye className="w-5 h-5" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Download Invoice"
                        >
                          <IconDownload className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-2">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
