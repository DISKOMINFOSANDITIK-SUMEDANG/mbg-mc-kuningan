'use client';

import { useEffect, useState } from 'react';
import { 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash,
  IconPackage,
  IconShoppingCart,
  IconCheck,
  IconLoader2,
  IconArrowRight,
  IconBuilding,
  IconUser
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface OfftakerProduct {
  id: string;
  offtaker_id: string;
  offtaker_name: string;
  supplier_product_id: string;
  commodity_name: string;
  category_name: string;
  supplier_name: string;
  supplier_price: number;
  markup_price: number;
  markup_percentage: number;
  stock_quantity: number;
  unit: string;
  is_available: boolean;
  notes: string;
  created_at: string;
}

interface SupplierProduct {
  id: string;
  commodity_name: string;
  category_name: string;
  supplier_name: string;
  supplier_id: string;
  price: number;
  stock: number;
  unit: string;
  is_available: boolean;
  availability_status: string;
  description: string;
  updated_at: string;
}

interface Offtaker {
  id: string;
  name: string;
}

export default function OfftakerProductsPage() {
  const [myProducts, setMyProducts] = useState<OfftakerProduct[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [offtakers, setOfftakers] = useState<Offtaker[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchMyProducts, setSearchMyProducts] = useState('');
  const [searchSupplierProducts, setSearchSupplierProducts] = useState('');
  const [selectedView, setSelectedView] = useState<'catalog' | 'add'>('catalog'); // catalog or add
  
  // For adding product
  const [selectedSupplierProduct, setSelectedSupplierProduct] = useState<SupplierProduct | null>(null);
  const [selectedOfftakerId, setSelectedOfftakerId] = useState('');
  const [markupPrice, setMarkupPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For editing
  const [editingProduct, setEditingProduct] = useState<OfftakerProduct | null>(null);

  useEffect(() => {
    fetchMyProducts();
    fetchSupplierProducts();
    fetchOfftakers();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const response = await fetch('/api/cms/offtaker-products');
      if (!response.ok) {
        console.error('Failed to fetch products:', response.status, response.statusText);
        setMyProducts([]);
        return;
      }
      const data = await response.json();
      setMyProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching my products:', error);
      setMyProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async () => {
    try {
      const response = await fetch('/api/cms/products?limit=500');
      if (!response.ok) {
        console.error('Failed to fetch supplier products:', response.status, response.statusText);
        setSupplierProducts([]);
        return;
      }
      const data = await response.json();
      const transformed = (data.data || []).map((p: any) => {
        // Handle potential array returns from relations
        const commodity = Array.isArray(p.commodities) ? p.commodities[0] : p.commodities;
        const supplier = Array.isArray(p.suppliers) ? p.suppliers[0] : p.suppliers;
        const category = Array.isArray(commodity?.commodity_categories) ? commodity?.commodity_categories[0] : commodity?.commodity_categories;
        
        return {
          id: p.id,
          commodity_name: commodity?.name || 'Unknown',
          category_name: category?.name || 'Unknown',
          supplier_name: supplier?.name || 'Unknown',
          supplier_id: p.supplier_id || '',
          price: p.price_per_unit || 0,
          stock: parseFloat(p.stock) || 0,
          unit: commodity?.unit || 'Kg',
          is_available: p.availability_status === 'available',
          availability_status: p.availability_status || 'unavailable',
          description: p.notes || '',
          updated_at: p.updated_at || ''
        };
      });
      setSupplierProducts(transformed);
    } catch (error) {
      console.error('Error fetching supplier products:', error);
      setSupplierProducts([]);
    }
  };

  const fetchOfftakers = async () => {
    try {
      const response = await fetch('/api/cms/offtakers');
      if (!response.ok) {
        console.error('Failed to fetch offtakers:', response.status, response.statusText);
        setOfftakers([]);
        return;
      }
      const data = await response.json();
      setOfftakers(data.data || []);
      // Auto-select first offtaker if only one exists
      if (data.data?.length === 1) {
        setSelectedOfftakerId(data.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching offtakers:', error);
      setOfftakers([]);
    }
  };

  const handleSelectSupplierProduct = (product: SupplierProduct) => {
    setSelectedSupplierProduct(product);
    setMarkupPrice(product.price.toString()); // Default to supplier price
    setIsAvailable(true);
    setNotes('');
    setError(null);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!selectedSupplierProduct) {
      setError('Pilih produk pemasok terlebih dahulu');
      return;
    }

    if (!selectedOfftakerId) {
      setError('Pilih offtaker terlebih dahulu');
      return;
    }

    if (!markupPrice || parseFloat(markupPrice) <= 0) {
      setError('Masukkan harga jual yang valid');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supplierPrice = selectedSupplierProduct.price;
      const markupPriceNum = parseFloat(markupPrice);
      const markupPercentage = ((markupPriceNum - supplierPrice) / supplierPrice) * 100;

      const response = await fetch('/api/cms/offtaker-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offtaker_id: selectedOfftakerId,
          supplier_product_id: selectedSupplierProduct.id,
          supplier_price: supplierPrice,
          markup_price: markupPriceNum,
          markup_percentage: markupPercentage,
          stock_quantity: 0,
          is_available: isAvailable,
          notes: notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menambahkan produk');
        return;
      }

      // Success
      setSelectedSupplierProduct(null);
      setMarkupPrice('');
      setNotes('');
      fetchMyProducts();
      setSelectedView('catalog');
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: OfftakerProduct) => {
    setEditingProduct(product);
    setMarkupPrice(product.markup_price.toString());
    setIsAvailable(product.is_available);
    setNotes(product.notes || '');
    setError(null);
    setSelectedView('add');
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!markupPrice || parseFloat(markupPrice) <= 0) {
      setError('Masukkan harga jual yang valid');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const markupPriceNum = parseFloat(markupPrice);
      const markupPercentage = ((markupPriceNum - editingProduct.supplier_price) / editingProduct.supplier_price) * 100;

      const response = await fetch(`/api/cms/offtaker-products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markup_price: markupPriceNum,
          markup_percentage: markupPercentage,
          is_available: isAvailable,
          notes: notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal mengupdate produk');
        return;
      }

      // Success
      setEditingProduct(null);
      setMarkupPrice('');
      setNotes('');
      fetchMyProducts();
      setSelectedView('catalog');
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Terjadi kesalahan saat mengupdate');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk dari katalog?')) return;

    try {
      const response = await fetch(`/api/cms/offtaker-products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMyProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus produk');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredMyProducts = myProducts.filter(p => 
    p.commodity_name?.toLowerCase().includes(searchMyProducts.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(searchMyProducts.toLowerCase())
  );

  const filteredSupplierProducts = supplierProducts.filter(p => 
    p.commodity_name?.toLowerCase().includes(searchSupplierProducts.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(searchSupplierProducts.toLowerCase())
  );

  const calculateProfit = (markupPrice: number, supplierPrice: number) => {
    return markupPrice - supplierPrice;
  };

  const calculateMarkupPercentage = () => {
    if (!selectedSupplierProduct || !markupPrice) return 0;
    const markupPriceNum = parseFloat(markupPrice);
    const supplierPrice = selectedSupplierProduct.price;
    return ((markupPriceNum - supplierPrice) / supplierPrice) * 100;
  };

  const calculateEditMarkupPercentage = () => {
    if (!editingProduct || !markupPrice) return 0;
    const markupPriceNum = parseFloat(markupPrice);
    const supplierPrice = editingProduct.supplier_price;
    return ((markupPriceNum - supplierPrice) / supplierPrice) * 100;
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-4 md:space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 md:p-2.5 rounded-lg">
                <IconPackage className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Katalog Produk</h1>
                <p className="text-green-100 text-xs md:text-sm mt-0.5">
                  Pilih produk pemasok & tentukan harga jual ke SPPG
                </p>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  setSelectedView('catalog');
                  setSelectedSupplierProduct(null);
                  setEditingProduct(null);
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 md:px-4 rounded-lg font-medium transition-all ${
                  selectedView === 'catalog'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <IconPackage className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">
                  <span className="hidden sm:inline">Katalog Saya </span>
                  <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-5 md:h-6 px-1.5 md:px-2 rounded-full text-xs font-semibold ${
                    selectedView === 'catalog' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {myProducts.length}
                  </span>
                </span>
              </button>
              <button
                onClick={() => {
                  setSelectedView('add');
                  setSelectedSupplierProduct(null);
                  setEditingProduct(null);
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 md:px-4 rounded-lg font-medium transition-all ${
                  selectedView === 'add'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <IconPlus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">
                  <span className="hidden sm:inline">Tambah </span>
                  <span className="sm:hidden">Tambah</span>
                  <span className="hidden md:inline">dari Pemasok</span>
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          {selectedView === 'catalog' ? (
            /* MY CATALOG VIEW */
            <div>
              {/* Search Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Produk
                </label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nama produk, kategori, atau pemasok..."
                    value={searchMyProducts}
                    onChange={(e) => setSearchMyProducts(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                {filteredMyProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Menampilkan <span className="font-semibold text-gray-900">{filteredMyProducts.length}</span> dari{' '}
                      <span className="font-semibold text-gray-900">{myProducts.length}</span> produk
                    </p>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-600">Memuat katalog produk...</p>
                  </div>
                </div>
              ) : filteredMyProducts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-gray-100 p-4 rounded-full">
                      <IconPackage className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-base md:text-lg font-medium text-gray-900 mb-2">
                        {searchMyProducts ? 'Produk tidak ditemukan' : 'Belum ada produk di katalog'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchMyProducts 
                          ? 'Coba gunakan kata kunci lain' 
                          : 'Tambahkan produk dari pemasok untuk memulai'}
                      </p>
                      {!searchMyProducts && (
                        <button
                          onClick={() => setSelectedView('add')}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                        >
                          <IconPlus className="h-4 w-4" />
                          Tambah Produk dari Pemasok
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredMyProducts.map((product) => {
                    const profit = calculateProfit(product.markup_price, product.supplier_price);
                    const profitPercentage = ((product.markup_price - product.supplier_price) / product.supplier_price) * 100;

                    return (
                      <div 
                        key={product.id} 
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base">
                                {product.commodity_name}
                              </h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <IconPackage className="h-3 w-3" />
                                {product.category_name}
                              </p>
                            </div>
                            <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${
                              product.is_available
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {product.is_available ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Supplier Info */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            <IconBuilding className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{product.supplier_name}</span>
                          </div>
                          
                          {/* Pricing Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Harga Pemasok</p>
                              <p className="text-sm font-semibold text-gray-900">
                                Rp {product.supplier_price.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs text-gray-500 mb-1">Harga Jual</p>
                              <p className="text-sm font-bold text-green-700">
                                Rp {product.markup_price.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          {/* Profit Info */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-blue-700 font-medium">Profit per {product.unit}</p>
                              <p className="text-sm font-bold text-blue-900">
                                +Rp {profit.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1 bg-blue-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-blue-900">
                                +{profitPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          {product.notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-xs text-amber-900 italic line-clamp-2">
                                {product.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-5 gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="col-span-4 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              <IconEdit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex items-center justify-center px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ADD FROM SUPPLIER VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Left: Supplier Products List */}
              <div className="space-y-4">
                {/* Search Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <IconPackage className="h-5 w-5 text-blue-600" />
                    Produk dari Pemasok
                  </h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cari Produk
                  </label>
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nama produk, kategori, atau pemasok..."
                      value={searchSupplierProducts}
                      onChange={(e) => setSearchSupplierProducts(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  {filteredSupplierProducts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Ditemukan <span className="font-semibold text-gray-900">{filteredSupplierProducts.length}</span> produk
                      </p>
                    </div>
                  )}
                </div>

                {/* Products List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredSupplierProducts.length === 0 ? (
                      <div className="p-8 md:p-12 text-center">
                        <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                          <IconPackage className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">Produk tidak ditemukan</p>
                        <p className="text-sm text-gray-500">Coba gunakan kata kunci lain</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredSupplierProducts.map((product) => {
                          const isSelected = selectedSupplierProduct?.id === product.id;
                          const isAlreadyAdded = myProducts.some(p => p.supplier_product_id === product.id);
                          const hasLowStock = product.stock > 0 && product.stock < 100;

                          return (
                            <div
                              key={product.id}
                              onClick={() => !isAlreadyAdded && handleSelectSupplierProduct(product)}
                              className={`p-4 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 border-l-4 border-blue-600'
                                  : isAlreadyAdded
                                  ? 'bg-gray-50 cursor-not-allowed opacity-60'
                                  : product.stock === 0
                                  ? 'bg-red-50/50 hover:bg-red-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Product Name & Status */}
                                  <div className="flex items-start gap-2 flex-wrap mb-2">
                                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                                      {product.commodity_name}
                                    </h4>
                                    {isAlreadyAdded && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                        <IconCheck className="h-3 w-3" />
                                        Ditambahkan
                                      </span>
                                    )}
                                    {product.stock === 0 && (
                                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                                        Stok Habis
                                      </span>
                                    )}
                                    {hasLowStock && (
                                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                                        Stok Menipis
                                      </span>
                                    )}
                                  </div>

                                  {/* Supplier & Category */}
                                  <div className="space-y-1 mb-2">
                                    <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                                      <IconBuilding className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate">{product.supplier_name}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">{product.category_name}</p>
                                  </div>
                                  
                                  {/* Stock Info */}
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                    product.stock === 0 ? 'bg-red-100 text-red-700' :
                                    hasLowStock ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    <IconPackage className="h-3.5 w-3.5" />
                                    <span>{product.stock.toLocaleString('id-ID')} {product.unit}</span>
                                  </div>
                                  
                                  {/* Description */}
                                  {product.description && (
                                    <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">
                                      {product.description}
                                    </p>
                                  )}
                                </div>

                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                  <p className="text-base md:text-lg font-bold text-gray-900">
                                    Rp {product.price.toLocaleString('id-ID')}
                                  </p>
                                  <p className="text-xs text-gray-500">per {product.unit}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Add/Edit Form */}
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                  {editingProduct ? (
                    <>
                      {/* Edit Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-4 md:px-6 py-4">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                          <IconEdit className="h-5 w-5 text-blue-600" />
                          Edit Produk
                        </h3>
                      </div>

                      <div className="p-4 md:p-6 space-y-4">
                        {/* Product Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 mb-1">{editingProduct.commodity_name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                <IconBuilding className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{editingProduct.supplier_name}</span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Harga Pemasok</span>
                            <span className="font-semibold text-gray-900">
                              Rp {editingProduct.supplier_price.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
                            <p className="font-medium">{error}</p>
                          </div>
                        )}

                        {/* Form Fields */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Harga Jual ke SPPG <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            value={markupPrice}
                            onChange={(e) => setMarkupPrice(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Masukkan harga jual"
                          />
                          {markupPrice && (
                            <div className="mt-3 space-y-2">
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-blue-700 font-medium">Markup</span>
                                  <span className="font-bold text-blue-900">
                                    {calculateEditMarkupPercentage().toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex-1 bg-blue-200 rounded-full h-1.5 overflow-hidden mt-2">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(calculateEditMarkupPercentage(), 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-green-700 font-medium">
                                    Profit per {editingProduct.unit}
                                  </span>
                                  <span className="text-sm font-bold text-green-900">
                                    +Rp {(parseFloat(markupPrice) - editingProduct.supplier_price).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            id="is_available_edit"
                            checked={isAvailable}
                            onChange={(e) => setIsAvailable(e.target.checked)}
                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="is_available_edit" className="text-sm text-gray-700 cursor-pointer">
                            <span className="font-medium">Produk aktif untuk dijual ke SPPG</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Produk yang aktif akan tampil di katalog SPPG
                            </p>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Catatan
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                            placeholder="Tambahkan catatan untuk produk ini (opsional)"
                          />
                        </div>
                      </div>

                      {/* Form Footer */}
                      <div className="bg-gray-50 border-t border-gray-200 px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3">
                          <button
                            onClick={() => {
                              setEditingProduct(null);
                              setMarkupPrice('');
                              setNotes('');
                              setError(null);
                            }}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleUpdateProduct}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {saving && <IconLoader2 className="h-4 w-4 animate-spin" />}
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : selectedSupplierProduct ? (
                    <>
                      {/* Add Header */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-4 md:px-6 py-4">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                          <IconPlus className="h-5 w-5 text-green-600" />
                          Tambah ke Katalog
                        </h3>
                      </div>

                      <div className="p-4 md:p-6 space-y-4">
                        {/* Product Summary */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 mb-1">{selectedSupplierProduct.commodity_name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                                <IconBuilding className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{selectedSupplierProduct.supplier_name}</span>
                              </p>
                              <p className="text-xs text-gray-500">{selectedSupplierProduct.category_name}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Harga Pemasok</span>
                            <span className="font-semibold text-gray-900">
                              Rp {selectedSupplierProduct.price.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
                            <p className="font-medium">{error}</p>
                          </div>
                        )}

                        {/* Offtaker Selection */}
                        {offtakers.length > 1 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                              Offtaker <span className="text-red-600">*</span>
                            </label>
                            <div className="space-y-2">
                              {offtakers.map(offtaker => (
                                <label 
                                  key={offtaker.id} 
                                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                    selectedOfftakerId === offtaker.id
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="offtaker"
                                    value={offtaker.id}
                                    checked={selectedOfftakerId === offtaker.id}
                                    onChange={(e) => setSelectedOfftakerId(e.target.value)}
                                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-2 focus:ring-green-500"
                                  />
                                  <div className="flex items-center gap-2">
                                    <IconUser className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">{offtaker.name}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Price Input */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Harga Jual ke SPPG <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            value={markupPrice}
                            onChange={(e) => setMarkupPrice(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Masukkan harga jual"
                          />
                          {markupPrice && (
                            <div className="mt-3 space-y-2">
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-blue-700 font-medium">Markup</span>
                                  <span className="font-bold text-blue-900">
                                    {calculateMarkupPercentage().toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex-1 bg-blue-200 rounded-full h-1.5 overflow-hidden mt-2">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(calculateMarkupPercentage(), 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-green-700 font-medium">
                                    Profit per {selectedSupplierProduct.unit}
                                  </span>
                                  <span className="text-sm font-bold text-green-900">
                                    +Rp {(parseFloat(markupPrice) - selectedSupplierProduct.price).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Availability Checkbox */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            id="is_available_new"
                            checked={isAvailable}
                            onChange={(e) => setIsAvailable(e.target.checked)}
                            className="mt-0.5 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <label htmlFor="is_available_new" className="text-sm text-gray-700 cursor-pointer">
                            <span className="font-medium">Produk aktif untuk dijual ke SPPG</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Produk yang aktif akan tampil di katalog SPPG
                            </p>
                          </label>
                        </div>

                        {/* Notes Textarea */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Catatan
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                            placeholder="Tambahkan catatan untuk produk ini (opsional)"
                          />
                        </div>
                      </div>

                      {/* Form Footer */}
                      <div className="bg-gray-50 border-t border-gray-200 px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3">
                          <button
                            onClick={() => {
                              setSelectedSupplierProduct(null);
                              setMarkupPrice('');
                              setNotes('');
                              setError(null);
                            }}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveProduct}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <IconLoader2 className="h-4 w-4 animate-spin" />
                                <span>Menambahkan...</span>
                              </>
                            ) : (
                              <>
                                <IconPlus className="h-4 w-4" />
                                <span>Tambah ke Katalog</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 md:p-12 text-center">
                      <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                        <IconPackage className="h-12 w-12 md:h-16 md:w-16 text-blue-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                        Pilih Produk Pemasok
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Pilih produk dari daftar sebelah kiri untuk menambahkannya ke katalog Anda
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <p className="text-xs text-blue-900 font-medium mb-2">Tips:</p>
                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                          <li>Gunakan pencarian untuk menemukan produk dengan cepat</li>
                          <li>Perhatikan status stok sebelum menambahkan produk</li>
                          <li>Tentukan harga jual yang kompetitif untuk SPPG</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
