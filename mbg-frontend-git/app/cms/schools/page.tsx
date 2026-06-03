'use client';

import { useState, useEffect } from 'react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import { IconPlus } from '@tabler/icons-react';
import SchoolForm from '@/components/cms/schools/SchoolForm';
import SchoolTable from '@/components/cms/schools/SchoolTable';
import SchoolFilters from '@/components/cms/schools/SchoolFilters';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface School {
  id: string;
  name: string;
  level: string;
  address: string;
  district: string;
  village: string;
  student_count: number;
  program_start_date: string;
  status: string;
  latitude?: number;
  longitude?: number;
  sppg_id?: string;
  sppgs?: {
    id: string;
    name: string;
    type: string;
  };
  created_at: string;
  updated_at: string;
}

interface SPPGOption {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [sppgOptions, setSppgOptions] = useState<SPPGOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    district: '',
    status: '',
    sppg: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableSppgs, setAvailableSppgs] = useState<{ id: string; name: string }[]>([]);

  // Fetch schools data
  const fetchSchools = async () => {
    try {
      setLoading(true);
      console.log('Fetching schools...');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.district && { district: filters.district }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sppg && { sppg: filters.sppg })
      });

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SCHOOLS}?${params}`), {
        credentials: 'include',
      });
      const data = await response.json();

      console.log('Schools response:', { response: response.ok, data });

      if (response.ok) {
        const schoolsData = Array.isArray(data) ? data : (data.data || []);
        setSchools(schoolsData);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        console.log('Schools loaded:', schoolsData.length);
      } else {
        console.error('Error fetching schools:', data.error);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SPPG options
  const fetchSppgOptions = async () => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/options`), {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        const options = Array.isArray(data) ? data : (data.data || []);
        setSppgOptions(options);
      } else {
        console.error('Error fetching SPPG options:', data.error);
      }
    } catch (error) {
      console.error('Error fetching SPPG options:', error);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [pagination.page, searchTerm, filters.district, filters.status, filters.sppg]);

  useEffect(() => {
    fetchSppgOptions();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters: { district: string; status: string; sppg: string }) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSchool(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSchool(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSchool(null);
    console.log('Form success handler called, fetching updated schools data...');
    fetchSchools();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sekolah ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SCHOOLS}/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchSchools();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Terjadi kesalahan saat menghapus sekolah');
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Sekolah</h1>
            <p className="mt-1 text-sm text-gray-600">
              Kelola data sekolah yang terdaftar dalam program Makan Bergizi Gratis
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconPlus className="h-5 w-5 mr-2" />
              Tambah Sekolah
            </button>
          </div>
        </div>

        {/* Filters */}
        <SchoolFilters
          searchTerm={searchTerm}
          onSearch={handleSearch}
          filters={filters}
          onFilter={handleFilter}
          availableDistricts={availableDistricts}
          availableSppgs={availableSppgs}
        />

        {/* Table */}
        <SchoolTable
          schools={schools}
          loading={loading}
          pagination={pagination}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
        />

        {/* Form Modal */}
        {showForm && (
          <SchoolForm
            school={editingSchool}
            sppgOptions={sppgOptions}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </CMSLayout>
  );
}
