'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { IconX, IconEdit, IconFileText, IconFlame, IconInfoCircle } from '@tabler/icons-react';
import FileUpload from '@/components/cms/shared/FileUpload';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url?: string;
  sppg_id?: string;
  sppg_name?: string;
  sppg_type?: string;
  sppg_location?: string;
}

interface SPPG {
  id: string;
  name: string;
  type: string;
  location: string;
}

interface MenuItemFormProps {
  menuItem?: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MenuItemForm({ menuItem, isOpen, onClose, onSuccess }: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    calories: '0',
    protein: '0',
    carbs: '0',
    fat: '0',
    image_url: '',
    sppg_id: ''
  });
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('administrator');
  const [userSppgId, setUserSppgId] = useState<string>('');

  // Load user info first
  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  // Load SPPGs after user role is determined
  useEffect(() => {
    const loadSppgs = async () => {
      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}?limit=999`), {
          credentials: 'include'
        });
        if (response.ok) {
          const result = await response.json();
          const data = Array.isArray(result) ? result : (result.data ?? []);
          setSppgs(data);
        }
      } catch (err) {
        console.error('Error loading SPPGs:', err);
      }
    };

    if (isOpen && userRole) {
      loadSppgs();
    }
  }, [isOpen, userRole]);

  const loadUserInfo = () => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || 'administrator');
      setUserSppgId(user.sppg_id || '');
      
      // Auto-select SPPG for SPPG users
      if (user.role === 'sppg' && user.sppg_id) {
        setFormData(prev => ({
          ...prev,
          sppg_id: user.sppg_id
        }));
      }
    }
  };

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        description: menuItem.description || '',
        calories: menuItem.calories != null ? String(menuItem.calories) : '0',
        protein: menuItem.protein != null ? String(menuItem.protein) : '0',
        carbs: menuItem.carbs != null ? String(menuItem.carbs) : '0',
        fat: menuItem.fat != null ? String(menuItem.fat) : '0',
        image_url: menuItem.image_url || '',
        sppg_id: menuItem.sppg_id || ''
      });
    } else {
      // For new menu items, preserve sppg_id for SPPG users
      const userData = localStorage.getItem('user_data');
      let initialSppgId = '';
      
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role === 'sppg' && user.sppg_id) {
          initialSppgId = user.sppg_id;
        }
      }
      
      setFormData({
        name: '',
        description: '',
        calories: '0',
        protein: '0',
        carbs: '0',
        fat: '0',
        image_url: '',
        sppg_id: initialSppgId
      });
    }
    setError(null);
  }, [menuItem, isOpen]);

  // Auto-populate SPPG field for SPPG users after SPPGs are loaded
  useEffect(() => {
    if (userRole === 'sppg' && userSppgId && sppgs.length > 0 && !menuItem) {
      setFormData(prev => ({
        ...prev,
        sppg_id: userSppgId
      }));
    }
  }, [userRole, userSppgId, sppgs, menuItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate nutrition fields - skipped, all nutrition fields are optional

    try {
      const method = menuItem ? 'PUT' : 'POST';
      const url = menuItem ? buildApiUrl(`${API_ENDPOINTS.CMS_MENU_ITEMS}/${menuItem.id}`) : buildApiUrl(API_ENDPOINTS.CMS_MENU_ITEMS);

      const payload = {
        ...formData,
        calories: formData.calories !== '' ? parseInt(formData.calories) : 0,
        protein: formData.protein !== '' ? parseFloat(formData.protein) : 0,
        carbs: formData.carbs !== '' ? parseFloat(formData.carbs) : 0,
        fat: formData.fat !== '' ? parseFloat(formData.fat) : 0,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${menuItem ? 'update' : 'create'} menu item`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Menu item form submission error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data item menu.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              {menuItem ? <IconEdit className="h-5 w-5" /> : <IconFileText className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">{menuItem ? 'Edit Item Menu' : 'Tambah Item Menu'}</h3>
              <p className="text-emerald-100 text-xs">{menuItem ? 'Perbarui informasi dan nutrisi item' : 'Isi detail dan informasi nutrisi item'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shrink-0">
            <IconInfoCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Row 1: SPPG */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                SPPG {userRole !== 'sppg' && <span className="text-red-500">*</span>}
              </label>
              {userRole !== 'sppg' ? (
                <Select
                  inputId="sppg_id"
                  options={sppgs.map(s => ({ value: s.id, label: `${s.name} (${s.type}) — ${s.location}` }))}
                  value={formData.sppg_id
                    ? { value: formData.sppg_id, label: sppgs.find(s => s.id === formData.sppg_id) ? `${sppgs.find(s => s.id === formData.sppg_id)!.name} (${sppgs.find(s => s.id === formData.sppg_id)!.type}) — ${sppgs.find(s => s.id === formData.sppg_id)!.location}` : formData.sppg_id }
                    : null}
                  onChange={(opt) => setFormData(prev => ({ ...prev, sppg_id: opt?.value || '' }))}
                  placeholder="Pilih SPPG..."
                  isSearchable
                  isClearable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  classNamePrefix="rs"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({ ...base, minHeight: '40px', borderColor: '#e5e7eb', borderRadius: '8px', boxShadow: 'none', fontSize: '14px', '&:hover': { borderColor: '#10b981' } }),
                    valueContainer: (base) => ({ ...base, padding: '0 10px' }),
                    placeholder: (base) => ({ ...base, color: '#9ca3af' }),
                  }}
                />
              ) : (
                <>
                  <div className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
                    {sppgs.find(s => s.id === formData.sppg_id)?.name || 'Loading...'}
                  </div>
                  <input type="hidden" name="sppg_id" value={formData.sppg_id} />
                </>
              )}
            </div>

            {/* Row 2: Nama + Foto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nama Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Nasi Putih, Ayam Goreng..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400 transition-shadow"
                />
              </div>
            </div>

            {/* Row 3: Deskripsi */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Deskripsi
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400 resize-none transition-shadow"
                placeholder="Deskripsi singkat item menu..."
              />
            </div>

            {/* Row 4: Foto */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Foto Item
              </label>
              <FileUpload
                onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                currentUrl={formData.image_url}
                accept="image/*"
                maxSize={3}
                folder="menu-item-photos"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-orange-400 rounded-full" />
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informasi Nutrisi</h4>
              </div>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Row 5: Nutrition grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'calories', label: 'Kalori', unit: 'kkal', placeholder: '200', color: 'focus:ring-orange-400', step: '1', icon: <IconFlame className="h-3.5 w-3.5 text-orange-400" /> },
                { id: 'protein', label: 'Protein', unit: 'g', placeholder: '4.0', color: 'focus:ring-blue-400', step: '0.1', icon: null },
                { id: 'carbs', label: 'Karbohidrat', unit: 'g', placeholder: '45.0', color: 'focus:ring-amber-400', step: '0.1', icon: null },
                { id: 'fat', label: 'Lemak', unit: 'g', placeholder: '0.5', color: 'focus:ring-rose-400', step: '0.1', icon: null },
              ].map(f => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {f.label}
                  </label>
                  <div className="relative">
                    {f.icon && <span className="absolute left-2.5 top-1/2 -translate-y-1/2">{f.icon}</span>}
                    <input
                      type="number"
                      name={f.id}
                      id={f.id}
                      value={(formData as any)[f.id]}
                      onChange={handleChange}
                      min="0"
                      step={f.step}
                      placeholder={f.placeholder}
                      className={`w-full ${f.icon ? 'pl-7' : 'pl-3'} pr-2 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${f.color} focus:border-transparent transition-shadow`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{f.unit}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>{menuItem ? 'Simpan Perubahan' : 'Tambah Item'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
