'use client';

import { useState, useEffect } from 'react';
import { IconPhoto, IconEdit, IconTrash, IconPlus, IconX, IconCheck } from '@tabler/icons-react';
import FileUpload from '@/components/cms/shared/FileUpload';
import FileDisplay from '@/components/cms/shared/FileDisplay';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface KitchenPhoto {
  id: string;
  sppg_id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SPPGKitchenPhotosProps {
  sppgId: string;
}

export default function SPPGKitchenPhotos({ sppgId }: SPPGKitchenPhotosProps) {
  const [photos, setPhotos] = useState<KitchenPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<KitchenPhoto | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadPhotos(); }, [sppgId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/kitchen-photos`));
      if (!response.ok) throw new Error('Gagal memuat foto dapur');
      setPhotos(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) { setError('URL foto harus diisi'); return; }
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/kitchen-photos`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: newPhotoUrl, caption: newPhotoCaption || null, display_order: photos.length }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah foto');
      setNewPhotoUrl(''); setNewPhotoCaption(''); loadPhotos();
    } catch (err: any) { setError(err.message); }
  };

  const handleEditPhoto = (photo: KitchenPhoto) => { setEditingPhoto(photo); setIsEditing(true); };

  const handleUpdatePhoto = async (photoId: string, caption: string, displayOrder: number) => {
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/kitchen-photos/${photoId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: caption || null, display_order: displayOrder }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal memperbarui foto');
      setIsEditing(false); setEditingPhoto(null); loadPhotos();
    } catch (err: any) { setError(err.message); }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/kitchen-photos/${photoId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus foto');
      loadPhotos();
    } catch (err: any) { setError(err.message); }
  };

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
        <h3 className="text-base font-semibold text-gray-900">Foto Dapur</h3>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {photos.length} foto
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <IconX className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Add Photo Form */}
      <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-5 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Tambah Foto Baru</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Upload Foto</label>
            <FileUpload
              onUpload={(url) => setNewPhotoUrl(url)}
              onRemove={() => setNewPhotoUrl('')}
              currentUrl={newPhotoUrl}
              accept="image/*"
              maxSize={10}
              folder="kitchen-photos"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Keterangan (Opsional)</label>
            <input
              type="text"
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              placeholder="Masukkan keterangan foto"
            />
          </div>
        </div>
        <button
          onClick={handleAddPhoto}
          disabled={!newPhotoUrl.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-100"
        >
          <IconPlus className="h-4 w-4" />
          Tambah Foto
        </button>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200">
              <div className="relative overflow-hidden">
                <FileDisplay
                  url={photo.photo_url}
                  type="image"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  showDownload
                  showExternal
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
                    #{index + 1}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {photo.caption && (
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{photo.caption}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(photo.created_at).toLocaleDateString('id-ID')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPhoto(photo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-14 rounded-2xl border border-dashed border-gray-200 bg-slate-50/40">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IconPhoto className="h-7 w-7 text-slate-400" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-1">Belum Ada Foto Dapur</h4>
          <p className="text-sm text-gray-400">Tambahkan foto dapur untuk SPPG ini</p>
        </div>
      )}

      {/* Edit Photo Modal */}
      {isEditing && editingPhoto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Edit Foto</h3>
              <button
                onClick={() => { setIsEditing(false); setEditingPhoto(null); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <IconX className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Keterangan</label>
                <input
                  type="text"
                  defaultValue={editingPhoto.caption || ''}
                  onChange={(e) => setEditingPhoto(prev => prev ? { ...prev, caption: e.target.value } : null)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Masukkan keterangan foto"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setIsEditing(false); setEditingPhoto(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUpdatePhoto(editingPhoto.id, editingPhoto.caption || '', editingPhoto.display_order)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
                >
                  <IconCheck className="h-4 w-4" />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
