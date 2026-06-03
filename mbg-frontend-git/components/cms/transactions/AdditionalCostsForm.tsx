'use client';

import { useEffect, useState } from 'react';
import { IconPlus, IconTrash, IconCurrencyDollar } from '@tabler/icons-react';

interface AdditionalCost {
  id: string;
  name: string;
  description: string;
  unit_type: 'per_kg' | 'per_km' | 'flat' | 'percentage';
  default_amount: number;
  is_active: boolean;
}

interface SelectedCost {
  additional_cost_id: string;
  cost_name: string;
  description: string;
  unit_type: string;
  quantity: number;
  unit_amount: number;
  total_amount: number;
}

interface AdditionalCostsFormProps {
  selectedCosts: SelectedCost[];
  onCostsChange: (costs: SelectedCost[]) => void;
  totalTransactionAmount?: number;
}

export default function AdditionalCostsForm({ 
  selectedCosts, 
  onCostsChange,
  totalTransactionAmount = 0
}: AdditionalCostsFormProps) {
  const [availableCosts, setAvailableCosts] = useState<AdditionalCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableCosts();
  }, []);

  const fetchAvailableCosts = async () => {
    try {
      const response = await fetch('/api/cms/additional-costs?active=true');
      const data = await response.json();
      setAvailableCosts(data.data || []);
    } catch (error) {
      console.error('Error fetching additional costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCost = (cost: AdditionalCost) => {
    const newCost: SelectedCost = {
      additional_cost_id: cost.id,
      cost_name: cost.name,
      description: cost.description,
      unit_type: cost.unit_type,
      quantity: 1,
      unit_amount: cost.default_amount,
      total_amount: calculateTotal(cost.unit_type, 1, cost.default_amount, totalTransactionAmount)
    };
    onCostsChange([...selectedCosts, newCost]);
  };

  const handleRemoveCost = (index: number) => {
    const newCosts = selectedCosts.filter((_, i) => i !== index);
    onCostsChange(newCosts);
  };

  const handleUpdateCost = (index: number, field: 'quantity' | 'unit_amount', value: number) => {
    const newCosts = [...selectedCosts];
    newCosts[index] = {
      ...newCosts[index],
      [field]: value,
      total_amount: calculateTotal(
        newCosts[index].unit_type,
        field === 'quantity' ? value : newCosts[index].quantity,
        field === 'unit_amount' ? value : newCosts[index].unit_amount,
        totalTransactionAmount
      )
    };
    onCostsChange(newCosts);
  };

  const calculateTotal = (
    unitType: string, 
    quantity: number, 
    unitAmount: number,
    transactionAmount: number
  ): number => {
    switch (unitType) {
      case 'per_kg':
      case 'per_km':
        return quantity * unitAmount;
      case 'flat':
        return unitAmount;
      case 'percentage':
        return (transactionAmount * unitAmount) / 100;
      default:
        return 0;
    }
  };

  const getUnitLabel = (unitType: string): string => {
    switch (unitType) {
      case 'per_kg': return 'kg';
      case 'per_km': return 'km';
      case 'flat': return 'Nominal';
      case 'percentage': return '%';
      default: return '';
    }
  };

  const getTotalAdditionalCosts = (): number => {
    return selectedCosts.reduce((sum, cost) => sum + cost.total_amount, 0);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Biaya Tambahan (Opsional)
        </label>
        <div className="text-sm text-gray-500">
          Total Biaya: <span className="font-medium text-gray-900">
            Rp {getTotalAdditionalCosts().toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Selected Costs */}
      {selectedCosts.length > 0 && (
        <div className="space-y-3 border border-gray-200 rounded-lg p-4">
          {selectedCosts.map((cost, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cost.cost_name}</p>
                  {cost.description && (
                    <p className="text-xs text-gray-500 mt-1">{cost.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCost(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Quantity Input (except for flat and percentage) */}
                {cost.unit_type !== 'flat' && cost.unit_type !== 'percentage' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Jumlah ({getUnitLabel(cost.unit_type)})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cost.quantity}
                      onChange={(e) => handleUpdateCost(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Unit Amount */}
                {cost.unit_type !== 'percentage' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Harga per {getUnitLabel(cost.unit_type)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={cost.unit_amount}
                      onChange={(e) => handleUpdateCost(index, 'unit_amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Percentage Input */}
                {cost.unit_type === 'percentage' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Persentase (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={cost.unit_amount}
                      onChange={(e) => handleUpdateCost(index, 'unit_amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Total */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Total</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                    Rp {cost.total_amount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Cost Buttons */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-600 mb-2">Tambah Biaya:</p>
        <div className="flex flex-wrap gap-2">
          {availableCosts
            .filter(cost => !selectedCosts.find(sc => sc.additional_cost_id === cost.id))
            .map(cost => (
              <button
                key={cost.id}
                type="button"
                onClick={() => handleAddCost(cost)}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <IconPlus className="w-3 h-3 mr-1" />
                {cost.name}
              </button>
            ))}
        </div>
        {availableCosts.filter(cost => !selectedCosts.find(sc => sc.additional_cost_id === cost.id)).length === 0 && (
          <p className="text-xs text-gray-500 italic">Semua biaya tersedia sudah ditambahkan</p>
        )}
      </div>
    </div>
  );
}
