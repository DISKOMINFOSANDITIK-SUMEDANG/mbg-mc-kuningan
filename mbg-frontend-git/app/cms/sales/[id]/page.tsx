'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconReceipt, IconBuilding, IconCalendar, IconCreditCard, IconNotes, IconPackage, IconEdit } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface TransactionItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  supplier_products: {
    id: string;
    commodities: {
      id: string;
      name: string;
      unit: string;
    };
  };
}

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  notes: string;
  supplier_id: string;
  sppgs?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  suppliers?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
  sales_transaction_items: TransactionItem[];
}

export default function SalesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSupplierId, setUserSupplierId] = useState<string | null>(null);

  useEffect(() => {
    loadTransaction();
  }, [params.id]);

  const loadTransaction = async () => {
    setLoading(true);
    setError(null);
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
          const supplierUserRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-users/by-user/${userData.id}`), {
            credentials: 'include',
          });
          if (supplierUserRes.ok) {
            const supplierUserData = await supplierUserRes.json();
            if (supplierUserData && supplierUserData.supplier_id) {
              setUserSupplierId(supplierUserData.supplier_id);
            }
          }
        }
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sales-transactions/${params.id}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransaction(data);
      } else {
        setError('Transaksi tidak ditemukan');
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
      setError('Gagal memuat data transaksi');
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
      <span className={`px-4 py-2 ${badge.bg} ${badge.text} rounded-lg text-sm font-semibold`}>
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
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/cms/reports/sales"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Detail Transaksi</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700">{error || 'Transaksi tidak ditemukan'}</p>
            <Link
              href="/cms/reports/sales"
              className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
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
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/cms/reports/sales"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Detail Transaksi Penjualan</h1>
                <p className="text-gray-600 mt-1">
                  No. Transaksi: <span className="font-mono font-semibold">{transaction.transaction_number}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Edit button - show if admin or if pemasok owns this transaction */}
                {(userRole === 'administrator' || 
                  (userRole === 'pemasok' && userSupplierId && transaction.supplier_id === userSupplierId)) && (
                  <Link
                    href={`/cms/sales/${params.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <IconEdit className="h-5 w-5" />
                    Edit
                  </Link>
                )}
                {getPaymentStatusBadge(transaction.payment_status)}
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* SPPG Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IconBuilding className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">SPPG Tujuan</h3>
                </div>
                {transaction.sppgs ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nama SPPG</p>
                      <p className="font-semibold text-gray-900">{transaction.sppgs.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Alamat</p>
                      <p className="text-gray-900">{transaction.sppgs.address}</p>
                    </div>
                    {transaction.sppgs.phone && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Telepon</p>
                        <p className="text-gray-900">{transaction.sppgs.phone}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Data SPPG tidak tersedia</p>
                )}
              </div>

              {/* Supplier Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconBuilding className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Pemasok</h3>
                </div>
                {transaction.suppliers ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nama Pemasok</p>
                      <p className="font-semibold text-gray-900">{transaction.suppliers.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Alamat</p>
                      <p className="text-gray-900">{transaction.suppliers.address}</p>
                    </div>
                    {transaction.suppliers.phone && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Telepon</p>
                        <p className="text-gray-900">{transaction.suppliers.phone}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Data pemasok tidak tersedia</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <IconCreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Informasi Pembayaran</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Metode Pembayaran</span>
                    <span className="font-semibold text-gray-900">{getPaymentMethodLabel(transaction.payment_method)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Status Pembayaran</span>
                    <span>{getPaymentStatusBadge(transaction.payment_status)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 px-4 rounded-lg mt-2">
                    <span className="font-semibold text-gray-900">Total Pembayaran</span>
                    <span className="font-bold text-xl text-green-700">
                      Rp {parseFloat(transaction.total_amount.toString()).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <IconCalendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Detail Transaksi</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tanggal Transaksi</p>
                    <p className="font-semibold text-gray-900">{formatDate(transaction.transaction_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dibuat Pada</p>
                    <p className="text-gray-900">{formatDateTime(transaction.created_at)}</p>
                  </div>
                  {transaction.notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Catatan</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-900 whitespace-pre-wrap">{transaction.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <IconPackage className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Daftar Produk</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Harga Satuan</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transaction.sales_transaction_items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.supplier_products.commodities.name}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        Rp {parseFloat(item.unit_price.toString()).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {parseFloat(item.quantity.toString()).toLocaleString()} {item.supplier_products.commodities.unit}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        Rp {parseFloat(item.subtotal.toString()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-semibold text-gray-900">
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-lg text-green-700">
                      Rp {parseFloat(transaction.total_amount.toString()).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Link
              href="/cms/reports/sales"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Kembali ke Laporan
            </Link>
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Cetak
            </button>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
