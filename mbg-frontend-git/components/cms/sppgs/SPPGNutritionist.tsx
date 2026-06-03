'use client';

import { useState, useEffect } from 'react';
import { IconUser, IconEdit, IconDeviceFloppy, IconX, IconPlus, IconClipboardText, IconTrash } from '@tabler/icons-react';
import DOMPurify from 'dompurify';
import FileUpload from '@/components/cms/shared/FileUpload';
import FileDisplay from '@/components/cms/shared/FileDisplay';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface Nutritionist {
  id: string;
  name: string;
  qualification: string;
  experience: string;
  photo_url: string;
  created_at: string;
  updated_at: string;
}

interface SPPGNutritionistProps {
  sppgId: string;
}

type FormErrors = {
  name?: string;
  qualification?: string;
  photo_url?: string;
  experience?: string;
};

const getPlainTextFromHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeExperienceHtml = (value: string) =>
  DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });

const normalizeSignedPhotoUrl = (rawUrl: string): string => {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const hasAwsSignature = Array.from(parsed.searchParams.keys()).some((key) =>
      key.toLowerCase().startsWith('x-amz-')
    );
    if (hasAwsSignature) {
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

export default function SPPGNutritionist({ sppgId }: SPPGNutritionistProps) {
  const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', qualification: '', experience: '', photo_url: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [error, setError] = useState('');
  const [CKEditorComponent, setCKEditorComponent] = useState<any>(null);
  const [ClassicEditor, setClassicEditor] = useState<any>(null);

  useEffect(() => { loadNutritionist(); }, [sppgId]);
  useEffect(() => {
    let mounted = true;
    const loadEditor = async () => {
      try {
        const [{ CKEditor }, classicEditor] = await Promise.all([
          import('@ckeditor/ckeditor5-react'),
          import('@ckeditor/ckeditor5-build-classic'),
        ]);

        if (!mounted) return;
        setCKEditorComponent(() => CKEditor);
        setClassicEditor(() => classicEditor.default);
      } catch (err) {
        console.error('Failed to load CKEditor', err);
      }
    };

    loadEditor();
    return () => {
      mounted = false;
    };
  }, []);

  const loadNutritionist = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/nutritionist`));
      if (!res.ok) throw new Error('Gagal memuat data ahli gizi');
      const data = await res.json();
      setNutritionist(data);
      if (data) setFormData({ name: data.name || '', qualification: data.qualification || '', experience: data.experience || '', photo_url: data.photo_url || '' });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const nextErrors: FormErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Nama lengkap wajib diisi';
    if (!formData.qualification.trim()) nextErrors.qualification = 'Kualifikasi wajib diisi';
    if (!formData.photo_url.trim()) nextErrors.photo_url = 'Foto ahli gizi wajib diunggah';
    if (!getPlainTextFromHtml(formData.experience).trim()) nextErrors.experience = 'Pengalaman wajib diisi';

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setError('');
    try {
      const payload = {
        ...formData,
        photo_url: normalizeSignedPhotoUrl(formData.photo_url.trim()),
      };

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/nutritionist`), {
        method: nutritionist ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menyimpan ahli gizi');
      setIsEditing(false); loadNutritionist();
    } catch (err: any) { setError(err.message); }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({});
    setError('');
    if (nutritionist) {
      setFormData({ name: nutritionist.name || '', qualification: nutritionist.qualification || '', experience: nutritionist.experience || '', photo_url: nutritionist.photo_url || '' });
    } else {
      setFormData({ name: '', qualification: '', experience: '', photo_url: '' });
    }
  };

  const handleDelete = async () => {
    if (!nutritionist) return;
    if (!confirm('Apakah Anda yakin ingin menghapus data ahli gizi ini?')) return;

    setDeleting(true);
    setError('');
    try {
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/nutritionist`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        let message = 'Gagal menghapus data ahli gizi';
        try {
          const data = await res.json();
          message = data?.error || message;
        } catch {
          // Keep default message when response is not JSON.
        }
        throw new Error(message);
      }

      setNutritionist(null);
      setFormData({ name: '', qualification: '', experience: '', photo_url: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
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
        <h3 className="text-base font-semibold text-gray-900">Data Ahli Gizi</h3>
        {!isEditing && (
          <div className="flex items-center gap-2">
            {nutritionist && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <IconTrash className="h-4 w-4" />
                {deleting ? 'Menghapus...' : 'Hapus Ahli Gizi'}
              </button>
            )}
            <button
              onClick={() => {
                setIsEditing(true);
                setFormErrors({});
                setError('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
            >
              {nutritionist ? <IconEdit className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
              {nutritionist ? 'Edit' : 'Tambah'} Ahli Gizi
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <IconX className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Edit Form */}
      {isEditing ? (
        <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nama Lengkap *</label>
                <input type="text" name="name" value={formData.name} required onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  setFormErrors(prev => ({ ...prev, name: undefined }));
                }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${formErrors.name ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="Masukkan nama lengkap" />
                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Kualifikasi *</label>
                <input type="text" name="qualification" value={formData.qualification} required onChange={(e) => {
                  setFormData(prev => ({ ...prev, qualification: e.target.value }));
                  setFormErrors(prev => ({ ...prev, qualification: undefined }));
                }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${formErrors.qualification ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="Contoh: S.Gz, M.Gz" />
                {formErrors.qualification && <p className="mt-1 text-xs text-red-600">{formErrors.qualification}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Foto Ahli Gizi *</label>
                <FileUpload
                  onUpload={(url) => {
                    setFormData(prev => ({ ...prev, photo_url: url }));
                    setFormErrors(prev => ({ ...prev, photo_url: undefined }));
                  }}
                  onRemove={() => {
                    setFormData(prev => ({ ...prev, photo_url: '' }));
                    setFormErrors(prev => ({ ...prev, photo_url: 'Foto ahli gizi wajib diunggah' }));
                  }}
                  currentUrl={formData.photo_url}
                  accept="image/*"
                  maxSize={3}
                  folder="nutritionist-photos" />
                {formErrors.photo_url && <p className="mt-1 text-xs text-red-600">{formErrors.photo_url}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Pengalaman *</label>
              <div className={`rounded-xl border bg-white overflow-hidden ${formErrors.experience ? 'border-red-300' : 'border-gray-200'}`}>
                {CKEditorComponent && ClassicEditor ? (
                  <CKEditorComponent
                    editor={ClassicEditor}
                    data={formData.experience}
                    config={{
                      placeholder: 'Deskripsikan pengalaman ahli gizi',
                      toolbar: ['bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
                    }}
                    onChange={(_: unknown, editor: any) => {
                      const value = editor.getData();
                      setFormData((prev) => ({ ...prev, experience: value }));
                      setFormErrors((prev) => ({ ...prev, experience: undefined }));
                    }}
                  />
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">Memuat editor...</div>
                )}
              </div>
              {formErrors.experience && <p className="mt-1 text-xs text-red-600">{formErrors.experience}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <IconX className="h-4 w-4" />
              Batal
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
              <IconDeviceFloppy className="h-4 w-4" />
              Simpan
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        nutritionist ? (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 flex flex-col sm:flex-row gap-5">
              {nutritionist.photo_url ? (
                <div className="shrink-0">
                  <FileDisplay url={nutritionist.photo_url} type="image" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                  <IconUser className="h-10 w-10 text-purple-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{nutritionist.name}</h4>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold">
                      {nutritionist.qualification}
                    </span>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Aktif
                  </span>
                </div>
                {nutritionist.experience && (
                  <div
                    className="text-sm text-gray-600 leading-relaxed mb-4 prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
                    dangerouslySetInnerHTML={{ __html: sanitizeExperienceHtml(nutritionist.experience) }}
                  />
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <IconClipboardText className="h-3.5 w-3.5" />
                  Diperbarui: {new Date(nutritionist.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-14 rounded-2xl border border-dashed border-gray-200 bg-slate-50/40">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <IconUser className="h-7 w-7 text-slate-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-700 mb-1">Belum Ada Data Ahli Gizi</h4>
            <p className="text-sm text-gray-400">Tambahkan data ahli gizi untuk SPPG ini</p>
          </div>
        )
      )}
      <style jsx global>{`
        .ck.ck-reset,
        .ck.ck-reset_all {
          box-sizing: border-box;
        }

        .ck.ck-editor {
          width: 100%;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .ck.ck-editor__top .ck-sticky-panel .ck-toolbar {
          border-top: 0;
          border-left: 0;
          border-right: 0;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0;
          box-shadow: none;
        }

        .ck.ck-editor__main > .ck-editor__editable {
          min-height: 170px;
          font-size: 0.875rem;
          border: 0;
          border-radius: 0;
          padding-left: 1rem;
          padding-right: 1rem;
          margin: 0;
          box-shadow: none;
        }

        .ck.ck-editor__main > .ck-editor__editable.ck-focused {
          box-shadow: none;
        }

        .ck.ck-editor__main > .ck-editor__editable ul,
        .ck.ck-editor__main > .ck-editor__editable ol {
          margin-left: 0;
          padding-left: 1.5rem;
          list-style-position: outside;
        }
      `}</style>
    </div>
  );
}
