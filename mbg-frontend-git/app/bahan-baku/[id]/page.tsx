'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/shared/AppLayout';
import { 
  IconLeaf, IconMapPin, IconScale, IconTractor, IconArrowLeft, IconCalendar, IconChartBar,
  IconCarrot, IconMeat, IconFish, IconEgg, IconMilk, IconApple, IconLemon,
  IconPepper, IconSalad, IconCookie, IconBottle
} from '@tabler/icons-react';

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

export default function BahanBakuDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [item, setItem] = useState<BahanBakuItem | null>(null);
  const [kwtCommodities, setKwtCommodities] = useState<BahanBakuItem[]>([]);
  const [sameKecamatanItems, setSameKecamatanItems] = useState<BahanBakuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItemDetail();
  }, [id]);

  const loadItemDetail = async () => {
    setLoading(true);
    try {
      // Fetch all bahan baku data
      const response = await fetch('/api/bahan-baku');
      if (!response.ok) {
        throw new Error('Failed to fetch bahan baku');
      }
      const result = await response.json();
      const allData = result.data || [];

      // Find the specific item
      const foundItem = allData.find((data: BahanBakuItem) => data.id === id);
      
      if (!foundItem) {
        notFound();
        return;
      }

      setItem(foundItem);

      // Get all commodities from the same KWT (supplier)
      const sameKwtItems = allData.filter(
        (data: BahanBakuItem) => data.nama_kwt === foundItem.nama_kwt
      );
      setKwtCommodities(sameKwtItems);

      // Find items from the same kecamatan but different KWT
      const sameKecItems = allData
        .filter((data: BahanBakuItem) => 
          data.kecamatan === foundItem.kecamatan && 
          data.nama_kwt !== foundItem.nama_kwt
        )
        .slice(0, 6);
      setSameKecamatanItems(sameKecItems);

    } catch (error) {
      console.error('Error loading bahan baku detail:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat detail bahan baku...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    notFound();
    return null;
  }

  // Calculate total production for the KWT
  const totalProduction = kwtCommodities.reduce((sum, item) => sum + item.produksi, 0);
  
  // Count unique commodities
  const uniqueCommodities = new Set(kwtCommodities.map(item => item.komoditas)).size;

  const itemGradient = getGradientByName(item.komoditas);
  const ItemIcon = getIconByName(item.komoditas);

  return (
    <AppLayout>
      {/* Back Navigation */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/bahan-baku" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <IconArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali ke Katalog</span>
          </Link>
        </div>
      </section>

      {/* Detail Section */}
      <section className="py-16 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Section - Informasi Komoditas */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
                <IconLeaf className="w-4 h-4" />
                <span>Informasi Komoditas</span>
              </div>

              <div className={`relative h-96 bg-gradient-to-br ${itemGradient.from} ${itemGradient.to} rounded-3xl overflow-hidden shadow-2xl`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ItemIcon className={`w-40 h-40 ${itemGradient.icon}`} />
                </div>
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <span className="text-sm font-semibold text-green-700">{item.komoditas}</span>
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {item.komoditas}
              </h2>
              
              {/* Simple accent line */}
              <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>

              {/* Price Card - Featured */}
              {/* {item.harga_per_kg && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-amber-700 font-medium">Harga Pasar Saat Ini</div>
                      <div className="text-xs text-amber-600">Per {item.satuan === 'Butir' ? 'butir' : 'kilogram'}</div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    Rp {item.harga_per_kg.toLocaleString()}
                  </div>
                </div>
              )} */}

              {/* Production Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Produksi</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <IconScale className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-600">Keteserdiaan</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{item.produksi.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{item.satuan}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">Update Terakhir</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Tentang Komoditas</h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.komoditas} merupakan salah satu komoditas pertanian yang diproduksi oleh {item.nama_kwt} 
                  di {item.kecamatan}, Kabupaten Sumedang. Komoditas ini berkualitas tinggi dan mendukung 
                  ketersediaan bahan pangan lokal untuk Program Makan Bergizi Gratis dengan produksi mencapai{' '}
                  {item.produksi.toLocaleString()} {item.satuan}.
                </p>
              </div>
            </div>

            {/* Right Section - Informasi Kelompok Tani */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
                <IconTractor className="w-4 h-4" />
                <span>Informasi Kelompok Tani</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {item.nama_kwt}
              </h1>
              
              {/* Simple accent line */}
              <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>

              {/* Location Info */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <IconMapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-green-100 font-medium">Lokasi</div>
                    <div className="text-xl font-bold">{item.kecamatan}</div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <IconLeaf className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-sm text-gray-600">Jenis Komoditas</div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {uniqueCommodities}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Komoditas Unik</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <IconScale className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-sm text-gray-600">Alamat Lengkap</div>
                  </div>
                  <div className="text-1xl font-bold text-emerald-600">
                    {item.kecamatan}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Tentang Kelompok Tani</h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.nama_kwt} adalah kelompok tani yang berlokasi di {item.kecamatan}, Kabupaten Sumedang. 
                  Kelompok ini aktif memproduksi berbagai komoditas pertanian berkualitas yang mendukung 
                  Program Makan Bergizi Gratis. Dengan total produksi mencapai {totalProduction.toLocaleString()} unit 
                  dari {uniqueCommodities} jenis komoditas, kelompok tani ini berkontribusi signifikan dalam 
                  penyediaan bahan pangan lokal untuk masyarakat.
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <IconChartBar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Peran Kelompok Tani</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Kelompok Tani adalah organisasi berbasis masyarakat yang memberdayakan petani lokal 
                      untuk meningkatkan produksi pertanian. Dengan memanfaatkan hasil dari kelompok tani lokal, 
                      program MBG mendukung ekonomi daerah dan keberlanjutan pertanian di Kabupaten Sumedang.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Person Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-amber-700 font-medium">Kontak Person</div>
                    <div className="text-base font-bold text-gray-900">Belum Ditetapkan</div>
                  </div>
                </div>
                <div className="text-xs text-amber-600">
                  Informasi kontak akan diperbarui segera
                </div>
              </div>
            </div>
          </div>

          {/* Commodities List from this KWT */}
          <div className="mt-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Daftar Komoditas</h2>
              <p className="text-gray-600 mt-2">Produk yang dihasilkan oleh {item.nama_kwt}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Komoditas</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Produksi</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {kwtCommodities.map((commodity, index) => {
                      const commodityIcon = getIconByName(commodity.komoditas);
                      const CommodityIcon = commodityIcon;
                      const isCurrentItem = commodity.id === item.id;
                      return (
                        <tr 
                          key={commodity.id}
                          onClick={() => {
                            if (!isCurrentItem) {
                              window.location.href = `/bahan-baku/${commodity.id}`;
                            }
                          }}
                          className={`transition-colors ${
                            isCurrentItem 
                              ? 'bg-green-50' 
                              : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CommodityIcon className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className={`font-semibold ${isCurrentItem ? 'text-green-700' : 'text-gray-900'}`}>
                                  {commodity.komoditas}
                                  {isCurrentItem && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Sedang dilihat
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${isCurrentItem ? 'text-green-700' : 'text-gray-900'}`}>
                              {commodity.produksi.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{commodity.satuan}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Products from Same Kecamatan but Different KWT */}
          {sameKecamatanItems.length > 0 && (
            <div className="mt-20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Kelompok Tani Lainnya</h2>
                  <p className="text-gray-600 mt-2">Dari {item.kecamatan}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sameKecamatanItems.map((kecamatanItem) => {
                  const kecamatanGradient = getGradientByName(kecamatanItem.komoditas);
                  const KecamatanIcon = getIconByName(kecamatanItem.komoditas);
                  return (
                  <Link
                    key={kecamatanItem.id}
                    href={`/bahan-baku/${kecamatanItem.id}`}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`relative h-40 bg-gradient-to-br ${kecamatanGradient.from} ${kecamatanGradient.to}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <KecamatanIcon className={`w-16 h-16 ${kecamatanGradient.icon} group-hover:scale-110 transition-transform`} />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
                        {kecamatanItem.komoditas}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <IconTractor className="w-4 h-4 text-green-600" />
                        <span className="line-clamp-1">{kecamatanItem.nama_kwt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconScale className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-gray-900">
                          {kecamatanItem.produksi.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">{kecamatanItem.satuan}</span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
