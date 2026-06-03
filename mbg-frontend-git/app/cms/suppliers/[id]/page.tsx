'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconEdit, IconTruck, IconPackage, IconMail, IconPhone, IconWorld, IconMapPin } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupplierProduct {
  id: string;
  commodity_id: string;
  price_per_unit: number;
  stock: number;
  availability_status: string;
  notes: string;
  commodities?: {
    id: string;
    name: string;
    unit: string;
    commodity_categories?: {
      id: string;
      name: string;
    };
  };
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSupplierData();
  }, [supplierId]);

  const loadSupplierData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load supplier details
      const supplierResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers/${supplierId}`), {
        credentials: 'include',
      });
      
      if (!supplierResponse.ok) {
        if (supplierResponse.status === 404) {
          setError('Pemasok tidak ditemukan');
        } else {
          setError('Gagal memuat data pemasok');
        }
        return;
      }
      
      const supplierData = await supplierResponse.json();
      setSupplier(supplierData);

      // Load supplier products
      const productsResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products?supplier_id=${supplierId}`), {
        credentials: 'include',
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : (productsData.data || []));
      }
    } catch (error) {
      console.error('Error loading supplier data:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <IconArrowLeft className="h-5 w-5" />
              Kembali
            </button>
            {supplier && (
              <Link
                href={`/cms/suppliers/${supplierId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconEdit className="h-5 w-5" />
                Edit Pemasok
              </Link>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push('/cms/suppliers')}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Kembali ke daftar pemasok
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data...</p>
            </div>
          ) : supplier ? (
            <>
              {/* Supplier Info Card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {supplier.logo_url ? (
                        <img
                          className="h-24 w-24 rounded-lg object-cover"
                          src={supplier.logo_url}
                          alt={supplier.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%23e5e7eb"/></svg>';
                          }}
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                          <IconTruck className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.status ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {supplier.description && (
                        <p className="mt-2 text-gray-600">{supplier.description}</p>
                      )}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supplier.address && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <IconMapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{supplier.address}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconPhone className="h-5 w-5 flex-shrink-0" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconMail className="h-5 w-5 flex-shrink-0" />
                            <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.website && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconWorld className="h-5 w-5 flex-shrink-0" />
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {supplier.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Dibuat:</span> {formatDate(supplier.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Diperbarui:</span> {formatDate(supplier.updated_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconPackage className="h-5 w-5 text-gray-500" />
                      <h2 className="text-lg font-semibold text-gray-900">Produk Komoditas</h2>
                    </div>
                    <span className="text-sm text-gray-500">{products.length} produk</span>
                  </div>
                </div>
                {products.length === 0 ? (
                  <div className="p-8 text-center">
                    <IconPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada produk dari pemasok ini</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Komoditas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategori
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Harga
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stok
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{product.commodities?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{product.commodities?.commodity_categories?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatCurrency(product.price_per_unit)} / {product.commodities?.unit || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {product.stock || 0} {product.commodities?.unit || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.availability_status === 'available'
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.availability_status === 'available' ? 'Tersedia' : 'Tidak Tersedia'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
