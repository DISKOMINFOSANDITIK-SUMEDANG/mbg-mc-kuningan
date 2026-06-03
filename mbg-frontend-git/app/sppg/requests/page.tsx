'use client';

import { useState, useEffect } from 'react';
import { 
  IconClipboardList, 
  IconSearch,
  IconClock,
  IconCheck,
  IconX,
  IconPackage,
  IconEye,
  IconUser,
  IconPhone,
  IconMail,
  IconNote,
  IconMessage
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
  request_notes: string;
  response_notes: string;
  requested_by: string;
  responded_by: string;
  responded_at: string;
  created_at: string;
  updated_at: string;
  offtakers: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  offtaker_products: {
    id: string;
    markup_price: number;
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

export default function SPPGProductRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, statusFilter, requests]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sppg/product-requests', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
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

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (req) =>
          req.request_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.offtaker_products.supplier_products.commodities.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          req.offtakers.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-800', label: 'Menunggu', icon: IconClock },
      approved: { bg: 'bg-green-100 border-green-300', text: 'text-green-800', label: 'Disetujui', icon: IconCheck },
      rejected: { bg: 'bg-red-100 border-red-300', text: 'text-red-800', label: 'Ditolak', icon: IconX },
      completed: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800', label: 'Selesai', icon: IconCheck },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-2 ${config.bg} ${config.text} shadow-sm`}>
        <Icon className="h-3.5 w-3.5" />
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
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleViewDetail = (request: ProductRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
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
    <CMSLayout title="Request Saya">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Request Produk Saya</h1>
              <p className="text-blue-100 text-lg">
                Pantau dan kelola semua request produk Anda dengan mudah
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <IconClipboardList className="h-12 w-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-yellow-500 rounded-lg p-2">
                <IconClock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-sm text-yellow-600 mt-1">Menunggu Respon</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-500 rounded-lg p-2">
                <IconCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                Approved
              </span>
            </div>
            <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-sm text-green-600 mt-1">Disetujui</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-500 rounded-lg p-2">
                <IconX className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">
                Rejected
              </span>
            </div>
            <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
            <p className="text-sm text-red-600 mt-1">Ditolak</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <IconCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                Completed
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-700">{stats.completed}</p>
            <p className="text-sm text-blue-600 mt-1">Selesai</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative group">
              <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari nomor request, produk, atau offtaker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Memuat data request...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <IconClipboardList className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Request</h3>
            <p className="text-gray-500">Request produk Anda akan muncul di sini</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Product Image & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {request.offtaker_products.supplier_products.commodities.photo_url ? (
                        <img
                          src={request.offtaker_products.supplier_products.commodities.photo_url}
                          alt={request.offtaker_products.supplier_products.commodities.name}
                          className="h-20 w-20 rounded-xl object-cover border-2 border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                          <IconPackage className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                          {request.offtaker_products.supplier_products.commodities.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Request:</span> {request.request_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Offtaker:</span> {request.offtakers.name}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6">
                      {/* Quantity */}
                      <div className="text-center bg-gray-50 rounded-lg px-4 py-2">
                        <p className="text-xs text-gray-500 mb-1">Jumlah</p>
                        <p className="text-lg font-bold text-gray-900">
                          {request.requested_quantity} <span className="text-sm font-normal">{request.unit}</span>
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-center bg-blue-50 rounded-lg px-4 py-2">
                        <p className="text-xs text-blue-600 mb-1">Estimasi</p>
                        <p className="text-lg font-bold text-blue-700">
                          {formatPrice(request.estimated_price)}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-center gap-2">
                        {getStatusBadge(request.status)}
                        <p className="text-xs text-gray-500">
                          {formatDate(request.created_at)}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleViewDetail(request)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                      >
                        <IconEye className="h-4 w-4" />
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Detail Request</h3>
                  <p className="text-blue-100">{selectedRequest.request_number}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <IconX className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Dates */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Status Saat Ini</p>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Tanggal Request</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  {selectedRequest.responded_at && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-2">Tanggal Respon</p>
                      <p className="font-semibold text-gray-900">{formatDate(selectedRequest.responded_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IconPackage className="h-5 w-5 text-blue-600" />
                  Informasi Produk
                </h4>
                <div className="flex items-start gap-5">
                  {selectedRequest.offtaker_products.supplier_products.commodities.photo_url ? (
                    <img
                      src={selectedRequest.offtaker_products.supplier_products.commodities.photo_url}
                      alt={selectedRequest.offtaker_products.supplier_products.commodities.name}
                      className="h-24 w-24 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                      <IconPackage className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900 mb-2">
                      {selectedRequest.offtaker_products.supplier_products.commodities.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      <span className="font-semibold">Offtaker:</span> {selectedRequest.offtakers.name}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">Jumlah Request</p>
                        <p className="text-lg font-bold text-blue-700">
                          {selectedRequest.requested_quantity} {selectedRequest.unit}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium mb-1">Harga Satuan</p>
                        <p className="text-lg font-bold text-green-700">
                          {formatPrice(selectedRequest.offtaker_products.markup_price)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4">
                      <p className="text-sm mb-1">Total Estimasi</p>
                      <p className="text-2xl font-bold">{formatPrice(selectedRequest.estimated_price)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.request_notes && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <IconNote className="h-5 w-5 text-amber-600" />
                    Catatan Request
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedRequest.request_notes}
                  </p>
                </div>
              )}

              {/* Response Notes */}
              {selectedRequest.response_notes && (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <IconMessage className="h-5 w-5 text-blue-600" />
                    Respon dari Offtaker
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedRequest.response_notes}
                  </p>
                </div>
              )}

              {/* Offtaker Contact */}
              <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-5">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IconPhone className="h-5 w-5 text-gray-600" />
                  Kontak Offtaker
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <IconUser className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.offtakers.name}</p>
                    </div>
                  </div>
                  {selectedRequest.offtakers.phone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 rounded-lg p-2">
                        <IconPhone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Telepon</p>
                        <p className="font-semibold text-gray-900">{selectedRequest.offtakers.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.offtakers.email && (
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <IconMail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{selectedRequest.offtakers.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
