'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconChevronDown, IconX, IconSearch, IconLoader2 } from '@tabler/icons-react';

interface AsyncSearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface AsyncSearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  fetchOptions: (query: string) => Promise<AsyncSearchableSelectOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  initialLabel?: string;
}

export default function AsyncSearchableSelect({
  value,
  onChange,
  fetchOptions,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Ketik untuk mencari...",
  className = "",
  disabled = false,
  initialLabel = ""
}: AsyncSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<AsyncSearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync label when initialLabel prop changes (e.g. when editing a different record)
  useEffect(() => {
    setSelectedLabel(initialLabel);
  }, [initialLabel]);

  // Load initial options when dropdown opens
  useEffect(() => {
    if (isOpen && !searchQuery) {
      loadOptions('');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      loadOptions(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isOpen]);

  const loadOptions = async (query: string) => {
    setLoading(true);
    try {
      const results = await fetchOptions(query);
      setOptions(results);
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: AsyncSearchableSelectOption) => {
    onChange(option.value);
    setSelectedLabel(option.label);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedLabel('');
    setSearchQuery('');
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedLabel || selectedOption?.label || placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          ${!value ? 'text-gray-400' : 'text-gray-900'}
          ${value && !disabled ? 'pr-16' : ''}
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <div className="flex items-center gap-1">
          <IconChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>
      
      {/* Clear Button - Outside main button to avoid nesting */}
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded z-10"
        >
          <IconX className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <IconLoader2 className="h-5 w-5 text-gray-400 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Memuat...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchQuery ? 'Tidak ada hasil ditemukan' : 'Ketik untuk mencari'}
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-100
                    ${option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  `}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  )}
                </button>
              ))
            )}
          </div>

          {searchQuery && options.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              Menampilkan {options.length} hasil
            </div>
          )}
        </div>
      )}
    </div>
  );
}
