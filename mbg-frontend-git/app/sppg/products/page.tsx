'use client';

import { useState, useEffect } from 'react';
import { 
  IconShoppingCart, 
  IconSearch, 
  IconPackage,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconCurrencyDollar,
  IconLeaf,
  IconCarrot,
  IconMeat,
  IconFish,
  IconEgg,
  IconMilk,
  IconApple,
  IconLemon,
  IconPepper,
  IconSalad,
  IconCookie,
  IconBottle,
  IconScale,
  IconMapPin,
  IconTractor,
  IconBuilding
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';

interface Commodity {
  id: string;
  name: string;
  description: string;
  unit: string;
  photo_url: string | null;
  commodity_categories?: {
    id: string;
    name: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  email: string;
  logo_url: string | null;
}

interface SupplierProduct {
  id: string;
  supplier_id: string;
  commodity_id: string;
  price_per_unit: number;
  stock: number;
  availability_status: string;
  notes: string;
  created_at: string;
  suppliers: Supplier;
  commodities: Commodity;
}

export default function SPPGProductCatalog() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to get image URL for product
  const getProductImageUrl = (commodityName: string) => {
    // Mapping Indonesian commodity names to English search terms
    const searchTerms: { [key: string]: string } = {
      'kubis': 'cabbage',
      'tomat': 'tomato',
      'labu siam': 'chayote',
      'bawang': 'onion',
      'kentang': 'potato',
      'wortel': 'carrot',
      'bayam': 'spinach',
      'kangkung': 'water spinach',
      'sawi': 'mustard greens',
      'selada': 'lettuce',
      'cabai': 'chili pepper',
      'cabe': 'chili',
      'lombok': 'chili',
      'terong': 'eggplant',
      'kacang': 'beans',
      'jagung': 'corn',
      'buncis': 'green beans',
      'timun': 'cucumber',
      'labu': 'pumpkin',
      'paprika': 'bell pepper',
      'brokoli': 'broccoli',
      'kembang kol': 'cauliflower',
      'daging': 'meat',
      'ayam': 'chicken',
      'sapi': 'beef',
      'ikan': 'fish',
      'telur': 'egg',
      'susu': 'milk',
      'tepung': 'flour',
      'beras': 'rice',
      'minyak': 'cooking oil',
      'gula': 'sugar',
      'garam': 'salt',
    };

    const lowerName = commodityName.toLowerCase();
    let searchTerm = 'vegetables';
    
    // Find matching search term
    for (const [key, value] of Object.entries(searchTerms)) {
      if (lowerName.includes(key)) {
        searchTerm = value;
        break;
      }
    }

    // Use placeholder.com with a more reliable service
    return `https://via.placeholder.com/400x300/93C5FD/1E40AF?text=${encodeURIComponent(commodityName)}`;
  };

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
      { from: 'from-green-100', to: 'to-emerald-100', icon: 'text-green-600/30', border: 'border-green-200', bg: 'bg-green-50' },
      { from: 'from-emerald-100', to: 'to-teal-100', icon: 'text-emerald-600/30', border: 'border-emerald-200', bg: 'bg-emerald-50' },
      { from: 'from-lime-100', to: 'to-green-100', icon: 'text-lime-600/30', border: 'border-lime-200', bg: 'bg-lime-50' },
      { from: 'from-teal-100', to: 'to-cyan-100', icon: 'text-teal-600/30', border: 'border-teal-200', bg: 'bg-teal-50' },
      { from: 'from-yellow-100', to: 'to-amber-100', icon: 'text-yellow-600/30', border: 'border-yellow-200', bg: 'bg-yellow-50' },
      { from: 'from-amber-100', to: 'to-orange-100', icon: 'text-amber-600/30', border: 'border-amber-200', bg: 'bg-amber-50' },
      { from: 'from-orange-100', to: 'to-red-100', icon: 'text-orange-600/30', border: 'border-orange-200', bg: 'bg-orange-50' },
      { from: 'from-cyan-100', to: 'to-blue-100', icon: 'text-cyan-600/30', border: 'border-cyan-200', bg: 'bg-cyan-50' },
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

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedSupplier, products]);

  const loadProducts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      
      const response = await fetch('/api/sppg/supplier-products', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();
      setProducts(result.data || []);
      setLastUpdated(new Date());

      // Extract unique suppliers
      const uniqueSuppliers = Array.from(
        new Map(
          result.data.map((p: SupplierProduct) => [
            p.suppliers.id,
            { id: p.suppliers.id, name: p.suppliers.name }
          ])
        ).values()
      );
      setSuppliers(uniqueSuppliers);
    } catch (error) {
      console.error('Error loading products:', error);
      if (!silent) alert('Gagal memuat produk');
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadProducts(false);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diff < 5) return 'Baru saja';
    if (diff < 60) return `${diff} detik yang lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    return lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.commodities.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // Filter by supplier
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter((product) => product.supplier_id === selectedSupplier);
    }

    setFilteredProducts(filtered);
  };

  const handleContactSupplier = (phone: string, supplierName: string, commodityName: string) => {
    // Format phone number untuk WhatsApp (hapus +, -, spasi)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Jika nomor diawali 0, ganti dengan 62
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    
    // Pesan default
    const message = `Halo ${supplierName}, saya tertarik dengan produk ${commodityName}. Mohon informasi lebih lanjut.`;
    
    // Buka WhatsApp
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <CMSLayout title="Katalog Produk Pemasok">
      <div className="space-y-6">
        {/* Live Status Bar */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-4 shadow-lg shadow-green-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-300 rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full relative"></div>
              </div>
              <div className="text-white">
                <span className="font-semibold">Stok Live Update</span>
                {lastUpdated && (
                  <span className="text-green-100 text-sm ml-2">• Diperbarui {formatLastUpdated()}</span>
                )}
              </div>
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Stok
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-50 via-emerald-50/30 to-white py-12 rounded-2xl overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl"></div>
          
          <div className="relative px-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-green-500/30">
                <div className="relative mr-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping absolute"></div>
                  <div className="w-2 h-2 bg-white rounded-full relative"></div>
                </div>
                <IconTractor className="w-4 h-4" />
                <span>Stok Real-Time</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Katalog Produk
                <span className="block bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                  Langsung dari Pemasok
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Pantau stok terbaru secara real-time dan hubungi pemasok langsung untuk kebutuhan bahan pangan Program Makan Bergizi Gratis
              </p>
            </div>

            {/* Filters */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>

              {/* Supplier Filter */}
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm appearance-none"
              >
                <option value="all">Semua Pemasok</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            {!loading && (
              <div className="text-center mt-6 text-sm text-gray-600">
                Menampilkan <span className="font-semibold text-gray-900">{filteredProducts.length}</span> dari {products.length} produk
              </div>
            )}
          </div>
        </section>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat data stok terbaru...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconPackage className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada produk tersedia</h3>
            <p className="text-gray-600">Coba ubah kata kunci pencarian atau filter Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => {
              const gradient = getGradientByName(product.commodities.name);
              const CommodityIcon = getIconByName(product.commodities.name);
              
              return (
                <div
                  key={product.id}
                  className={`group bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isRefreshing ? 'animate-pulse' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Image */}
                  <div className={`relative h-48 bg-gradient-to-br ${gradient.from} ${gradient.to} overflow-hidden`}>
                    {!imageErrors.has(product.id) ? (
                      <img
                        src={getProductImageUrl(product.commodities.name)}
                        alt={product.commodities.name}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(product.id));
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CommodityIcon className={`w-20 h-20 ${gradient.icon} group-hover:scale-110 transition-transform`} />
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3">
                      {product.stock > 0 ? (
                        <span className="flex items-center gap-1.5 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                          <IconCheck className="w-3.5 h-3.5" />
                          Tersedia
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg animate-pulse">
                          <IconX className="w-3.5 h-3.5" />
                          Habis
                        </span>
                      )}
                    </div>

                    {/* Unit Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-green-700">{product.commodities.unit}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {product.commodities.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <IconTractor className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="line-clamp-1">{product.suppliers.name}</span>
                    </div>
                    
                    {product.commodities.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {product.commodities.description}
                      </p>
                    )}

                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      {/* Stock Display with Live Effect */}
                      <div className={`relative text-center rounded-xl px-4 py-4 border-2 overflow-hidden ${
                        product.stock > 0 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                          : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                      }`}>
                        {/* Shimmer effect for live update feel */}
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                        
                        <div className="relative">
                          <div className="flex items-center justify-center gap-1.5 mb-2">
                            <div className="relative">
                              <div className={`w-2 h-2 rounded-full animate-ping absolute ${product.stock > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                              <div className={`w-2 h-2 rounded-full relative ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                              Stok Real-Time
                            </p>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                            <IconScale className={`w-6 h-6 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`} />
                            <p className={`text-3xl font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {product.stock.toLocaleString('id-ID')}
                            </p>
                            <span className="text-sm text-gray-700 font-semibold">{product.commodities.unit}</span>
                          </div>
                          {product.stock > 0 && product.stock <= 10 && (
                            <p className="text-xs text-amber-600 font-medium mt-2 flex items-center justify-center gap-1">
                              <IconAlertCircle className="w-3.5 h-3.5" />
                              Stok menipis!
                            </p>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      <button
                        onClick={() => handleContactSupplier(
                          product.suppliers.phone, 
                          product.suppliers.name, 
                          product.commodities.name
                        )}
                        disabled={product.stock <= 0}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                          product.stock > 0
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 hover:shadow-xl'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {product.stock > 0 ? (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span>Hubungi via WhatsApp</span>
                          </>
                        ) : (
                          'Stok Habis'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Styles for Shimmer Animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </CMSLayout>
  );
}
