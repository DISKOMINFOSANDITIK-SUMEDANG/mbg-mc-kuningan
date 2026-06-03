'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCheck,
  IconPlus,
  IconTrash,
  IconShoppingCart,
  IconBuilding
} from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';

interface Product {
  id: string;
  price_per_unit: number;
  stock: number;
  supplier_id: string;
  commodities?: {
    id: string;
    name: string;
    unit: string;
  };
  suppliers?: {
    id: string;
    name: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface AdditionalCost {
  id: string;
  name: string;
  unit_type: 'per_kg' | 'per_km' | 'flat' | 'percentage';
  default_amount: number;
}

interface SelectedAdditionalCost {
  additional_cost_id: string;
  cost_name: string;
  unit_type: string;
  quantity: number;
  unit_amount: number;
  total_amount: number;
}

interface TransactionItem {
  supplier_product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [offtakerId, setOfftakerId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [searchProduct, setSearchProduct] = useState('');

  // Step 1: Select Supplier
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Step 2: Items & Payment
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [selectedCosts, setSelectedCosts] = useState<SelectedAdditionalCost[]>([]);
  const [form, setForm] = useState({
    payment_status: 'pending',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user info
      const userRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.role);
        setOfftakerId(userData.offtakerId);
      }

      // Load suppliers
      const suppliersRes = await fetch('/api/cms/suppliers?limit=1000', { credentials: 'include' });
      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        const suppliersArray = Array.isArray(data) ? data : (data.data || []);
        setSuppliers(suppliersArray);
      }

      // Load supplier products
      const productsRes = await fetch('/api/cms/supplier-products', { credentials: 'include' });
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : (data.data || []));
      }

