'use client';

import { useState } from 'react';
import { IconSearch, IconFilter, IconX, IconCalendar } from '@tabler/icons-react';

interface SPPGOption {
  id: string;
  name: string;
  type: string;
}

interface MenuFiltersProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  filters: {
    sppgId: string;
    date: string;
  };
  onFilter: (filters: { sppgId: string; date: string }) => void;
  sppgOptions: SPPGOption[];
}

export default function MenuFilters({
  searchTerm,
  onSearch,
  filters,
  onFilter,
  sppgOptions
}: MenuFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const handleFilterChange = (key: string, value: string) => {
    onFilter({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onSearch('');
    onFilter({ sppgId: '', date: '' });
  };

  const hasActiveFilters = searchTerm || filters.sppgId || filters.date;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter & Pencarian</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <IconX className="w-4 h-4" />
              Hapus Filter
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
          >
            <IconFilter className="w-4 h-4" />
            {showAdvanced ? 'Sembunyikan' : 'Filter Lanjutan'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cari Menu
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Nama menu, bahan, deskripsi..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Menu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconCalendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SPPG (Dapur)
            </label>
            <select
              value={filters.sppgId}
              onChange={(e) => handleFilterChange('sppgId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Semua SPPG</option>
              {sppgOptions.map((sppg) => (
                <option key={sppg.id} value={sppg.id}>
                  {sppg.name} ({sppg.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Pencarian: &quot;{searchTerm}&quot;
              <button
                onClick={() => onSearch('')}
                className="ml-1 hover:text-orange-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.date && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Tanggal: {new Date(filters.date).toLocaleDateString('id-ID')}
              <button
                onClick={() => handleFilterChange('date', '')}
                className="ml-1 hover:text-blue-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.sppgId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              SPPG: {sppgOptions.find(s => s.id === filters.sppgId)?.name || 'Unknown'}
              <button
                onClick={() => handleFilterChange('sppgId', '')}
                className="ml-1 hover:text-green-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
