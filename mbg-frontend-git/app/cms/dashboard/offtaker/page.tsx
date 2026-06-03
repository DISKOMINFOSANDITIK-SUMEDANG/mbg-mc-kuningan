'use client';

import { useEffect, useState } from 'react';
import { 
  IconPackage, 
  IconShoppingCart, 
  IconCash, 
  IconTrendingUp,
  IconBuildingWarehouse,
  IconAlertCircle
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  pendingPurchases: number;
  completedSales: number;
  totalRevenue: number;
  warehouseCapacity: number;
  currentStock: number;
}

export default function OfftakerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    pendingPurchases: 0,
    completedSales: 0,
    totalRevenue: 0,
    warehouseCapacity: 0,
    currentStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch offtaker products
      const productsRes = await fetch('/api/cms/offtaker-products');
      const productsData = await productsRes.json();
      
      // Fetch transactions
      const transactionsRes = await fetch('/api/cms/transactions');
      const transactionsData = await transactionsRes.json();

      // Calculate stats
      const products = productsData.data || [];
      const transactions = transactionsData.data || [];

      const totalProducts = products.length;
      const lowStockProducts = products.filter((p: any) => p.stock_quantity < 10).length;
      const currentStock = products.reduce((sum: number, p: any) => sum + (p.stock_quantity || 0), 0);
      
      const pendingPurchases = transactions.filter(
        (t: any) => t.transaction_type === 'supplier_to_offtaker' && t.payment_status === 'pending'
      ).length;
      
      const completedSales = transactions.filter(
        (t: any) => t.transaction_type === 'offtaker_to_sppg' && t.status === 'completed'
      ).length;
      
      const totalRevenue = transactions
        .filter((t: any) => t.transaction_type === 'offtaker_to_sppg' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.grand_total) || 0), 0);

      setStats({
        totalProducts,
        lowStockProducts,
        pendingPurchases,
        completedSales,
        totalRevenue,
        warehouseCapacity: 10000, // Default, should come from offtaker profile
        currentStock
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat dashboard..." />
      </CMSLayout>
    );
  }

  const capacityPercentage = stats.warehouseCapacity > 0 
    ? (stats.currentStock / stats.warehouseCapacity) * 100 
    : 0;

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <IconBuildingWarehouse className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Offtaker</h1>
                <p className="text-blue-100">Ringkasan operasional dan distribusi</p>
              </div>
            </div>
          </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Produk"
          value={stats.totalProducts}
          subtitle="Produk di inventori"
          icon={IconPackage}
          color="text-blue-600"
        />
        <StatCard
          title="Pembelian Pending"
          value={stats.pendingPurchases}
          subtitle="Menunggu pembayaran"
          icon={IconShoppingCart}
          color="text-yellow-600"
        />
        <StatCard
          title="Penjualan Selesai"
          value={stats.completedSales}
          subtitle="Transaksi ke SPPG"
          icon={IconCash}
          color="text-green-600"
        />
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
          subtitle="Dari penjualan ke SPPG"
          icon={IconTrendingUp}
          color="text-purple-600"
        />
      </div>

      {/* Warehouse Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Status Gudang</h2>
            <IconBuildingWarehouse className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Kapasitas Terpakai</span>
                <span className="font-medium">{capacityPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    capacityPercentage > 80 ? 'bg-red-600' : 
                    capacityPercentage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Stok Saat Ini</p>
                <p className="text-xl font-bold text-gray-900">{stats.currentStock} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kapasitas</p>
                <p className="text-xl font-bold text-gray-900">{stats.warehouseCapacity} kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Peringatan Stok</h2>
            <IconAlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          {stats.lowStockProducts > 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-medium">
                {stats.lowStockProducts} produk stok menipis!
              </p>
              <p className="text-sm text-orange-600 mt-1">
                Segera lakukan pembelian dari pemasok untuk memenuhi permintaan SPPG.
              </p>
              <button className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700">
                Lihat Produk →
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Semua stok aman</p>
              <p className="text-sm text-green-600 mt-1">
                Tidak ada produk dengan stok menipis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/cms/offtaker-products"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconPackage className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium text-gray-700">Kelola Produk</span>
          </a>
          <a
            href="/cms/transactions/purchase"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconShoppingCart className="w-5 h-5 mr-2 text-yellow-600" />
            <span className="font-medium text-gray-700">Beli dari Pemasok</span>
          </a>
          <a
            href="/cms/transactions/sales"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconCash className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-medium text-gray-700">Jual ke SPPG</span>
          </a>
          <a
            href="/cms/transactions"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconTrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            <span className="font-medium text-gray-700">Lihat Transaksi</span>
          </a>
        </div>
      </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
