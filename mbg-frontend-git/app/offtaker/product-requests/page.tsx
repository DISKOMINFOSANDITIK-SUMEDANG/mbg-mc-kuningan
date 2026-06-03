'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  IconClipboardList, 
  IconSearch,
  IconClock,
  IconCheck,
  IconX,
  IconPackage,
  IconEye,
  IconShoppingCart,
  IconBuilding
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';

interface ProductRequest {
  id: string;
  request_number: string;
  sppg_id: string;
  offtaker_id: string;
  offtaker_product_id: string;
  requested_quantity: number;
  unit: string;
  estimated_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  request_notes: string | null;
  response_notes: string | null;
  requested_by: string;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  sppgs: {
    id: string;
    name: string;
    type: string;
    location: string;
    phone: string;
    email: string;
    address: string;
  };
  offtaker_products: {
    id: string;
    markup_price: number;
    stock_quantity: number;
    unit: string;
    supplier_products: {
      commodities: {
        id: string;
        name: string;
        photo_url: string | null;
        unit: string;
      };
    };
  };
}

export default function OfftakerProductRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected'>('approved');
  const [responseNotes, setResponseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, statusFilter, requests]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/offtaker/requests', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/cms/auth/login';
          return;
        }
        throw new Error('Failed to load requests');
      }

      const result = await response.json();
      setRequests(result.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      alert('Gagal memuat data request');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchQuery) {
      filtered = filtered.filter(
        (req) =>
          req.request_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.offtaker_products.supplier_products.commodities.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          req.sppgs.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu', icon: IconClock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui', icon: IconCheck },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak', icon: IconX },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Selesai', icon: IconCheck },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetail = (request: ProductRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleRespond = (request: ProductRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setResponseStatus(status);
    setResponseNotes('');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/offtaker/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: responseStatus,
          response_notes: responseNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request');
      }

      const result = await response.json();

      // If approved, redirect to sales page with request_id
      if (responseStatus === 'approved') {
        alert('Request disetujui! Anda akan diarahkan ke halaman penjualan untuk melanjutkan transaksi.');
        router.push(`/cms/transactions/sales?request_id=${selectedRequest.id}`);
      } else {
        alert('Request berhasil ditolak!');
        setShowResponseModal(false);
        setSelectedRequest(null);
        loadRequests();
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert(error instanceof Error ? error.message : 'Gagal memperbarui request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStats = () => {
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      completed: requests.filter((r) => r.status === 'completed').length,
    };
  };

  const stats = getStatusStats();

  return (
    <CMSLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-4 md:p-6">`
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 md:p-2.5 rounded-lg">
              <IconClipboardList className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Request Produk</h1>
              <p className="text-blue-100 text-xs md:text-sm mt-0.5">
                Kelola permintaan produk dari SPPG
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Menunggu</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
                <IconClock className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Disetujui</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-50 p-2 md:p-3 rounded-lg">
                <IconCheck className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Ditolak</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="bg-red-50 p-2 md:p-3 rounded-lg">
                <IconX className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Selesai</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                <IconCheck className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-5">
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Request
              </label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nomor request, produk, atau SPPG..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
          </div>

          {filteredRequests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold text-gray-900">{filteredRequests.length}</span> dari{' '}
                <span className="font-semibold text-gray-900">{requests.length}</span> request
              </p>
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Memuat data request...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-gray-100 p-4 rounded-full">
                <IconClipboardList className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-base md:text-lg font-medium text-gray-900">Belum ada request</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Tidak ada request yang sesuai dengan filter'
                    : 'Belum ada request produk dari SPPG'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        SPPG
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estimasi
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{request.request_number}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDate(request.created_at)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.sppgs.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{request.sppgs.type}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {request.offtaker_products.supplier_products.commodities.photo_url ? (
                              <img
                                src={request.offtaker_products.supplier_products.commodities.photo_url}
                                alt={request.offtaker_products.supplier_products.commodities.name}
                                className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                <IconPackage className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-900">
                              {request.offtaker_products.supplier_products.commodities.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {request.requested_quantity} {request.unit}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(request.estimated_price)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(request)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <IconEye className="h-3.5 w-3.5" />
                              Detail
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleRespond(request, 'approved')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  <IconCheck className="h-3.5 w-3.5" />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleRespond(request, 'rejected')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  <IconX className="h-3.5 w-3.5" />
                                  Tolak
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Link
                                href={`/cms/transactions/sales?request_id=${request.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                              >
                                <IconShoppingCart className="h-3.5 w-3.5" />
                                Proses
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{request.request_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(request.created_at)}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* SPPG Info */}
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-50 p-1.5 rounded">
                        <IconBuilding className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">SPPG</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{request.sppgs.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{request.sppgs.type}</p>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      {request.offtaker_products.supplier_products.commodities.photo_url ? (
                        <img
                          src={request.offtaker_products.supplier_products.commodities.photo_url}
                          alt={request.offtaker_products.supplier_products.commodities.name}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                          <IconPackage className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {request.offtaker_products.supplier_products.commodities.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {request.requested_quantity} {request.unit}
                        </p>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <span className="text-xs font-medium text-blue-700">Total Estimasi</span>
                      <span className="text-sm font-bold text-blue-900">{formatPrice(request.estimated_price)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleViewDetail(request)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <IconEye className="h-4 w-4" />
                        Detail
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRespond(request, 'approved')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <IconCheck className="h-4 w-4" />
                            Setujui
                          </button>
                          <button
                            onClick={() => handleRespond(request, 'rejected')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <IconX className="h-4 w-4" />
                            Tolak
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Link
                          href={`/cms/transactions/sales?request_id=${request.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <IconShoppingCart className="h-4 w-4" />
                          Proses
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Detail Request</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Request Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nomor Request</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.request_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tanggal Request</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  {selectedRequest.responded_at && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tanggal Respon</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.responded_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SPPG Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 p-1.5 rounded">
                    <IconBuilding className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Informasi SPPG</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-600">Nama</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{selectedRequest.sppgs.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-600">Tipe</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.sppgs.type}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-600">Lokasi</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{selectedRequest.sppgs.location}</span>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-100 p-1.5 rounded">
                    <IconPackage className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Informasi Produk</h4>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  {selectedRequest.offtaker_products.supplier_products.commodities.photo_url ? (
                    <img
                      src={selectedRequest.offtaker_products.supplier_products.commodities.photo_url}
                      alt={selectedRequest.offtaker_products.supplier_products.commodities.name}
                      className="h-20 w-20 md:h-24 md:w-24 rounded-lg object-cover border border-gray-200 mx-auto md:mx-0"
                    />
                  ) : (
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 mx-auto md:mx-0">
                      <IconPackage className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900 mb-3 text-center md:text-left">
                      {selectedRequest.offtaker_products.supplier_products.commodities.name}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-blue-50 p-2 rounded">
                        <span className="text-xs text-blue-700">Jumlah Request</span>
                        <p className="text-sm font-semibold text-blue-900 mt-0.5">
                          {selectedRequest.requested_quantity} {selectedRequest.unit}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <span className="text-xs text-purple-700">Stok Tersedia</span>
                        <p className="text-sm font-semibold text-purple-900 mt-0.5">
                          {selectedRequest.offtaker_products.stock_quantity} {selectedRequest.unit}
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <span className="text-xs text-green-700">Harga Satuan</span>
                        <p className="text-sm font-semibold text-green-900 mt-0.5">
                          {formatPrice(selectedRequest.offtaker_products.markup_price)}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <span className="text-xs text-orange-700">Total Estimasi</span>
                        <p className="text-sm font-bold text-orange-900 mt-0.5">
                          {formatPrice(selectedRequest.estimated_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.request_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">Catatan dari SPPG</h4>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap">
                    {selectedRequest.request_notes}
                  </p>
                </div>
              )}

              {selectedRequest.response_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Respon Anda</h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {selectedRequest.response_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-3 md:py-4 rounded-b-lg">
              <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Tutup
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleRespond(selectedRequest, 'approved');
                      }}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Setujui Request
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleRespond(selectedRequest, 'rejected');
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Tolak Request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {responseStatus === 'approved' ? 'Setujui Request' : 'Tolak Request'}
              </h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Request Summary */}
              <div className={`rounded-lg p-4 border-2 ${
                responseStatus === 'approved' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {selectedRequest.offtaker_products.supplier_products.commodities.photo_url ? (
                    <img
                      src={selectedRequest.offtaker_products.supplier_products.commodities.photo_url}
                      alt={selectedRequest.offtaker_products.supplier_products.commodities.name}
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                      <IconPackage className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                      {selectedRequest.offtaker_products.supplier_products.commodities.name}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <IconBuilding className="h-3.5 w-3.5" />
                        <span className="truncate">{selectedRequest.sppgs.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <IconPackage className="h-3.5 w-3.5" />
                        <span>{selectedRequest.requested_quantity} {selectedRequest.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Catatan Respon {responseStatus === 'rejected' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder={
                    responseStatus === 'approved'
                      ? 'Tambahkan catatan persetujuan (opsional)\nContoh: Produk akan dikirim besok'
                      : 'Tambahkan alasan penolakan (wajib)\nContoh: Stok tidak mencukupi'
                  }
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {responseStatus === 'approved' 
                    ? 'Catatan ini akan dikirim ke SPPG'
                    : 'Berikan alasan yang jelas untuk penolakan'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 md:px-6 py-3 md:py-4 rounded-b-lg">
              <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    responseStatus === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    responseStatus === 'approved' ? 'Setujui Request' : 'Tolak Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
