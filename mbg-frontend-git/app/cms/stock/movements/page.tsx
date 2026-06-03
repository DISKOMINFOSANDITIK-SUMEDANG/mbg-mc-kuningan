'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  IconArrowUp, 
  IconArrowDown, 
  IconChartBar, 
  IconPackage,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface StockStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: number;
  recentMovements: number;
}

export default function StockMenuPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    totalStockValue: 0,
    lowStockProducts: 0,
    recentMovements: 0
  });
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get user role
      const userRes = await fetch(buildApiUrl(API_ENDPOINTS.AUTH_ME), {
        credentials: 'include',
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.role);
      }

      // Load products stats
      const productsRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      if (productsRes.ok) {
        const products = await productsRes.json();
        const productsArray = Array.isArray(products) ? products : (products.data || []);
        
        const totalValue = productsArray.reduce((sum: number, p: any) => 
          sum + (p.stock * p.price_per_unit), 0
        );
        const lowStock = productsArray.filter((p: any) => p.stock < 10).length;
        
        setStats(prev => ({
          ...prev,
          totalProducts: productsArray.length,
          totalStockValue: totalValue,
          lowStockProducts: lowStock
        }));
      }

      // Load recent movements
      const movementsRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/stock/movements`), {
        credentials: 'include',
      });
      if (movementsRes.ok) {
        const movements = await movementsRes.json();
        const movementsArray = Array.isArray(movements) ? movements : [];
        setStats(prev => ({
          ...prev,
          recentMovements: movementsArray.length
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                <IconPackage className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>
                <p className="text-gray-600 mt-1">
                  {userRole === 'pemasok' 
                    ? 'Kelola stok masuk, keluar, dan laporan stok produk Anda'
                    : 'Kelola stok masuk, keluar, dan laporan stok semua pemasok'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Produk</p>
                  <IconPackage className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-2">Produk terdaftar</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Nilai Stok</p>
                  <IconChartBar className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalStockValue)}</p>
                <p className="text-xs text-gray-500 mt-2">Total nilai inventori</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Stok Rendah</p>
                  <IconTrendingDown className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.lowStockProducts}</p>
                <p className="text-xs text-gray-500 mt-2">Produk stok &lt; 10</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Pergerakan</p>
                  <IconTrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.recentMovements}</p>
                <p className="text-xs text-gray-500 mt-2">Total transaksi stok</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stok Masuk */}
            <Link
              href="/cms/stock/movements/in"
              className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-200">
                  <IconArrowUp className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Stok Masuk</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    Tambah stok produk dari pembelian atau produksi
                  </p>
                </div>
                <div className="text-sm font-medium text-green-700 group-hover:text-green-800">
                  Klik untuk input →
                </div>
              </div>
            </Link>

            {/* Stok Keluar */}
            <Link
              href="/cms/stock/movements/out"
              className="group bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-200">
                  <IconArrowDown className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Stok Keluar</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    Kurangi stok untuk penjualan, rusak, atau keperluan lain
                  </p>
                </div>
                <div className="text-sm font-medium text-red-700 group-hover:text-red-800">
                  Klik untuk input →
                </div>
              </div>
            </Link>

            {/* Laporan Stok */}
            <Link
              href="/cms/reports/stock"
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-200">
                  <IconChartBar className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Laporan Stok</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    Lihat riwayat pergerakan dan analisis stok
                  </p>
                </div>
                <div className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                  Lihat laporan →
                </div>
              </div>
            </Link>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconPackage className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Tips Manajemen Stok</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Selalu input stok masuk setelah menerima barang dari supplier</li>
                  <li>• Catat stok keluar segera setelah penjualan atau penggunaan</li>
                  <li>• Cek laporan stok secara berkala untuk memantau persediaan</li>
                  <li>• Perhatikan produk dengan stok rendah untuk pemesanan ulang</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
