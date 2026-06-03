'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  IconClipboardList, 
  IconSearch,
  IconClock,
  IconCheck,
  IconX,
  IconPackage,
  IconEye,
  IconShoppingCart
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

  // Check and validate user data on mount
  useEffect(() => {
    console.log('[Product Requests Page] Component mounted');
    
    // Force clear any stale data on mount
    const initialize = async () => {
      try {
        // CRITICAL: First check if token has offtakerId by calling /api/auth/me
        console.log('[Product Requests Page] Checking current token validity...');
        
        try {
          const meResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          
          if (meResponse.ok) {
            const userData = await meResponse.json();
            console.log('[Product Requests Page] Current token data:', userData);
            
            // If offtaker role but no offtakerId, token is OLD/INVALID
            if (userData.role === 'offtaker' && !userData.offtakerId) {
              console.error('[Product Requests Page] ❌ Token is OLD - missing offtakerId!');
              
              // Force clear everything
              localStorage.clear();
              
              try {
                await fetch('/api/auth/force-clear-cookie', {
                  method: 'POST',
                  credentials: 'include',
                });
                console.log('[Product Requests Page] Cookie force-cleared');
              } catch (error) {
                console.error('[Product Requests Page] Failed to force clear cookie:', error);
              }
              
              alert('Token Anda sudah kadaluarsa atau tidak valid.\n\nSilakan:\n1. Tutup semua tab browser\n2. Buka browser baru\n3. Login kembali\n\nAnda akan diarahkan ke halaman login...');
              
              // Wait a bit before redirect to ensure cookie is cleared
              await new Promise(resolve => setTimeout(resolve, 500));
              window.location.href = '/cms/auth/login';
              return;
            }
            
            console.log('[Product Requests Page] ✓ Token is valid with offtakerId:', userData.offtakerId);
          } else {
            console.log('[Product Requests Page] Not authenticated, will redirect via CMSLayout');
          }
        } catch (checkError) {
          console.error('[Product Requests Page] Error checking token:', checkError);
        }
        
        // Check localStorage cache as backup
        const cachedUserData = localStorage.getItem('user_data');
        if (cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData);
            console.log('[Product Requests Page] Cached user data:', {
              role: userData.role,
              hasOfftakerId: !!userData.offtakerId,
              offtakerId: userData.offtakerId
            });
            
            // If offtaker role but no offtakerId in cache, clear it
            if (userData.role === 'offtaker' && !userData.offtakerId) {
              console.warn('[Product Requests Page] Invalid cached data detected, clearing...');
              localStorage.clear();
            }
          } catch (error) {
            console.error('[Product Requests Page] Error parsing cached user data:', error);
            localStorage.clear();
          }
        }
        
        // Load requests
        loadRequests();
      } catch (error) {
        console.error('[Product Requests Page] Initialization error:', error);
        loadRequests();
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, statusFilter, requests]);

  const loadRequests = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('[Product Requests] Starting to fetch requests... (attempt:', retryCount + 1, ')');
      
      let response;
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        response = await fetch('/api/cms/product-requests', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (fetchError) {
        console.error('[Product Requests] Network error:', fetchError);
        
        // If it's an abort error (timeout), provide specific message
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        }
        
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to fetch'}`);
      }

      console.log('[Product Requests] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Product Requests] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // If error is "Offtaker ID not found" and haven't retried yet, force refresh token
        if (errorData.error && errorData.error.includes('Offtaker ID not found') && retryCount === 0) {
          console.log('[Product Requests] Detected old token without offtakerId, forcing refresh...');
          
          try {
            const refreshResponse = await fetch('/api/auth/refresh-token', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            console.log('[Product Requests] Refresh response status:', refreshResponse.status);
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              console.log('[Product Requests] Token refreshed successfully:', refreshData);
              // Clear old localStorage
              localStorage.clear();
              // Retry the request with new token
              await loadRequests(retryCount + 1);
              return;
            } else {
              const errorText = await refreshResponse.text();
              console.error('[Product Requests] Failed to refresh token:', {
                status: refreshResponse.status,
                error: errorText
              });
              
              // If refresh failed, try force clear cookie as last resort
              console.log('[Product Requests] Attempting force clear cookie...');
              try {
                await fetch('/api/auth/force-clear-cookie', {
                  method: 'POST',
                  credentials: 'include',
                });
              } catch (clearError) {
                console.error('[Product Requests] Force clear cookie failed:', clearError);
              }
              
              localStorage.clear();
              alert('Session Anda sudah tidak valid. Silakan login kembali untuk mendapatkan session baru.');
              window.location.href = '/cms/auth/login';
              return;
            }
          } catch (refreshError) {
            console.error('[Product Requests] Error refreshing token:', refreshError);
            
            // Try force clear cookie as last resort
            try {
              await fetch('/api/auth/force-clear-cookie', {
                method: 'POST',
                credentials: 'include',
              });
            } catch (clearError) {
              console.error('[Product Requests] Force clear cookie failed:', clearError);
            }
            
            localStorage.clear();
            alert('Gagal memperbarui session. Cookie telah dibersihkan, silakan login kembali.');
            window.location.href = '/cms/auth/login';
            return;
          }
        }
        
        throw new Error(errorData.error || `Failed to fetch requests (${response.status})`);
      }

      const result = await response.json();
      console.log('[Product Requests] API Response:', result);
      setRequests(result.data || []);
    } catch (error) {
      console.error('[Product Requests] Error loading requests:', error);
      
      // Only show error alert on first attempt, not retry
      if (retryCount === 0) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check if it's a network/fetch error
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error')) {
          alert(`Gagal terhubung ke server.\n\nKemungkinan penyebab:\n1. Server Next.js tidak running\n2. Cookie session tidak valid\n3. Network error\n\nSilakan coba:\n1. Restart browser\n2. Clear cache & cookies\n3. Login ulang`);
        } else {
          alert(`Gagal memuat data request: ${errorMessage}`);
        }
      }
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
          req.sppgs.name.toLowerCase().includes(searchQuery.toLowerCase())
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

      const response = await fetch(`/api/cms/product-requests/${selectedRequest.id}`, {
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

      alert(`Request berhasil ${responseStatus === 'approved' ? 'disetujui' : 'ditolak'}!`);
      setShowResponseModal(false);
      setSelectedRequest(null);
      loadRequests(); // Reload data
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
    <CMSLayout title="Request Produk dari SPPG">
      <div className="space-y-6">
        {/* Header & Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request Produk dari SPPG</h2>
              <p className="text-gray-600 mt-1">
                Kelola request produk yang masuk dari SPPG
              </p>
            </div>
            <IconClipboardList className="h-8 w-8 text-blue-500" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Menunggu</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <IconClock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Disetujui</p>
                  <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                </div>
                <IconCheck className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Ditolak</p>
                  <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
                <IconX className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Selesai</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
                </div>
                <IconCheck className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor request, produk, atau SPPG..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Memuat data request...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <IconClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada request produk dari SPPG</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nomor Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SPPG
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estimasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.request_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{request.sppgs.name}</div>
                        <div className="text-sm text-gray-500">{request.sppgs.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {request.offtaker_products.supplier_products.commodities.photo_url ? (
                            <img
                              src={request.offtaker_products.supplier_products.commodities.photo_url}
                              alt={request.offtaker_products.supplier_products.commodities.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                              <IconPackage className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {request.offtaker_products.supplier_products.commodities.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.requested_quantity} {request.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(request.estimated_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewDetail(request)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <IconEye className="h-4 w-4" />
                          Detail
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRespond(request, 'approved')}
                              className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                            >
                              <IconCheck className="h-4 w-4" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleRespond(request, 'rejected')}
                              className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                            >
                              <IconX className="h-4 w-4" />
                              Tolak
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <Link
                            href={`/cms/offtaker-sales?request_id=${request.id}`}
                            className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                          >
                            <IconShoppingCart className="h-4 w-4" />
                            Proses
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Detail Request</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Request Info */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nomor Request</p>
                    <p className="font-medium text-gray-900">{selectedRequest.request_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Request</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  {selectedRequest.responded_at && (
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Respon</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedRequest.responded_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SPPG Info */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Informasi SPPG</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nama:</span>
                    <span className="font-medium">{selectedRequest.sppgs.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipe:</span>
                    <span className="font-medium">{selectedRequest.sppgs.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lokasi:</span>
                    <span className="font-medium">{selectedRequest.sppgs.location}</span>
                  </div>
                  {selectedRequest.sppgs.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Telepon:</span>
                      <span className="font-medium">{selectedRequest.sppgs.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Informasi Produk</h4>
                <div className="flex items-start gap-4">
                  {selectedRequest.offtaker_products.supplier_products.commodities.photo_url ? (
                    <img
                      src={selectedRequest.offtaker_products.supplier_products.commodities.photo_url}
                      alt={selectedRequest.offtaker_products.supplier_products.commodities.name}
                      className="h-20 w-20 rounded object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded bg-gray-200 flex items-center justify-center">
                      <IconPackage className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-3">
                      {selectedRequest.offtaker_products.supplier_products.commodities.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Jumlah Request:</span>{' '}
                        <span className="font-medium">{selectedRequest.requested_quantity} {selectedRequest.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Stok Tersedia:</span>{' '}
                        <span className="font-medium">{selectedRequest.offtaker_products.stock_quantity} {selectedRequest.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Harga Satuan:</span>{' '}
                        <span className="font-medium">{formatPrice(selectedRequest.offtaker_products.markup_price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Estimasi:</span>{' '}
                        <span className="font-medium text-lg text-blue-600">{formatPrice(selectedRequest.estimated_price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.request_notes && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Catatan dari SPPG</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedRequest.request_notes}
                  </p>
                </div>
              )}

              {/* Response Notes */}
              {selectedRequest.response_notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Respon Anda</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    {selectedRequest.response_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleRespond(selectedRequest, 'rejected');
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Tolak
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {responseStatus === 'approved' ? 'Setujui' : 'Tolak'} Request
              </h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Request Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {selectedRequest.offtaker_products.supplier_products.commodities.name}
                </p>
                <p className="text-sm text-gray-600">
                  Dari: {selectedRequest.sppgs.name}
                </p>
                <p className="text-sm text-gray-600">
                  Jumlah: {selectedRequest.requested_quantity} {selectedRequest.unit}
                </p>
              </div>

              {/* Response Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Respon (Opsional)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    responseStatus === 'approved'
                      ? 'Tambahkan catatan untuk persetujuan (misal: jadwal pengiriman, dll)'
                      : 'Tambahkan alasan penolakan'
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    responseStatus === 'approved'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {submitting ? 'Memproses...' : responseStatus === 'approved' ? 'Setujui' : 'Tolak'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
