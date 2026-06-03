'use client';

import { useState } from 'react';
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';

interface SchoolFiltersProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  filters: {
    district: string;
    status: string;
    sppg: string;
  };
  onFilter: (filters: { district: string; status: string; sppg: string }) => void;
  availableDistricts: string[];
  availableSppgs: { id: string; name: string }[];
}

export default function SchoolFilters({
  searchTerm,
  onSearch,
  filters,
  onFilter,
  availableDistricts,
  availableSppgs
}: SchoolFiltersProps) {
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
    onFilter({ district: '', status: '', sppg: '' });
  };

  const hasActiveFilters = searchTerm || filters.district || filters.status || filters.sppg;

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
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <IconFilter className="w-4 h-4" />
            {showAdvanced ? 'Sembunyikan' : 'Filter Lanjutan'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cari Sekolah
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Nama sekolah, alamat, kecamatan..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kecamatan
            </label>
            <SearchableSelect
              value={filters.district}
              onChange={(value) => handleFilterChange('district', value)}
              placeholder="Semua Kecamatan"
              searchPlaceholder="Cari kecamatan..."
              options={[
                { value: '', label: 'Semua Kecamatan' },
                ...availableDistricts.map(district => ({
                  value: district,
                  label: district
                }))
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <SearchableSelect
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Semua Status"
              searchPlaceholder="Cari status..."
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'Active', label: 'Aktif' },
                { value: 'Pilot', label: 'Pilot' },
                { value: 'Inactive', label: 'Tidak Aktif' }
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SPPG
            </label>
            <SearchableSelect
              value={filters.sppg}
              onChange={(value) => handleFilterChange('sppg', value)}
              placeholder="Semua SPPG"
              searchPlaceholder="Cari SPPG..."
              options={[
                { value: '', label: 'Semua SPPG' },
                ...availableSppgs.map(sppg => ({
                  value: sppg.id,
                  label: sppg.name
                }))
              ]}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Pencarian: &quot;{searchTerm}&quot;
              <button
                onClick={() => onSearch('')}
                className="ml-1 hover:text-blue-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.district && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Kecamatan: {filters.district}
              <button
                onClick={() => handleFilterChange('district', '')}
                className="ml-1 hover:text-green-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 hover:text-yellow-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.sppg && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              SPPG: {availableSppgs.find(sppg => sppg.id === filters.sppg)?.name || filters.sppg}
              <button
                onClick={() => handleFilterChange('sppg', '')}
                className="ml-1 hover:text-purple-600"
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
