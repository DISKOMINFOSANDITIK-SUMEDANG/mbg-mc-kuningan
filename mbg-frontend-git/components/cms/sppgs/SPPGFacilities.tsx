'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconToolsKitchen2 } from '@tabler/icons-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface Facility {
  id: string;
  facility_name: string;
  created_at: string;
}

interface SPPGFacilitiesProps {
  sppgId: string;
}

export default function SPPGFacilities({ sppgId }: SPPGFacilitiesProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [facilityName, setFacilityName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadFacilities(); }, [sppgId]);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/facilities`));
      if (!response.ok) throw new Error('Gagal memuat fasilitas');
      setFacilities(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!facilityName.trim()) return;
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/facilities`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_name: facilityName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah fasilitas');
      setFacilityName(''); setIsAdding(false); loadFacilities();
    } catch (err: any) { setError(err.message); }
  };

  const handleEdit = async (id: string) => {
    if (!facilityName.trim()) return;
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/facilities/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_name: facilityName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal memperbarui fasilitas');
      setFacilityName(''); setEditingId(null); loadFacilities();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) return;
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/facilities/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus fasilitas');
      loadFacilities();
    } catch (err: any) { setError(err.message); }
  };

  const startEdit = (facility: Facility) => { setEditingId(facility.id); setFacilityName(facility.facility_name); };
  const cancelEdit = () => { setEditingId(null); setFacilityName(''); };
  const cancelAdd = () => { setIsAdding(false); setFacilityName(''); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-7 h-7 border-[2.5px] border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Fasilitas SPPG</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
        >
          <IconPlus className="h-4 w-4" />
          Tambah Fasilitas
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <IconX className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <IconToolsKitchen2 className="h-5 w-5 text-blue-600" />
            </div>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              placeholder="Masukkan nama fasilitas"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => editingId ? handleEdit(editingId) : handleAdd()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <IconCheck className="h-4 w-4" />
              Simpan
            </button>
            <button
              onClick={() => editingId ? cancelEdit() : cancelAdd()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <IconX className="h-4 w-4" />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Facilities List */}
      {facilities.length === 0 && !isAdding ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-gray-200 bg-slate-50/40">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IconToolsKitchen2 className="h-7 w-7 text-slate-400" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-1">Belum Ada Fasilitas</h4>
          <p className="text-sm text-gray-400">Tambahkan fasilitas untuk SPPG ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {facilities.map((facility) => (
            <div key={facility.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <IconToolsKitchen2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{facility.facility_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(facility.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <button
                  onClick={() => startEdit(facility)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Edit"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(facility.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Hapus"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