      // Load additional costs
      const costsRes = await fetch('/api/cms/additional-costs', { credentials: 'include' });
      if (costsRes.ok) {
        const data = await costsRes.json();
        setAdditionalCosts(data.data || []);
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
      setError(`${product.commodities?.name || 'Produk'} sudah ditambahkan`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newItem: TransactionItem = {
      supplier_product_id: product.id,
      product_name: product.commodities?.name || '-',
      unit: product.commodities?.unit || '-',
      quantity: 1,
      unit_price: product.price_per_unit,
      subtotal: product.price_per_unit
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

  const handleAddCost = () => {
    if (additionalCosts.length === 0) return;
    const firstCost = additionalCosts[0];
    
    setSelectedCosts([...selectedCosts, {
      additional_cost_id: firstCost.id,
      cost_name: firstCost.name,
      unit_type: firstCost.unit_type,
      quantity: 1,
      unit_amount: firstCost.default_amount,
      total_amount: firstCost.default_amount
    }]);
  };

  const handleUpdateCost = (index: number, field: string, value: any) => {
    const newCosts = [...selectedCosts];
    if (field === 'additional_cost_id') {
      const cost = additionalCosts.find(c => c.id === value);
      if (cost) {
        newCosts[index] = {
          ...newCosts[index],
          additional_cost_id: cost.id,
          cost_name: cost.name,
          unit_type: cost.unit_type,
          unit_amount: cost.default_amount,
          total_amount: calculateCostTotal(cost.unit_type, newCosts[index].quantity, cost.default_amount)
        };
      }
    } else {
      newCosts[index] = { ...newCosts[index], [field]: value };
      
      if (field === 'quantity' || field === 'unit_amount') {
        newCosts[index].total_amount = calculateCostTotal(
          newCosts[index].unit_type,
          field === 'quantity' ? value : newCosts[index].quantity,
          field === 'unit_amount' ? value : newCosts[index].unit_amount
        );
      }
    }
    setSelectedCosts(newCosts);
  };

  const handleRemoveCost = (index: number) => {
    setSelectedCosts(selectedCosts.filter((_, i) => i !== index));
  };

  const calculateCostTotal = (unitType: string, quantity: number, unitAmount: number) => {
    if (unitType === 'flat') return unitAmount;
    if (unitType === 'percentage') {
      const totalAmount = getTotalAmount();
      return (totalAmount * unitAmount) / 100;
    }
    return quantity * unitAmount;
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getAdditionalCostsTotal = () => {
    return selectedCosts.reduce((sum, cost) => sum + cost.total_amount, 0);
  };

  const getGrandTotal = () => {
    return getTotalAmount() + getAdditionalCostsTotal();
  };

  const handleSubmit = async () => {
    setError(null);

    if (items.length === 0) {
      setError('Tambahkan minimal 1 produk');
      return;
    }

    if (!selectedSupplierId) {
      setError('Pilih pemasok terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      // Save each item as a separate purchase (each product from supplier)
      const results = [];
      for (const item of items) {
        const requestBody = {
          supplier_id: selectedSupplierId,
          supplier_product_id: item.supplier_product_id,
          quantity: item.quantity,
          price_per_unit: item.unit_price,
          notes: form.notes,
          additional_costs: items.indexOf(item) === 0 ? selectedCosts.map(cost => ({
            cost_type_id: cost.additional_cost_id,
            description: cost.cost_name,
            amount: cost.unit_amount,
            quantity: cost.quantity
          })) : [] // Only add costs to first item
        };

        const response = await fetch('/api/cms/offtaker-purchases', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Gagal menyimpan transaksi');
          return;
        }
        results.push(await response.json());
      }

      alert(`Berhasil mencatat ${results.length} pembelian dari pemasok`);
      router.push('/cms/transactions');
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const filteredProducts = products.filter(p =>
    p.commodities?.name?.toLowerCase().includes(searchProduct.toLowerCase()) &&
    p.supplier_id === selectedSupplierId
  );

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  href="/cms/transactions"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">Pembelian dari Pemasok</h1>
                  <p className="text-orange-100">
                    {step === 1 ? 'Pilih pemasok' : 'Tambahkan produk & atur pembayaran'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === 1 ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
                }`}>
                  {step === 2 ? <IconCheck className="h-5 w-5" /> : '1'}
                </div>
                <span className="font-medium text-gray-900">Pilih Pemasok</span>
              </div>
              <div className="w-24 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Produk & Pembayaran
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {loading ? (
            <PageLoadingState message="Memuat data..." />
          ) : step === 1 ? (
            /* Step 1: Select Supplier */
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
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

                {selectedSupplier && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconBuilding className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{selectedSupplier.name}</h4>
                        <p className="text-sm text-gray-600">{selectedSupplier.address}</p>
                        {selectedSupplier.phone && (
                          <p className="text-sm text-gray-600">📞 {selectedSupplier.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedSupplierId}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Products & Payment */
            <div className="space-y-6">
              {/* Selected Supplier Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Pembelian dari:</div>
                    <div className="font-semibold text-gray-900">{selectedSupplier?.name}</div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Ubah
                  </button>
                </div>
              </div>

              {/* Add Products */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tambah Produk</h3>

                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Cari produk untuk ditambahkan..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />

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
                              <div className="font-medium text-gray-900">{product.commodities?.name || '-'}</div>
                              <div className="text-sm text-gray-600">
                                Rp {product.price_per_unit.toLocaleString()} / {product.commodities?.unit || '-'}
                              </div>
                            </div>
                            <IconPlus className="h-5 w-5 text-orange-600" />
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
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  className="w-28 px-2 py-1 text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQuantity(index, parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.1"
                                    className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                  />
                                  <span className="text-sm text-gray-600">{item.unit}</span>
                                </div>
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
                              Subtotal:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
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

              {/* Additional Costs */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Biaya Tambahan</h3>
                  <button
                    type="button"
                    onClick={handleAddCost}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    + Tambah Biaya
                  </button>
                </div>

                {selectedCosts.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada biaya tambahan</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCosts.map((cost, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-4">
                            <select
                              value={cost.additional_cost_id}
                              onChange={(e) => handleUpdateCost(index, 'additional_cost_id', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              {additionalCosts.map(ac => (
                                <option key={ac.id} value={ac.id}>{ac.name}</option>
                              ))}
                            </select>
                          </div>
                          {cost.unit_type !== 'flat' && cost.unit_type !== 'percentage' && (
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={cost.quantity}
                                onChange={(e) => handleUpdateCost(index, 'quantity', parseFloat(e.target.value) || 0)}
                                placeholder="Qty"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                          )}
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={cost.unit_amount}
                              onChange={(e) => handleUpdateCost(index, 'unit_amount', parseFloat(e.target.value) || 0)}
                              placeholder="Nominal"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-end text-sm font-medium">
                            Rp {cost.total_amount.toLocaleString()}
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCost(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCosts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Biaya Tambahan:</span>
                      <span className="font-bold text-orange-600">
                        Rp {getAdditionalCostsTotal().toLocaleString()}
                      </span>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Grand Total */}
                <div className="mt-6 pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">TOTAL KESELURUHAN:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      Rp {getGrandTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || items.length === 0}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
