'use client';

import { useEffect, useState } from 'react';
import { IconBuilding, IconUsers, IconMapPin, IconSchool, IconUsersGroup, IconPlus, IconTrash, IconEdit, IconInfoCircle } from '@tabler/icons-react';
import AssignSchoolModal from './AssignSchoolModal';
import SchoolForm from '@/components/cms/schools/SchoolForm';

interface ServedSchool {
  id: string;
  name: string;
  address: string;
  district: string | null;
  village: string | null;
  student_count: number | null;
  level: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

interface ServedGroup {
  id: string;
  name: string;
  description: string;
}

interface ServedEntitiesListProps {
  sppgId: string;
  rawSchools: any[];
  rawGroups: any[];
}

export default function ServedEntitiesList({ sppgId, rawSchools, rawGroups }: ServedEntitiesListProps) {
  const [schools, setSchools] = useState<ServedSchool[]>([]);
  const [groups, setGroups] = useState<ServedGroup[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schools' | 'groups'>('schools');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [removingSchool, setRemovingSchool] = useState<string | null>(null);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [showCreateSchoolModal, setShowCreateSchoolModal] = useState(false);

  // Load schools
  useEffect(() => {
    let isMounted = true;
    
    const normalizeSchool = (s: any): ServedSchool | null => {
      if (!s) return null;
      return {
        id: s.id ?? '',
        name: s.name ?? 'Nama tidak tersedia',
        address: s.address ?? 'Alamat tidak tersedia',
        district: s.district ?? null,
        village: s.village ?? null,
        student_count: s.student_count ?? null,
        level: s.level ?? null,
        status: s.status ?? 'Unknown',
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null
      };
    };

    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        const normalizedSchools = rawSchools.map(normalizeSchool).filter(Boolean) as ServedSchool[];
        if (isMounted) {
          setSchools(normalizedSchools);
        }
      } finally {
        if (isMounted) setSchoolsLoading(false);
      }
    };

    loadSchools();
    return () => { isMounted = false; };
  }, [JSON.stringify(rawSchools)]);

  // Load groups
  useEffect(() => {
    let isMounted = true;
    
    const normalizeGroup = (g: any): ServedGroup | null => {
      if (!g) return null;
      return {
        id: g.id ?? '',
        name: g.name ?? 'Nama tidak tersedia',
        description: g.description ?? 'Deskripsi tidak tersedia'
      };
    };

    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const normalizedGroups = rawGroups.map(normalizeGroup).filter(Boolean) as ServedGroup[];
        if (isMounted) {
          setGroups(normalizedGroups);
        }
      } finally {
        if (isMounted) setGroupsLoading(false);
      }
    };

