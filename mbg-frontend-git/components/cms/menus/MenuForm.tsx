'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { IconX, IconPlus, IconTrash, IconSearch, IconChefHat, IconFlame, IconEdit, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import FileUpload from '@/components/cms/shared/FileUpload';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface Menu {
  id: string;
  name: string;
  sppg_id: string;
  total_calories: number;
  notes?: string;
  menu_type: string;
  target_recipients?: string[];
  image_url?: string;
  menu_items?: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url?: string;
}

interface SPPG {
  id: string;
  name: string;
  type: string;
}

interface MenuFormProps {
  menu?: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MenuForm({ menu, isOpen, onClose, onSuccess }: MenuFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    sppg_id: '',
    total_calories: '',
    notes: '',
    menu_type: 'school_specific',
    target_recipients: [] as string[],
    image_url: '',
    menu_items: [] as string[]
  });
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [availableMenuItems, setAvailableMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('administrator');
  const [userSppgId, setUserSppgId] = useState<string>('');
  const [userSppgName, setUserSppgName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  useEffect(() => {
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
      setUserSppgName(user.sppg_name || '');
      
      // Auto-select SPPG for SPPG users
      if (user.role === 'sppg' && user.sppg_id) {
        setFormData(prev => ({
          ...prev,
          sppg_id: user.sppg_id
        }));
      }
    }
  };

  // Load menu items when SPPG changes
  useEffect(() => {
    if (formData.sppg_id) {
      loadMenuItems(formData.sppg_id);
    } else {
      setAvailableMenuItems([]);
    }
  }, [formData.sppg_id]);

  useEffect(() => {
    if (menu) {
      setFormData({
        name: menu.name || '',
        sppg_id: menu.sppg_id,
        total_calories: String(menu.total_calories),
        notes: menu.notes || '',
        menu_type: menu.menu_type,
        target_recipients: menu.target_recipients || [],
        image_url: menu.image_url || '',
        menu_items: menu.menu_items?.map(item => item.id) || []
      });
      setSelectedMenuItems(menu.menu_items || []);
    } else {
      // For new menus, preserve sppg_id for SPPG users
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
        sppg_id: initialSppgId,
        total_calories: '',
        notes: '',
        menu_type: 'school_specific',
        target_recipients: [],
        image_url: '',
        menu_items: []
      });
      setSelectedMenuItems([]);
    }
    setError(null);
  }, [menu, isOpen]);

  // Ensure SPPG field is populated for SPPG users after SPPGs are loaded
  useEffect(() => {
    if (userRole === 'sppg' && userSppgId && sppgs.length > 0 && !menu) {
      setFormData(prev => ({
        ...prev,
        sppg_id: userSppgId
      }));
    }
  }, [userRole, userSppgId, sppgs, menu]);

  useEffect(() => {
    // Update selected menu items when formData.menu_items changes
    const selected = availableMenuItems.filter(item => 
      formData.menu_items.includes(item.id)
    );
    setSelectedMenuItems(selected);
  }, [formData.menu_items, availableMenuItems]);

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
    } catch (error) {
      console.error('Error loading SPPGs:', error);
    }
  };

  const loadMenuItems = async (sppgId?: string) => {
    if (!sppgId) {
      setAvailableMenuItems([]);
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_MENU_ITEMS}?sppg_id=${sppgId}&limit=9999`), {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        const data = Array.isArray(result) ? result : (result.data ?? []);
        setAvailableMenuItems(data);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMenuItemToggle = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      menu_items: prev.menu_items.includes(itemId)
        ? prev.menu_items.filter(id => id !== itemId)
        : [...prev.menu_items, itemId]
    }));
  };

  const handleRemoveMenuItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      menu_items: prev.menu_items.filter(id => id !== itemId)
    }));
  };

  const calculateTotalCalories = () => {
    return selectedMenuItems.reduce((total, item) => total + item.calories, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = menu ? 'PUT' : 'POST';
      const url = menu ? buildApiUrl(`${API_ENDPOINTS.CMS_MENUS}/${menu.id}`) : buildApiUrl(API_ENDPOINTS.CMS_MENUS);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          menu_item_ids: formData.menu_items,
          menu_type: 'school_specific',
          total_calories: parseInt(formData.total_calories) || (selectedMenuItems.length > 0 ? calculateTotalCalories() : null),
          target_recipients: formData.target_recipients.length > 0 ? formData.target_recipients : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${menu ? 'update' : 'create'} menu`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Menu form submission error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data menu.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = availableMenuItems.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  const autoCalories = calculateTotalCalories();
  const displayCalories = parseInt(formData.total_calories) || (selectedMenuItems.length > 0 ? autoCalories : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              {menu ? <IconEdit className="h-5 w-5" /> : <IconChefHat className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">{menu ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <p className="text-blue-100 text-xs">{menu ? 'Perbarui informasi menu dan item' : 'Isi detail menu dan pilih item makanan'}</p>
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
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

              {/* ── Left Column: Menu Info ── */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informasi Menu</h4>
                </div>

                {/* SPPG + Tipe row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SPPG */}
                  <div className={userRole !== 'sppg' ? '' : 'sm:col-span-2'}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      SPPG {userRole !== 'sppg' && <span className="text-red-500">*</span>}
                    </label>
                    {userRole !== 'sppg' ? (
                      <Select
                        inputId="sppg_id"
                        options={sppgs.map(s => ({ value: s.id, label: `${s.name} (${s.type})` }))}
                        value={formData.sppg_id
                          ? { value: formData.sppg_id, label: sppgs.find(s => s.id === formData.sppg_id) ? `${sppgs.find(s => s.id === formData.sppg_id)!.name} (${sppgs.find(s => s.id === formData.sppg_id)!.type})` : formData.sppg_id }
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
                          control: (base) => ({ ...base, minHeight: '40px', borderColor: '#e5e7eb', borderRadius: '8px', boxShadow: 'none', fontSize: '14px', '&:hover': { borderColor: '#3b82f6' } }),
                          valueContainer: (base) => ({ ...base, padding: '0 10px' }),
                          placeholder: (base) => ({ ...base, color: '#9ca3af' }),
                        }}
                      />
                    ) : (
                      <>
                        <div className="w-full px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-medium">
                          {userSppgName || sppgs.find(s => s.id === formData.sppg_id)?.name || formData.sppg_id || 'Loading...'}
                        </div>
                        <input type="hidden" name="sppg_id" value={formData.sppg_id} />
                      </>
                    )}
                  </div>

                  {/* Tipe Menu (fixed) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Tipe Menu
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-emerald-800">Menu Sekolah</span>
                    </div>
                    <input type="hidden" name="menu_type" value="school_specific" />
                  </div>
                </div>

                {/* Nama Menu */}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nama Menu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Nasi Ayam Goreng + Sayur"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition-shadow"
                  />
                </div>

                {/* Total Kalori */}
                <div>
                  <label htmlFor="total_calories" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Total Kalori
                  </label>
                  <div className="relative">
                    <IconFlame className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                    <input
                      type="number"
                      name="total_calories"
                      id="total_calories"
                      value={formData.total_calories}
                      onChange={handleChange}
                      min={1}
                      className="w-full pl-9 pr-16 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="Otomatis"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kkal</span>
                  </div>
                  {selectedMenuItems.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-orange-600">
                      <IconFlame className="h-3.5 w-3.5" />
                      <span>Dihitung dari item: <strong>{autoCalories} kkal</strong>{!formData.total_calories && ' (digunakan otomatis)'}</span>
                    </div>
                  )}
                </div>

                {/* Catatan */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Catatan
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 resize-none transition-shadow"
                    placeholder="Catatan tambahan, alergen, atau instruksi khusus..."
                  />
                </div>

                {/* Foto Menu */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Foto Menu
                  </label>
                  <FileUpload
                    onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    currentUrl={formData.image_url}
                    accept="image/*"
                    maxSize={5}
                    folder="menu-photos"
                  />
                </div>
              </div>

              {/* ── Right Column: Menu Items ── */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Item Menu</h4>
                  </div>
                  {formData.menu_items.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      <IconCheck className="h-3 w-3" />
                      {formData.menu_items.length} dipilih
                    </span>
                  )}
                </div>

                {!formData.sppg_id ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <IconChefHat className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">Pilih SPPG terlebih dahulu</p>
                    <p className="text-xs text-gray-400 mt-1">Item menu akan muncul setelah SPPG dipilih</p>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari item menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      />
                    </div>

                    {/* Available Items */}
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1">
                      {filteredMenuItems.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-gray-400">{searchQuery ? 'Tidak ditemukan' : 'Belum ada item menu untuk SPPG ini'}</p>
                        </div>
                      ) : filteredMenuItems.map((item) => {
                        const isSelected = formData.menu_items.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleMenuItemToggle(item.id)}
                            className={`group flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all select-none ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 group-hover:border-gray-400'
                            }`}>
                              {isSelected && <IconCheck className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-800' : 'text-gray-800'}`}>{item.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                <span className="text-orange-500 font-medium">{item.calories} kkal</span>
                                <span className="mx-1 text-gray-300">·</span>
                                P:{item.protein}g K:{item.carbs}g L:{item.fat}g
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected items summary */}
                    {selectedMenuItems.length > 0 && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden shrink-0">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                          <span className="text-xs font-semibold text-gray-600">Item Terpilih</span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                            <IconFlame className="h-3.5 w-3.5" />
                            {autoCalories} kkal total
                          </span>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-36 overflow-y-auto">
                          {selectedMenuItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-800 font-medium truncate block">{item.name}</span>
                                <span className="text-xs text-orange-500">{item.calories} kkal</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMenuItem(item.id)}
                                className="shrink-0 ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <IconTrash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {displayCalories > 0 && (
                <>
                  <IconFlame className="h-4 w-4 text-orange-400" />
                  <span><strong className="text-gray-700">{displayCalories} kkal</strong> total menu</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
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
                  <>{menu ? 'Simpan Perubahan' : 'Tambah Menu'}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}