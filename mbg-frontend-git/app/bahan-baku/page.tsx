'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { 
  IconLeaf, IconSearch, IconMapPin, IconScale, IconTractor, IconChartBar,
  IconCarrot, IconMeat, IconFish, IconEgg, IconMilk, IconApple, IconLemon,
  IconPepper, IconSalad, IconCookie, IconBottle, IconX, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

// Define types for bahan baku data
interface BahanBakuItem {
  id: string;
  no: string | number;
  nama_kwt: string;
  supplier_id?: string;
  kecamatan: string;
  village?: string;
  komoditas: string;
  commodity_id?: string;
  kategori?: string;
  produksi: number;
  satuan: string;
  harga_per_kg?: number;
  minimum_order?: number;
  availability_status?: string;
  photo_url?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_address?: string;
  supplier_logo?: string;
  description?: string;
  created_at?: string;
}

// Function to determine icon based on commodity name
const getIconByName = (name: string) => {
  const lowerName = name.toLowerCase();
  
  // Sayuran
  if (lowerName.includes('bayam') || lowerName.includes('kangkung') || 
      lowerName.includes('sawi') || lowerName.includes('selada') ||
      lowerName.includes('kubis') || lowerName.includes('kol')) {
    return IconSalad;
  }
  
  // Umbi-umbian dan bawang
  if (lowerName.includes('bawang') || lowerName.includes('kentang') || 
      lowerName.includes('singkong') || lowerName.includes('ubi')) {
    return IconCarrot;
  }
  
  // Cabai dan rempah
  if (lowerName.includes('cabai') || lowerName.includes('cabe') || 
      lowerName.includes('lombok') || lowerName.includes('merica')) {
    return IconPepper;
  }
  
  // Buah-buahan
  if (lowerName.includes('tomat') || lowerName.includes('jeruk') || 
      lowerName.includes('pisang') || lowerName.includes('apel') ||
      lowerName.includes('mangga') || lowerName.includes('pepaya')) {
    return lowerName.includes('jeruk') || lowerName.includes('lemon') ? IconLemon : IconApple;
  }
  
  // Daging dan protein hewani
  if (lowerName.includes('daging') || lowerName.includes('ayam') || 
      lowerName.includes('sapi') || lowerName.includes('kambing')) {
    return IconMeat;
  }
  
  // Ikan
  if (lowerName.includes('ikan') || lowerName.includes('lele') || 
      lowerName.includes('nila') || lowerName.includes('gurame')) {
    return IconFish;
  }
  
  // Telur
  if (lowerName.includes('telur')) {
    return IconEgg;
  }
  
  // Susu
  if (lowerName.includes('susu')) {
    return IconMilk;
  }
  
  // Minyak dan cairan
  if (lowerName.includes('minyak') || lowerName.includes('oli')) {
    return IconBottle;
  }
  
  // Makanan olahan
  if (lowerName.includes('tepung') || lowerName.includes('roti') || 
      lowerName.includes('kue') || lowerName.includes('kerupuk')) {
    return IconCookie;
  }
  
  // Default untuk sayuran hijau
  return IconLeaf;
};