    loadGroups();
    return () => { isMounted = false; };
  }, [JSON.stringify(rawGroups)]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pilot':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRemoveSchool = async (schoolId: string, schoolName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${schoolName}" dari SPPG ini?`)) {
      return;
    }

    setRemovingSchool(schoolId);
    try {
      const response = await fetch(`/api/cms/served-entities/schools?school_id=${schoolId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || 'Gagal menghapus sekolah');
        return;
      }

      setSchools(prevSchools => prevSchools.filter(s => s.id !== schoolId));
      
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error removing school:', error);
      alert('Terjadi kesalahan saat menghapus sekolah');
    } finally {
      setRemovingSchool(null);
    }
  };

  const handleAssignSuccess = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleRegisterNew = (_searchQuery: string) => {
    setShowAssignModal(false);
    setShowCreateSchoolModal(true);
  };

  const handleCreateSchoolSuccess = () => {
    setShowCreateSchoolModal(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleEditSchool = (school: ServedSchool) => {
    setEditingSchool({
      id: school.id,
      name: school.name,
      level: school.level || 'SD',
      address: school.address,
      district: school.district || '',
      village: school.village || '',
      student_count: school.student_count || 0,
      program_start_date: new Date().toISOString().split('T')[0],
      status: school.status,
      latitude: school.latitude,
      longitude: school.longitude,
      sppg_id: sppgId,
      created_at: '',
      updated_at: ''
    });
  };

  const handleEditSuccess = () => {
    setEditingSchool(null);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleAssignSchool = async (schoolId: string, schoolName: string) => {
    try {
      const response = await fetch('/api/cms/served-entities/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ school_id: schoolId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Gagal menambahkan sekolah');
      }

      // Reload page to refresh data
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error assigning school:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Entitas yang Dilayani</h2>
          <p className="text-gray-600">Daftar sekolah dan kelompok yang dilayani oleh SPPG ini</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('schools')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'schools'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <IconSchool className="h-4 w-4 inline mr-2" />
            Sekolah ({schools.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'groups'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <IconUsersGroup className="h-4 w-4 inline mr-2" />
            Kelompok ({groups.length})
          </button>
        </div>
      </div>

      {/* Schools Tab */}
      {activeTab === 'schools' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <IconSchool className="h-5 w-5 mr-2 text-blue-600" />
              Sekolah yang Dilayani
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateSchoolModal(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Daftarkan Sekolah Baru
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Tambah Sekolah
              </button>
            </div>
          </div>

          {/* Narration banner */}
          <div className="mx-6 mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <IconInfoCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-semibold">Cara menambah sekolah: </span>
              Gunakan <span className="font-medium">"Tambah Sekolah"</span> untuk mencari dan menghubungkan sekolah yang sudah ada dalam sistem. Jika sekolah yang Anda layani belum terdaftar, klik <span className="font-medium">"Daftarkan Sekolah Baru"</span> untuk mendaftarkannya — sekolah akan otomatis terhubung ke SPPG Anda.
            </div>
          </div>
          <div className="p-6">
            {schoolsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse h-20" />
                ))}
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-12">
                <IconSchool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Belum ada sekolah yang dilayani</p>
                <p className="text-gray-400 text-sm mt-2">Sekolah akan muncul di sini setelah ditambahkan ke SPPG</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schools.map((school, index) => (
                  <div key={school.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconSchool className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">{school.name}</h4>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
                          {school.status}
                        </span>
                        <button
                          onClick={() => handleEditSchool(school)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit sekolah"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveSchool(school.id, school.name)}
                          disabled={removingSchool === school.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus sekolah dari SPPG"
                        >
                          {removingSchool === school.id ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <IconTrash className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <IconMapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{school.address}</span>
                      </div>
                      
                      {school.district && school.village && (
                        <div className="flex items-center space-x-2">
                          <IconMapPin className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{school.village}, {school.district}</span>
                        </div>
                      )}
                      
                      {school.student_count !== null && (
                        <div className="flex items-center space-x-2">
                          <IconUsers className="h-4 w-4 text-gray-400" />
                          <span>{school.student_count.toLocaleString()} siswa</span>
                        </div>
                      )}
                      
                      {school.level && (
                        <div className="flex items-center space-x-2">
                          <IconBuilding className="h-4 w-4 text-gray-400" />
                          <span>{school.level}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <IconUsersGroup className="h-5 w-5 mr-2 text-green-600" />
              Kelompok yang Dilayani
            </h3>
          </div>
          <div className="p-6">
            {groupsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse h-20" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <IconUsersGroup className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Belum ada kelompok yang dilayani</p>
                <p className="text-gray-400 text-sm mt-2">Kelompok akan muncul di sini setelah ditambahkan ke SPPG</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group, index) => (
                  <div key={group.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <IconUsersGroup className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{group.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Kelompok Masyarakat
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign School Modal */}
      <AssignSchoolModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignSchool}
        sppgId={sppgId}
        onRegisterNew={handleRegisterNew}
      />

      {/* Edit School Modal */}
      {editingSchool && (
        <SchoolForm
          school={editingSchool}
          sppgOptions={[]}
          onClose={() => setEditingSchool(null)}
          onSuccess={handleEditSuccess}
          disableName={true}
          hideStatusAndSppg={true}
        />
      )}

      {/* Create New School Modal */}
      {showCreateSchoolModal && (
        <SchoolForm
          school={null}
          sppgOptions={[]}
          onClose={() => setShowCreateSchoolModal(false)}
          onSuccess={handleCreateSchoolSuccess}
          hideStatusAndSppg={true}
          defaultSppgId={sppgId}
        />
      )}
    </div>
  );
}
