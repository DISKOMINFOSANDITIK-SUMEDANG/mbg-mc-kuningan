'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconCheck, IconShoppingCart, IconPlus, IconTrash, IconBuilding, IconDeviceFloppy } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import Link from 'next/link';
import SearchableSelect from '@/components/shared/SearchableSelect';

interface Product {
  id: string;
  price_per_unit: number;
  stock: number;
  commodities: {
    id: string;
    name: string;
    unit: string;
  };
}

interface SPPG {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface TransactionItem {
  id?: string; // Optional for existing items
  supplier_product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  available_stock: number;
  original_quantity?: number; // Track original quantity for stock validation
}

interface ExistingTransaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  notes: string;
  supplier_id: string;
  sppg_id: string;
  sppgs?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  suppliers?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  sales_transaction_items?: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    supplier_product_id: string;
    supplier_products?: {
      id: string;
      stock: number;
      commodities?: {
        id: string;
        name: string;
        unit: string;
      };
    };
  }[];
}

export default function EditSalesPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSupplierId, setUserSupplierId] = useState<string | null>(null);
  
  const [transaction, setTransaction] = useState<ExistingTransaction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  
  const [selectedSppgId, setSelectedSppgId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [form, setForm] = useState({
    transaction_date: '',
    payment_status: 'pending',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user info
      const userRes = await fetch(buildApiUrl('/api/auth/me'), {
        credentials: 'include',
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('User Data:', userData);
        setUserRole(userData.role);
        
        // Get supplier_id if user is pemasok
        if (userData.role === 'pemasok') {
          const supplierUserRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-users/by-user/${userData.id}`), {
            credentials: 'include',
          });
          if (supplierUserRes.ok) {
            const supplierUserData = await supplierUserRes.json();
            console.log('Supplier User Data:', supplierUserData);
            if (supplierUserData && supplierUserData.supplier_id) {
              setUserSupplierId(supplierUserData.supplier_id);
            }
          }
        }
      }

      // Load transaction
      const transactionRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sales-transactions/${params.id}`), {
        credentials: 'include',
      });
      
      if (transactionRes.ok) {
        const data: ExistingTransaction = await transactionRes.json();
        console.log('Transaction data loaded:', data);
        
        if (!data.id) {
          setError('Data transaksi tidak valid');
          return;
        }
        
        setTransaction(data);
        setSelectedSppgId(data.sppg_id || '');
        setSelectedSupplierId(data.supplier_id || '');
        
        setForm({
          transaction_date: data.transaction_date || '',
          payment_status: data.payment_status || 'pending',
          payment_method: data.payment_method || 'cash',
          notes: data.notes || ''
        });

        // Convert existing items with null safety
        if (data.sales_transaction_items && Array.isArray(data.sales_transaction_items)) {
          const existingItems: TransactionItem[] = data.sales_transaction_items
            .filter(item => {
              const isValid = item?.supplier_products?.commodities?.name;
              if (!isValid) {
                console.warn('Invalid item filtered out:', item);
              }
              return isValid;
            })
            .map(item => {
              const originalQty = parseFloat(item.quantity?.toString() || '0');
              const currentStock = parseFloat(item.supplier_products!.stock?.toString() || '0');
              // Real available stock = current stock + original quantity (stock that was used in this transaction)
              const realAvailableStock = currentStock + originalQty;
              
              return {
                id: item.id,
                supplier_product_id: item.supplier_product_id,
                product_name: item.supplier_products!.commodities!.name,
                unit: item.supplier_products!.commodities!.unit,
                quantity: originalQty,
                unit_price: parseFloat(item.unit_price?.toString() || '0'),
                subtotal: parseFloat(item.subtotal?.toString() || '0'),
                available_stock: realAvailableStock,
                original_quantity: originalQty
              };
            });
          console.log('Items loaded:', existingItems.length);
          setItems(existingItems);
        } else {
          console.warn('No transaction items found');
          setItems([]);
        }
      } else {
        setError('Transaksi tidak ditemukan');
        return;
      }

      // Load products
      const productsRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/supplier-products`), {
        credentials: 'include',
      });
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : (data.data || []));
      }

      // Load SPPGs
      const sppgsRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sppgs`), {
        credentials: 'include',
      });
      if (sppgsRes.ok) {
        const data = await sppgsRes.json();
        setSppgs(Array.isArray(data) ? data : []);
      }

      // Load Suppliers (for admin only)
      const suppliersRes = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/suppliers?limit=1000`), {
        credentials: 'include',
      });
      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        const suppliersArray = Array.isArray(data) ? data : (data.data || []);
        setSuppliers(suppliersArray);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product: Product) => {
    const exists = items.find(item => item.supplier_product_id === product.id);
    if (exists) {
      setError(`${product.commodities.name} sudah ditambahkan`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newItem: TransactionItem = {
      supplier_product_id: product.id,
      product_name: product.commodities.name,
      unit: product.commodities.unit,
      quantity: 1,
      unit_price: product.price_per_unit,
      subtotal: product.price_per_unit,
      available_stock: product.stock,
      original_quantity: 0 // New item, no original quantity
    };

    setItems([...items, newItem]);
    setSearchProduct('');
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].subtotal = quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const handleUpdatePrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unit_price = price;
    newItems[index].subtotal = newItems[index].quantity * price;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async () => {
    setError(null);

    if (items.length === 0) {
      setError('Tambahkan minimal 1 produk');
      return;
    }

    // Validate stock
    for (const item of items) {
      if (item.quantity > item.available_stock) {
        setError(`${item.product_name}: Jumlah (${item.quantity}) melebihi stok tersedia (${item.available_stock})`);
        return;
      }
    }

    // Check if pemasok trying to edit other supplier's transaction
    if (userRole === 'pemasok' && userSupplierId && selectedSupplierId !== userSupplierId) {
      setError('Anda hanya bisa mengedit transaksi pemasok Anda sendiri');
      return;
    }

    setSaving(true);
    try {
      const requestBody: any = {
        sppg_id: selectedSppgId,
        transaction_date: form.transaction_date,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        notes: form.notes,
        items: items.map(item => ({
          id: item.id, // Include ID for existing items
          supplier_product_id: item.supplier_product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      // Add supplier_id for admin
      if (userRole === 'administrator' && selectedSupplierId) {
        requestBody.supplier_id = selectedSupplierId;
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_BASE}/sales-transactions/${params.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan transaksi');
        return;
      }

      router.push(`/cms/sales/${params.id}`);
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const selectedSppg = sppgs.find(s => s.id === selectedSppgId);
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const filteredProducts = products.filter(p => 
    p.commodities.name.toLowerCase().includes(searchProduct.toLowerCase()) &&
    p.stock > 0
  );

  if (loading) {
    return (
      <CMSLayout>
        <PageLoadingState message="Memuat data transaksi..." />
      </CMSLayout>
    );
  }

  if (error && !transaction) {
    return (
      <CMSLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/cms/reports/sales"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Transaksi</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700">{error}</p>
            <Link
              href="/cms/reports/sales"
              className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Kembali ke Laporan
            </Link>
          </div>
        </div>
      </CMSLayout>
    );
  }

  // Check if pemasok can edit this transaction
  if (userRole === 'pemasok' && userSupplierId && transaction && transaction.supplier_id !== userSupplierId) {
    return (
      <CMSLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/cms/reports/sales"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Transaksi</h1>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-700">Anda tidak memiliki akses untuk mengedit transaksi ini</p>
            <Link
              href="/cms/reports/sales"
              className="mt-4 inline-block px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Kembali ke Laporan
            </Link>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
            <div className="flex items-center gap-4">
              <Link
                href={`/cms/sales/${params.id}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Transaksi Penjualan</h1>
                <p className="text-gray-600 mt-1">
                  No. Transaksi: <span className="font-mono font-semibold">{transaction?.transaction_number}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* SPPG & Supplier Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Transaksi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Transaksi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Supplier Selection (Admin only) */}
                {userRole === 'administrator' && (
                  <SearchableSelect
                    label="Pilih Pemasok"
                    options={suppliers.map(supplier => ({
                      value: supplier.id,
                      label: supplier.name,
                      description: supplier.address + (supplier.phone ? ` • 📞 ${supplier.phone}` : '')
                    }))}
                    value={selectedSupplierId}
                    onChange={setSelectedSupplierId}
                    placeholder="-- Pilih Pemasok --"
                    searchPlaceholder="Cari pemasok..."
                    emptyMessage="Tidak ada pemasok tersedia"
                    required
                  />
                )}
              </div>

              {/* Selected Supplier Info for Pemasok */}
              {userRole === 'pemasok' && selectedSupplier && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <IconBuilding className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{selectedSupplier.name}</h4>
                      <p className="text-sm text-gray-600">{selectedSupplier.address}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <SearchableSelect
                  label="Pilih SPPG"
                  options={sppgs.map(sppg => ({
                    value: sppg.id,
                    label: sppg.name,
                    description: sppg.address + (sppg.phone ? ` • 📞 ${sppg.phone}` : '')
                  }))}
                  value={selectedSppgId}
                  onChange={setSelectedSppgId}
                  placeholder="-- Pilih SPPG --"
                  searchPlaceholder="Cari SPPG..."
                  emptyMessage="Tidak ada SPPG tersedia"
                  required
                />
              </div>

              {selectedSppg && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <IconBuilding className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{selectedSppg.name}</h4>
                      <p className="text-sm text-gray-600">{selectedSppg.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Produk</h3>
              
              {/* Search Product */}
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Cari produk untuk ditambahkan..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />

              {/* Product Quick Add */}
              {searchProduct && (
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto mb-4">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">Tidak ada produk ditemukan</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddItem(product)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{product.commodities.name}</div>
                            <div className="text-sm text-gray-600">
                              Rp {product.price_per_unit.toLocaleString()} / {product.commodities.unit} • 
                              Stok: {product.stock} {product.commodities.unit}
                            </div>
                          </div>
                          <IconPlus className="h-5 w-5 text-green-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              {items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <IconShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Belum ada produk ditambahkan</p>
                  <p className="text-sm text-gray-500 mt-1">Cari dan pilih produk di atas</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Harga</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{item.product_name}</div>
                              <div className="text-sm text-gray-500">
                                Stok tersedia: {item.available_stock} {item.unit}
                                {item.original_quantity && item.original_quantity > 0 && (
                                  <span className="text-blue-600"> (sudah digunakan: {item.original_quantity} {item.unit})</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                                min="0"
                                className="w-28 px-2 py-1 text-right border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(index, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  max={item.available_stock}
                                  step="0.1"
                                  className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-600">{item.unit}</span>
                              </div>
                              {item.quantity > item.available_stock && (
                                <p className="text-xs text-red-600 mt-1 text-center">Melebihi stok!</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              Rp {item.subtotal.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <IconTrash className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900">
                            TOTAL:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-green-700">
                            Rp {getTotalAmount().toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informasi Pembayaran</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Status Pembayaran"
                  options={[
                    { value: 'pending', label: 'Belum Lunas' },
                    { value: 'partial', label: 'Dibayar Sebagian' },
                    { value: 'paid', label: 'Lunas' }
                  ]}
                  value={form.payment_status}
                  onChange={(value) => setForm({ ...form, payment_status: value })}
                  placeholder="-- Pilih Status --"
                  searchPlaceholder="Cari status..."
                />

                <SearchableSelect
                  label="Metode Pembayaran"
                  options={[
                    { value: 'cash', label: 'Tunai' },
                    { value: 'transfer', label: 'Transfer' },
                    { value: 'credit', label: 'Kredit' }
                  ]}
                  value={form.payment_method}
                  onChange={(value) => setForm({ ...form, payment_method: value })}
                  placeholder="-- Pilih Metode --"
                  searchPlaceholder="Cari metode..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Catatan tambahan untuk transaksi ini..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Link
                href={`/cms/sales/${params.id}`}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Batal
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving || items.length === 0}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              >
                <IconDeviceFloppy className="h-5 w-5" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
