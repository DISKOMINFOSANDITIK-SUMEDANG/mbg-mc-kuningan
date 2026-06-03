'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCalendar,
  IconUser,
  IconBuilding,
  IconReceipt,
  IconCreditCard,
  IconNotes,
  IconPackage
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface TransactionDetail {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  transaction_type: 'supplier' | 'offtaker';
  created_at: string;
  sppgs: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
  suppliers?: {
    id: string;
    name: string;
  };
  offtakers?: {
    id: string;
    name: string;
  };
  items?: TransactionItem[];
}

interface TransactionItem {
  id: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  price_per_unit?: number;
  subtotal: number;
  supplier_product?: {
    commodity: {
      name: string;
      unit: string;
    };
  };
  offtaker_product?: {
    supplier_product: {
      commodity: {
        name: string;
        unit: string;
      };
    };
  };
}

export default function SalesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadTransactionDetail(params.id as string);
    }
  }, [params.id]);

  const loadTransactionDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch from sales_transactions first
      const supplierRes = await fetch(
        buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sales-transactions/${id}`),
        { credentials: 'include' }
      );

      console.log('[Detail Page] Supplier API response:', {
        status: supplierRes.status,
        ok: supplierRes.ok
      });

      if (supplierRes.ok) {
        const data = await supplierRes.json();
        console.log('[Detail Page] Supplier data:', data);
        setTransaction({
          ...data,
          transaction_type: 'supplier',
          items: data.sales_transaction_items || []
        });
        setLoading(false);
        return;
      }

      // If not found, try offtaker_sales
      const offtakerRes = await fetch(
        buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/offtaker-sales/${id}`),
        { credentials: 'include' }
      );

      console.log('[Detail Page] Offtaker API response:', {
        status: offtakerRes.status,
        ok: offtakerRes.ok
      });

      if (offtakerRes.ok) {
        const responseData = await offtakerRes.json();
        console.log('[Detail Page] Offtaker response data:', responseData);
        const offtakerData = responseData.data || responseData;
        
        setTransaction({
          id: offtakerData.id,
          transaction_number: offtakerData.sale_number,
          transaction_date: offtakerData.sale_date,
          total_amount: offtakerData.total_amount,
          payment_status: offtakerData.payment_status,
          notes: offtakerData.notes,
          transaction_type: 'offtaker',
          created_at: offtakerData.created_at,
          sppgs: offtakerData.sppg || offtakerData.sppgs,
          offtakers: offtakerData.offtaker || offtakerData.offtakers,
          items: offtakerData.items || []
        });
        setLoading(false);
        return;
      } else {
        const errorData = await offtakerRes.json();
        console.error('[Detail Page] Offtaker API error:', errorData);
      }

      setError('Transaksi tidak ditemukan');
    } catch (error) {
      console.error('Error loading transaction:', error);
      setError('Gagal memuat detail transaksi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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
      <span className={`inline-flex items-center px-3 py-1 ${badge.bg} ${badge.text} rounded-full text-sm font-medium`}>
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string | undefined) => {
    if (!method) return '-';
    const labels: { [key: string]: string } = {
      'cash': 'Tunai',
      'transfer': 'Transfer',
      'credit': 'Kredit'
    };
    return labels[method] || method;
  };

  const getItemName = (item: TransactionItem) => {
    if (item.supplier_product?.commodity?.name) {
      return item.supplier_product.commodity.name;
    }
    if (item.offtaker_product?.supplier_product?.commodity?.name) {
      return item.offtaker_product.supplier_product.commodity.name;
    }
    return 'Produk';
  };

  const getItemUnit = (item: TransactionItem) => {
    if (item.unit) return item.unit;
    if (item.supplier_product?.commodity?.unit) {
      return item.supplier_product.commodity.unit;
    }
    if (item.offtaker_product?.supplier_product?.commodity?.unit) {
      return item.offtaker_product.supplier_product.commodity.unit;
    }
    return 'Kg';
  };

  const getItemPrice = (item: TransactionItem) => {
    return item.unit_price || item.price_per_unit || 0;
  };

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat detail transaksi..." />
      </CMSLayout>
    );
  }

  if (error || !transaction) {
    return (
      <CMSLayout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-4">{error || 'Transaksi tidak ditemukan'}</p>
            <Link
              href="/cms/reports/sales"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <IconArrowLeft className="h-5 w-5" />
              Kembali ke Laporan
            </Link>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat detail..." />}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/cms/reports/sales"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">Detail Transaksi Penjualan</h1>
                  <p className="text-green-100 mt-1">
                    {transaction.transaction_type === 'offtaker' ? 'Offtaker' : 'Supplier'} → SPPG
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-100">No. Transaksi</div>
                <div className="text-xl font-mono font-bold">{transaction.transaction_number}</div>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Date Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconCalendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Informasi Tanggal</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Tanggal Transaksi</div>
                    <div className="font-medium text-gray-900">{formatDate(transaction.transaction_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Dibuat Pada</div>
                    <div className="font-medium text-gray-900">{formatDateTime(transaction.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <IconUser className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Penjual</h3>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    {transaction.transaction_type === 'offtaker' ? 'Offtaker' : 'Supplier'}
                  </div>
                  <div className="font-medium text-gray-900">
                    {transaction.suppliers?.name || transaction.offtakers?.name || '-'}
                  </div>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                    transaction.transaction_type === 'offtaker' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {transaction.transaction_type === 'offtaker' ? 'Offtaker' : 'Supplier'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* SPPG Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IconBuilding className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">SPPG Tujuan</h3>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">{transaction.sppgs.name}</div>
                  <div className="text-sm text-gray-600">{transaction.sppgs.address}</div>
                  {transaction.sppgs.phone && (
                    <div className="text-sm text-gray-600 mt-1">📞 {transaction.sppgs.phone}</div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <IconCreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Pembayaran</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="mt-1">{getPaymentStatusBadge(transaction.payment_status)}</div>
                  </div>
                  {transaction.payment_method && (
                    <div>
                      <div className="text-sm text-gray-600">Metode</div>
                      <div className="font-medium text-gray-900">{getPaymentMethodLabel(transaction.payment_method)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <IconPackage className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Detail Produk</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Jumlah</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Harga Satuan</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{getItemName(item)}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {parseFloat(item.quantity.toString()).toLocaleString()} {getItemUnit(item)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          Rp {getItemPrice(item).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          Rp {parseFloat(item.subtotal.toString()).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada detail produk
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-900">
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-lg text-green-600">
                      Rp {parseFloat(transaction.total_amount.toString()).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <IconNotes className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Catatan</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{transaction.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Link
              href="/cms/reports/sales"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <IconArrowLeft className="h-5 w-5" />
              Kembali ke Laporan
            </Link>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
