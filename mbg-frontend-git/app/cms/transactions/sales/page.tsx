'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface OfftakerProduct {
  id: string;
  markup_price: number;
  stock_quantity: number;
  supplier_stock: number; // Stock from supplier
  commodity_name: string;
  unit: string;
  offtaker_id: string;
}

interface SPPG {
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
  amount: number;
}

interface TransactionItem {
  offtaker_product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  available_stock: number;
}

function CreateSalesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('request_id');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [offtakerId, setOfftakerId] = useState<string | null>(null);

  const [products, setProducts] = useState<OfftakerProduct[]>([]);
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);

  // Step 1: Select SPPG
  const [selectedSppgId, setSelectedSppgId] = useState('');

  // Step 2: Items & Payment
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [selectedCosts, setSelectedCosts] = useState<SelectedAdditionalCost[]>([]);
  const [form, setForm] = useState({
    payment_status: 'pending',
    payment_method: 'cash',
    bank_name: '',
    account_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-populate from request if request_id is provided
    if (requestId && products.length > 0 && sppgs.length > 0) {
      loadRequestData(requestId);
    }
  }, [requestId, products, sppgs]);

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

      // Load SPPGs
      const sppgsRes = await fetch('/api/cms/sppgs', { credentials: 'include' });
      if (sppgsRes.ok) {
        const data = await sppgsRes.json();
        setSppgs(Array.isArray(data) ? data : []);
      }

      // Load offtaker products
      const productsRes = await fetch('/api/cms/offtaker-products', { credentials: 'include' });
      if (productsRes.ok) {
        const data = await productsRes.json();
        const productsData = data.data || [];
        setProducts(productsData); // Show all products, not just those with stock > 0
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

  const loadRequestData = async (requestId: string) => {
    try {
      const response = await fetch(`/api/offtaker/requests/${requestId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load request data');
      }

      const result = await response.json();
      const request = result.data;

      // Auto-select SPPG
      if (request.sppg_id) {
        setSelectedSppgId(request.sppg_id);
        setStep(2); // Move to step 2
      }

      // Auto-add product item
      const product = products.find(p => p.id === request.offtaker_product_id);
      if (product) {
        const newItem: TransactionItem = {
          offtaker_product_id: product.id,
          product_name: product.commodity_name,
          unit: request.offtaker_products.unit || product.unit,
          quantity: parseFloat(request.requested_quantity) || 1,
          unit_price: request.offtaker_products.markup_price || product.markup_price,
          subtotal: (request.offtaker_products.markup_price || product.markup_price) * parseFloat(request.requested_quantity || '1'),
          available_stock: product.supplier_stock || 0
        };
        setItems([newItem]);
      }

      // Add notes from request if any
      if (request.request_notes) {
        setForm(prev => ({
          ...prev,
          notes: `Request: ${request.request_notes}`
        }));
      }
    } catch (error) {
      console.error('Error loading request data:', error);
      setError('Gagal memuat data request');
    }
  };

  const handleAddItem = (product: OfftakerProduct) => {
    const exists = items.find(item => item.offtaker_product_id === product.id);
    if (exists) {
      setError(`${product.commodity_name} sudah ditambahkan`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newItem: TransactionItem = {
      offtaker_product_id: product.id,
      product_name: product.commodity_name,
      unit: product.unit,
      quantity: 1,
      unit_price: product.markup_price,
      subtotal: product.markup_price,
      available_stock: product.supplier_stock || 0
    };

    setItems([...items, newItem]);
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
      amount: firstCost.default_amount
    }]);
  };

  const handleUpdateCost = (index: number, field: string, value: any) => {
    const newCosts = [...selectedCosts];
    if (field === 'additional_cost_id') {
      const cost = additionalCosts.find(c => c.id === value);
      if (cost) {
        newCosts[index] = {
          additional_cost_id: cost.id,
          cost_name: cost.name,
          amount: cost.default_amount
        };
      }
    } else if (field === 'amount') {
      newCosts[index].amount = parseFloat(value) || 0;
    }
    setSelectedCosts(newCosts);
  };

  const handleRemoveCost = (index: number) => {
    setSelectedCosts(selectedCosts.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getAdditionalCostsTotal = () => {
    return selectedCosts.reduce((sum, cost) => sum + cost.amount, 0);
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

    if (!selectedSppgId) {
      setError('Pilih SPPG terlebih dahulu');
      return;
    }

    // Validate transfer payment details
    if (form.payment_method === 'transfer') {
      if (!form.bank_name) {
        setError('Nama bank wajib diisi untuk metode transfer');
        return;
      }
      if (!form.account_number) {
        setError('Nomor rekening wajib diisi untuk metode transfer');
        return;
      }
    }

    // Validate stock
    for (const item of items) {
      if (item.quantity > item.available_stock) {
        setError(`${item.product_name}: Jumlah (${item.quantity}) melebihi stok tersedia (${item.available_stock})`);
        return;
      }
    }

    setSaving(true);
    try {
      // Use the new offtaker-sales API
      const requestBody = {
        sppg_id: selectedSppgId,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        bank_name: form.payment_method === 'transfer' ? form.bank_name : null,
        account_number: form.payment_method === 'transfer' ? form.account_number : null,
        notes: form.notes,
        items: items.map(item => ({
          offtaker_product_id: item.offtaker_product_id,
          quantity: item.quantity,
          price_per_unit: item.unit_price
        })),
        additional_costs: selectedCosts.map(cost => ({
          additional_cost_id: cost.additional_cost_id,
          cost_name: cost.cost_name,
          unit_type: 'flat',
          quantity: null,
          unit_amount: cost.amount,
          total_amount: cost.amount
        })),
        product_request_id: requestId || null // Include request_id if present
      };

      const response = await fetch('/api/cms/offtaker-sales', {
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

      const result = await response.json();
      
      // Status request otomatis diupdate ke 'completed' oleh backend
      
      alert(`Penjualan berhasil dicatat!\nNo. Transaksi: ${result.data?.sale_number || '-'}`);
      router.push('/cms/reports/sales');
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const selectedSppg = sppgs.find(s => s.id === selectedSppgId);

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  href="/cms/transactions"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">Penjualan ke SPPG</h1>
                  <p className="text-green-100">
                    {step === 1 ? 'Pilih SPPG tujuan' : 'Tambahkan produk & atur pembayaran'}
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
                  step === 1 ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  {step === 2 ? <IconCheck className="h-5 w-5" /> : '1'}
                </div>
                <span className="font-medium text-gray-900">Pilih SPPG</span>
              </div>
              <div className="w-24 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
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
            /* Step 1: Select SPPG */
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
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

                {selectedSppg && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconBuilding className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{selectedSppg.name}</h4>
                        <p className="text-sm text-gray-600">{selectedSppg.address}</p>
                        {selectedSppg.phone && (
                          <p className="text-sm text-gray-600">📞 {selectedSppg.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedSppgId}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Products & Payment */
            <div className="space-y-6">
              {/* Selected SPPG Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Tujuan Penjualan:</div>
                    <div className="font-semibold text-gray-900">{selectedSppg?.name}</div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Ubah
                  </button>
                </div>
              </div>

              {/* Add Products */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tambah Produk</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Produk
                  </label>
                  <SearchableSelect
                    options={products.map(product => ({
                      value: product.id,
                      label: product.commodity_name,
                      description: `Rp ${product.markup_price.toLocaleString()} / ${product.unit} • Stok Supplier: ${product.supplier_stock || 0} ${product.unit}`
                    }))}
                    value=""
                    onChange={(value) => {
                      const product = products.find(p => p.id === value);
                      if (product) handleAddItem(product);
                    }}
                    placeholder="-- Pilih produk untuk ditambahkan --"
                    searchPlaceholder="Cari nama produk..."
                    emptyMessage="Tidak ada produk tersedia"
                  />
                </div>

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
                                <div className="text-sm text-gray-500">Stok: {item.available_stock} {item.unit}</div>
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
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
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
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <select
                              value={cost.additional_cost_id}
                              onChange={(e) => handleUpdateCost(index, 'additional_cost_id', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            >
                              {additionalCosts.map(ac => (
                                <option key={ac.id} value={ac.id}>{ac.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-48">
                            <input
                              type="number"
                              value={cost.amount}
                              onChange={(e) => handleUpdateCost(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="Nominal"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div className="w-32 text-right">
                            <span className="text-sm font-medium">Rp {cost.amount.toLocaleString()}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCost(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCosts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Biaya Tambahan:</span>
                      <span className="font-bold text-green-600">
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
                    ]}
                    value={form.payment_method}
                    onChange={(value) => setForm({ ...form, payment_method: value, bank_name: '', account_number: '' })}
                    placeholder="-- Pilih Metode --"
                    searchPlaceholder="Cari metode..."
                  />
                </div>

                {/* Bank Details - Only show if payment method is transfer */}
                {form.payment_method === 'transfer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <SearchableSelect
                      label="Nama Bank"
                      options={[
                        { value: 'BCA', label: 'Bank Central Asia (BCA)' },
                        { value: 'Mandiri', label: 'Bank Mandiri' },
                        { value: 'BRI', label: 'Bank Rakyat Indonesia (BRI)' },
                        { value: 'BNI', label: 'Bank Negara Indonesia (BNI)' },
                        { value: 'BTN', label: 'Bank Tabungan Negara (BTN)' },
                        { value: 'CIMB Niaga', label: 'CIMB Niaga' },
                        { value: 'Permata', label: 'Bank Permata' },
                        { value: 'Danamon', label: 'Bank Danamon' },
                        { value: 'BJB', label: 'Bank Jabar Banten (BJB)' },
                        { value: 'BNI Syariah', label: 'BNI Syariah' },
                        { value: 'BRI Syariah', label: 'BRI Syariah' },
                        { value: 'Bank Syariah Indonesia', label: 'Bank Syariah Indonesia (BSI)' },
                        { value: 'Muamalat', label: 'Bank Muamalat' },
                        { value: 'Mega', label: 'Bank Mega' },
                        { value: 'OCBC NISP', label: 'OCBC NISP' },
                        { value: 'Panin', label: 'Bank Panin' },
                        { value: 'Sinarmas', label: 'Bank Sinarmas' },
                        { value: 'UOB', label: 'United Overseas Bank (UOB)' },
                        { value: 'Bukopin', label: 'Bank Bukopin' },
                        { value: 'BPD Jabar', label: 'Bank Pembangunan Daerah Jawa Barat' },
                        { value: 'Lainnya', label: 'Bank Lainnya' }
                      ]}
                      value={form.bank_name}
                      onChange={(value) => setForm({ ...form, bank_name: value })}
                      placeholder="-- Pilih Bank --"
                      searchPlaceholder="Cari nama bank..."
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Rekening <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.account_number}
                        onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="Masukkan nomor rekening"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                )}

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

                {/* Grand Total */}
                <div className="mt-6 pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">TOTAL KESELURUHAN:</span>
                    <span className="text-2xl font-bold text-green-600">
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
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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

export default function CreateSalesPage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <CreateSalesPageContent />
    </Suspense>
  );
}