// Function to generate consistent gradient colors based on commodity name
const getGradientByName = (name: string) => {
  const gradients = [
    { from: 'from-green-100', to: 'to-emerald-100', icon: 'text-green-600/30' },
    { from: 'from-emerald-100', to: 'to-teal-100', icon: 'text-emerald-600/30' },
    { from: 'from-lime-100', to: 'to-green-100', icon: 'text-lime-600/30' },
    { from: 'from-teal-100', to: 'to-cyan-100', icon: 'text-teal-600/30' },
    { from: 'from-yellow-100', to: 'to-amber-100', icon: 'text-yellow-600/30' },
    { from: 'from-amber-100', to: 'to-orange-100', icon: 'text-amber-600/30' },
    { from: 'from-orange-100', to: 'to-red-100', icon: 'text-orange-600/30' },
    { from: 'from-cyan-100', to: 'to-blue-100', icon: 'text-cyan-600/30' },
  ];
  
  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function BahanBakuPage() {
  const [bahanBakuData, setBahanBakuData] = useState<BahanBakuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('all');
  const [selectedCommodity, setSelectedCommodity] = useState<{
    komoditas: string;
    items: BahanBakuItem[];
  } | null>(null);

  // Load data from static JSON
  useEffect(() => {
    loadBahanBaku();
  }, []);

  const loadBahanBaku = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bahan-baku');
      if (!response.ok) {
        throw new Error('Failed to fetch bahan baku');
      }
      const result = await response.json();
      setBahanBakuData(result.data || []);
    } catch (error) {
      console.error('Error loading bahan baku:', error);
      setBahanBakuData([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique kecamatan for filter
  const kecamatanList = Array.from(new Set(bahanBakuData.map(item => item.kecamatan))).sort();

  // Filter data based on search and kecamatan
  const filteredData = bahanBakuData.filter(item => {
    const matchesSearch = 
      item.nama_kwt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.komoditas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kecamatan.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesKecamatan = selectedKecamatan === 'all' || item.kecamatan === selectedKecamatan;
    
    return matchesSearch && matchesKecamatan;
  });

  // Calculate statistics
  const totalKWT = new Set(bahanBakuData.map(item => item.nama_kwt)).size;
  const totalKomoditas = new Set(bahanBakuData.map(item => item.komoditas)).size;
  const totalKecamatan = kecamatanList.length;

  // Get top 5 commodities by accumulated production
  const commodityAccumulation = bahanBakuData.reduce((acc, item) => {
    const key = item.komoditas;
    if (!acc[key]) {
      acc[key] = {
        komoditas: item.komoditas,
        totalProduksi: 0,
        satuan: item.satuan,
        items: [] as BahanBakuItem[]
      };
    }
    acc[key].totalProduksi += item.produksi;
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { komoditas: string; totalProduksi: number; satuan: string; items: BahanBakuItem[] }>);

  const top5Commodities = Object.values(commodityAccumulation)
    .sort((a, b) => b.totalProduksi - a.totalProduksi)
    .slice(0, 5)
    .map(item => {
      // Ambil item dengan produksi terbesar untuk data tambahan
      const topProducer = item.items.sort((a, b) => b.produksi - a.produksi)[0];
      return {
        id: topProducer.id,
        no: topProducer.id, // For backward compatibility
        komoditas: item.komoditas,
        produksi: item.totalProduksi,
        satuan: item.satuan,
        jumlahKWT: item.items.length,
        nama_kwt: topProducer.nama_kwt,
        kecamatan: topProducer.kecamatan
      };
    });

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data bahan baku...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50/30 to-white py-24 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg shadow-green-500/30">
              <IconLeaf className="w-4 h-4" />
              <span>Mendukung Ekonomi Lokal</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Ketersediaan
              <span className="block bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                Bahan Baku Pangan
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Daftar ketersediaan bahan baku pangan dari Kelompok Tani (KT) di Kabupaten Sumedang 
              untuk mendukung Program Makan Bergizi Gratis
            </p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{totalKWT}</div>
                  <div className="text-green-100 text-sm font-medium">Kelompok Tani</div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <IconTractor className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{totalKomoditas}</div>
                  <div className="text-emerald-100 text-sm font-medium">Jenis Komoditas</div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <IconLeaf className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{totalKecamatan}</div>
                  <div className="text-teal-100 text-sm font-medium">Kecamatan</div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <IconMapPin className="w-7 h-7" />
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Commodities */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">5 Komoditas Terbanyak</h2>
                <p className="text-gray-600 text-sm mt-1">Berdasarkan volume produksi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {top5Commodities.map((commodity, index) => {
                const gradient = getGradientByName(commodity.komoditas);
                const CommodityIcon = getIconByName(commodity.komoditas);
                return (
                  <Link
                    key={commodity.id}
                    href={`/bahan-baku/${commodity.id}`}
                    className="group relative bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Ranking Badge */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">#{index + 1}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-full h-32 bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-xl flex items-center justify-center mb-4`}>
                      <CommodityIcon className={`w-16 h-16 ${gradient.icon} group-hover:scale-110 transition-transform`} />
                    </div>

                    {/* Content */}
                    <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {commodity.komoditas}
                    </h3>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <IconTractor className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        <span className="line-clamp-1">Dari {commodity.jumlahKWT} Kelompok Tani</span>
                      </div>
                    </div>

                    {/* Production Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-baseline gap-1">
                        <IconScale className="w-4 h-4 text-green-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {commodity.produksi.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{commodity.satuan} (Total Akumulasi)</div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const commodityData = commodityAccumulation[commodity.komoditas];
                        setSelectedCommodity({
                          komoditas: commodity.komoditas,
                          items: commodityData.items
                        });
                      }}
                      className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <IconEye className="w-4 h-4" />
                      Lihat Sumber KT
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Modal Detail Kelompok Tani */}
      {selectedCommodity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {selectedCommodity.komoditas}
                  </h3>
                  <p className="text-green-100 text-sm">
                    {selectedCommodity.items.length} Kelompok Tani Memproduksi
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCommodity(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-3">
                {selectedCommodity.items
                  .sort((a, b) => b.produksi - a.produksi)
                  .map((item, index) => {
                    const ItemIcon = getIconByName(item.komoditas);
                    return (
                      <Link
                        key={item.id}
                        href={`/bahan-baku/${item.id}`}
                        onClick={() => setSelectedCommodity(null)}
                        className="block bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-green-500 rounded-xl p-4 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          {/* Ranking */}
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">#{index + 1}</span>
                          </div>

                          {/* Icon */}
                          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <ItemIcon className="w-6 h-6 text-green-600" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
                              {item.nama_kwt}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <IconMapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span className="line-clamp-1">{item.kecamatan}</span>
                            </div>
                          </div>

                          {/* Production */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xl font-bold text-gray-900">
                              {item.produksi.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{item.satuan}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-sm text-gray-600">
                  Total Produksi dari {selectedCommodity.items.length} Kelompok Tani
                </span>
                <span className="text-lg font-bold text-green-700">
                  {selectedCommodity.items.reduce((sum, item) => sum + item.produksi, 0).toLocaleString()} {selectedCommodity.items[0].satuan}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari KM, komoditas, atau kecamatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Kecamatan Filter */}
            <div className="md:w-64">
              <select
                value={selectedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Semua Kecamatan</option>
                {kecamatanList.map((kecamatan) => (
                  <option key={kecamatan} value={kecamatan}>
                    {kecamatan.replace('Kecamatan ', '')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Menampilkan <span className="font-semibold text-gray-900">{filteredData.length}</span> dari {bahanBakuData.length} komoditas
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredData.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h3>
              <p className="text-gray-600">Coba ubah kata kunci pencarian atau filter Anda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((item) => {
                const itemGradient = getGradientByName(item.komoditas);
                const ItemIcon = getIconByName(item.komoditas);
                return (
                <Link
                  key={item.id}
                  href={`/bahan-baku/${item.id}`}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <div className={`relative h-48 bg-gradient-to-br ${itemGradient.from} ${itemGradient.to} overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ItemIcon className={`w-20 h-20 ${itemGradient.icon} group-hover:scale-110 transition-transform`} />
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-green-700">{item.satuan}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {item.komoditas}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <IconTractor className="w-4 h-4 text-green-600" />
                      <span className="line-clamp-1">{item.nama_kwt}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <IconMapPin className="w-4 h-4 text-gray-400" />
                      <span className="line-clamp-1">{item.kecamatan.replace('Kecamatan ', '')}</span>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconScale className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {item.produksi.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{item.satuan}</div>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </AppLayout>
  );
}
