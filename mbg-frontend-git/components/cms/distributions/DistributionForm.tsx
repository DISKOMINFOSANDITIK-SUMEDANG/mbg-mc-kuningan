'use client';

import { useState, useEffect } from 'react';
import { IconX, IconCalendar, IconTruck, IconClipboardList, IconPlus, IconEdit } from '@tabler/icons-react';
import Select from 'react-select';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import SearchableSelect from '@/components/cms/shared/SearchableSelect';

interface Distribution {
  id: string;
  sppg_id: string;
  distribution_date: string;
  recipient_type: 'school' | 'group';
  recipient_id: string;
  menu_id: string;
  portions: number;
  notes?: string;
}

interface DistributionRecipient {
  id: string;
  recipient_type: 'school' | 'group';
  recipient_id: string;
  portions: number;
}

interface SPPG {
  id: string;
  name: string;
  type: string;
  location: string;
}

interface School {
  id: string;
  name: string;
  level: string;
  district: string;
  village: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface Menu {
  id: string;
  name: string;
  total_calories: number;
  image_url?: string;
}

interface DistributionFormProps {
  distribution?: Distribution | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DistributionForm({ distribution, isOpen, onClose, onSuccess }: DistributionFormProps) {
  const [formData, setFormData] = useState({
    sppg_id: '',
    distribution_date: '',
    menu_id: '',
    notes: ''
  });
  const [recipients, setRecipients] = useState<DistributionRecipient[]>([]);
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('administrator');
  const [userSppgId, setUserSppgId] = useState<string>('');
  const [lastPortions, setLastPortions] = useState<Record<string, number>>({});
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);
  const [lastPortionsLoaded, setLastPortionsLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setAutoPopulated(false);
    setLastPortionsLoaded(false);

    // Read user info synchronously from localStorage so state updates don't race
    const userData = localStorage.getItem('user_data');
    const user = userData ? JSON.parse(userData) : null;
    const role = user?.role || 'administrator';
    const sppgId = user?.sppg_id || '';

    setUserRole(role);
    setUserSppgId(sppgId);
    setUserInfoLoaded(true);

    if (role === 'sppg' && sppgId) {
      setFormData(prev => ({ ...prev, sppg_id: sppgId }));
    }

    loadSppgs();
    loadMenus();
    loadSchools(role, sppgId);
    loadGroups(role, sppgId);

    if (role === 'sppg' && sppgId) {
      loadLastPortions(sppgId);
    } else {
      setLastPortionsLoaded(true);
    }
  }, [isOpen]);

  // Auto-populate recipients for SPPG users when schools/groups are loaded (new distribution only)
  useEffect(() => {
    if (autoPopulated || distribution || userRole !== 'sppg' || !userSppgId) return;
    if (!lastPortionsLoaded) return;
    if (schools.length === 0 && groups.length === 0) return;

    const autoRecipients: DistributionRecipient[] = [];

    schools.forEach((school) => {
      const prevPortions = lastPortions[`school:${school.id}`];
      autoRecipients.push({
        id: `auto-school-${school.id}`,
        recipient_type: 'school',
        recipient_id: school.id,
        portions: prevPortions ?? 0,
      });
    });

    groups.forEach((group) => {
      const prevPortions = lastPortions[`group:${group.id}`];
      autoRecipients.push({
        id: `auto-group-${group.id}`,
        recipient_type: 'group',
        recipient_id: group.id,
        portions: prevPortions ?? 0,
      });
    });

    if (autoRecipients.length > 0) {
      setRecipients(autoRecipients);
      setAutoPopulated(true);
    }
  }, [schools, groups, lastPortions, lastPortionsLoaded, distribution, userRole, userSppgId, autoPopulated]);

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
    setUserInfoLoaded(true);
  };

  useEffect(() => {
    if (distribution) {
      // Load all recipients for this distribution group
      loadDistributionGroup(distribution.sppg_id, distribution.distribution_date, distribution.menu_id);
    } else {
      // For new distributions, preserve SPPG ID for SPPG users
      const userData = localStorage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      const shouldPreserveSppgId = user?.role === 'sppg' && user?.sppg_id;
      
      setFormData(prev => ({
        sppg_id: shouldPreserveSppgId ? user.sppg_id : '',
        distribution_date: (() => {
          // Use Indonesia time (WIB, UTC+7) for the default date
          const now = new Date();
          const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
          return wib.toISOString().split('T')[0];
        })(),
        menu_id: '',
        notes: ''
      }));
      setRecipients([{
        id: '1',
        recipient_type: 'school',
        recipient_id: '',
        portions: 0
      }]);
    }
    setError(null);
  }, [distribution, isOpen]);

  const loadDistributionGroup = async (sppgId: string, date: string, menuId: string) => {
    try {
      const response = await fetch(buildApiUrl(`/api/cms/distributions/group?sppg_id=${sppgId}&date=${date}&menu_id=${menuId}`), {
        credentials: 'include'
      });
      if (response.ok) {
        const groupData = await response.json();
        
        // Set form data from the group using the new API response structure
        setFormData({
          sppg_id: sppgId,
          distribution_date: date,
          menu_id: menuId,
          notes: groupData.notes || ''
        });

        // Set all recipients from the group using the new API response structure
        const recipientsWithIds = groupData.recipients?.map((recipient: any, index: number) => ({
          id: (index + 1).toString(),
          recipient_type: recipient.type,
          recipient_id: recipient.id,
          portions: recipient.portions
        })) || [];
        
        setRecipients(recipientsWithIds);
      } else {
        console.error('Failed to load distribution group');
        // Fallback to single recipient if group loading fails and distribution exists
        if (distribution) {
          setFormData({
            sppg_id: distribution.sppg_id,
            distribution_date: distribution.distribution_date,
            menu_id: distribution.menu_id,
            notes: distribution.notes || ''
          });
          setRecipients([{
            id: '1',
            recipient_type: distribution.recipient_type,
            recipient_id: distribution.recipient_id,
            portions: distribution.portions
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading distribution group:', error);
      // Fallback to single recipient if group loading fails and distribution exists
      if (distribution) {
        setFormData({
          sppg_id: distribution.sppg_id,
          distribution_date: distribution.distribution_date,
          menu_id: distribution.menu_id,
          notes: distribution.notes || ''
        });
        setRecipients([{
          id: '1',
          recipient_type: distribution.recipient_type,
          recipient_id: distribution.recipient_id,
          portions: distribution.portions
        }]);
      }
    }
  };

  const loadSppgs = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/cms/sppgs/options'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSppgs(Array.isArray(data) ? data : (data.sppgs || []));
      }
    } catch (error) {
      console.error('Error loading SPPGs:', error);
    }
  };

  // Ensure SPPG field is properly set when SPPGs are loaded for SPPG users
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === 'sppg' && user.sppg_id && sppgs.length > 0) {
        // Make sure the SPPG ID is set in form data when SPPGs are loaded
        setFormData(prev => ({
          ...prev,
          sppg_id: user.sppg_id
        }));
      }
    }
  }, [sppgs]); // Run when SPPGs are loaded

  const loadSchools = async (explicitRole?: string, explicitSppgId?: string) => {
    const role = explicitRole !== undefined ? explicitRole : userRole;
    const sppgId = explicitSppgId !== undefined ? explicitSppgId : userSppgId;
    try {
      let url = buildApiUrl(API_ENDPOINTS.SCHOOLS);
      if (role === 'sppg' && sppgId) {
        url += `?sppg_id=${sppgId}`;
      }
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  const loadGroups = async (explicitRole?: string, explicitSppgId?: string) => {
    const role = explicitRole !== undefined ? explicitRole : userRole;
    const sppgId = explicitSppgId !== undefined ? explicitSppgId : userSppgId;
    try {
      let url = buildApiUrl(API_ENDPOINTS.GROUPS);
      if (role === 'sppg' && sppgId) {
        url += `?sppg_id=${sppgId}`;
      }
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadLastPortions = async (sppgId: string) => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_DISTRIBUTIONS}/last-portions?sppg_id=${sppgId}`), {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        setLastPortions(result.data ?? result ?? {});
      }
    } catch (error) {
      console.error('Error loading last portions:', error);
    } finally {
      setLastPortionsLoaded(true);
    }
  };

  const loadMenus = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CMS_MENUS), { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        const data = result.data ?? (Array.isArray(result) ? result : []);
        setMenus(data);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addRecipient = () => {
    const newRecipient: DistributionRecipient = {
      id: Date.now().toString(),
      recipient_type: 'school',
      recipient_id: '',
      portions: 0
    };
    setRecipients(prev => [...prev, newRecipient]);
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const updateRecipient = (id: string, field: keyof DistributionRecipient, value: string | number) => {
    setRecipients(prev => prev.map(r => 
      r.id === id 
        ? { ...r, [field]: value, ...(field === 'recipient_type' ? { recipient_id: '' } : {}) }
        : r
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ensure SPPG ID is set for SPPG users
      const userData = localStorage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      const finalFormData = { ...formData };
      
      if (user?.role === 'sppg' && user?.sppg_id && !finalFormData.sppg_id) {
        finalFormData.sppg_id = user.sppg_id;
      }

      // Validate required fields
      if (!finalFormData.sppg_id) {
        throw new Error('SPPG harus dipilih');
      }
      if (!finalFormData.distribution_date) {
        throw new Error('Tanggal distribusi harus diisi');
      }
      if (!finalFormData.menu_id) {
        throw new Error('Menu harus dipilih');
      }

      // Validate recipients
      const validRecipients = recipients.filter(r => r.recipient_id && r.portions > 0);
      if (validRecipients.length === 0) {
        throw new Error('Minimal harus ada satu penerima dengan porsi yang valid');
      }

      console.log('Final Form Data:', finalFormData);
      console.log('Valid Recipients:', validRecipients);

      if (distribution) {
        // For editing, we need to update all distributions in the group
        // First delete all existing distributions for this group, then recreate them
        const deleteResponse = await fetch(buildApiUrl(`/api/cms/distributions/group?sppg_id=${finalFormData.sppg_id}&date=${finalFormData.distribution_date}&menu_id=${finalFormData.menu_id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!deleteResponse.ok) {
          let errorMessage = 'Failed to delete existing distributions';
          try {
            const errorData = await deleteResponse.json();
            console.log('Delete error data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.log('Delete parse error:', parseError);
            const responseText = await deleteResponse.text();
            console.log('Delete response text:', responseText);
            errorMessage = `Server error: ${deleteResponse.status} ${deleteResponse.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Now create new distributions using bulk API
        const payload = {
          ...finalFormData,
          recipients: validRecipients
        };

        console.log('Bulk update payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_DISTRIBUTIONS}/bulk`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        console.log('Bulk update response status:', response.status);
        console.log('Bulk update response headers:', response.headers);

        if (!response.ok) {
          let errorMessage = 'Failed to update distributions';
          try {
            const errorData = await response.json();
            console.log('Bulk update error data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.log('Bulk update parse error:', parseError);
            const responseText = await response.text();
            console.log('Bulk update response text:', responseText);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      } else {
        // Create multiple distributions using bulk API
        const payload = {
          ...finalFormData,
          recipients: validRecipients
        };

        console.log('Bulk create payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_DISTRIBUTIONS}/bulk`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        console.log('Bulk response status:', response.status);
        console.log('Bulk response headers:', response.headers);

        if (!response.ok) {
          let errorMessage = 'Failed to create distributions';
          try {
            const errorData = await response.json();
            console.log('Bulk error data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.log('Bulk parse error:', parseError);
            const responseText = await response.text();
            console.log('Bulk response text:', responseText);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Bulk success result:', result);
        console.log(`Successfully created ${result.distributions?.length || validRecipients.length} distributions`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Distribution form submission error:', err);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data distribusi.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              {distribution ? <IconEdit className="w-5 h-5 text-white" /> : <IconTruck className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">{distribution ? 'Edit Distribusi' : 'Tambah Distribusi'}</h3>
              <p className="text-orange-100 text-xs mt-0.5">{distribution ? 'Perbarui data distribusi' : 'Buat entri distribusi baru'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <IconX className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <IconX className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SPPG + Tanggal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SPPG *</label>
                {userRole !== 'sppg' ? (
                  <Select
                    options={sppgs.map(s => ({ value: s.id, label: `${s.name} (${s.type}) — ${s.location}` }))}
                    value={sppgs.find(s => s.id === formData.sppg_id)
                      ? { value: formData.sppg_id, label: `${sppgs.find(s => s.id === formData.sppg_id)?.name} (${sppgs.find(s => s.id === formData.sppg_id)?.type}) — ${sppgs.find(s => s.id === formData.sppg_id)?.location}` }
                      : null
                    }
                    onChange={(opt) => setFormData(prev => ({ ...prev, sppg_id: opt?.value || '' }))}
                    placeholder="Pilih SPPG..."
                    isClearable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    classNamePrefix="react-select"
                  />
                ) : (
                  <>
                    <div className="w-full px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm font-medium text-orange-800">
                      {sppgs.find(s => s.id === formData.sppg_id)?.name || 'Loading...'}
                    </div>
                    <input type="hidden" name="sppg_id" value={formData.sppg_id} />
                  </>
                )}
              </div>

              <div>
                <label htmlFor="distribution_date" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tanggal Distribusi *
                </label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="distribution_date"
                    id="distribution_date"
                    value={formData.distribution_date}
                    readOnly
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed outline-none"
                  />
                </div>
                <p className="text-xs text-amber-600 mt-1.5 flex items-start gap-1">
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Distribusi Harian hanya dapat disubmit pada hari menu dikirim</span>
                </p>
              </div>
            </div>

            {/* Menu Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Menu *</label>
              <Select
                options={menus.map(m => ({ value: m.id, label: `${m.name} — ${m.total_calories} kkal` }))}
                value={menus.find(m => m.id === formData.menu_id)
                  ? { value: formData.menu_id, label: `${menus.find(m => m.id === formData.menu_id)?.name} — ${menus.find(m => m.id === formData.menu_id)?.total_calories} kkal` }
                  : null
                }
                onChange={(opt) => setFormData(prev => ({ ...prev, menu_id: opt?.value || '' }))}
                placeholder="Pilih Menu..."
                isClearable
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                classNamePrefix="react-select"
              />
            </div>

            {/* Recipients Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Penerima Distribusi</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {recipients.filter(r => r.recipient_id && r.portions > 0).length} penerima valid
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRecipient}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  Tambah
                </button>
              </div>

              {/* Compact table for auto-populated recipients */}
              {autoPopulated && recipients.some(r => r.id.startsWith('auto-')) && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-8">#</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Penerima</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-12">Tipe</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-36">Jumlah Porsi *</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recipients.filter(r => r.id.startsWith('auto-')).map((recipient, index) => {
                        const name = recipient.recipient_type === 'school'
                          ? schools.find(s => s.id === recipient.recipient_id)?.name
                          : groups.find(g => g.id === recipient.recipient_id)?.name;
                        return (
                          <tr key={recipient.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-xs text-gray-400">{index + 1}</td>
                            <td className="px-3 py-2 text-sm text-gray-800 font-medium truncate max-w-[200px]" title={name}>{name || '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${recipient.recipient_type === 'school' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {recipient.recipient_type === 'school' ? 'Sekolah' : 'Kelompok'}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                value={recipient.portions || ''}
                                onChange={(e) => updateRecipient(recipient.id, 'portions', parseInt(e.target.value) || 0)}
                                min="1"
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeRecipient(recipient.id)}
                                className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <IconX className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Card-style for manually added recipients */}
              <div className="space-y-3">
                {recipients.filter(r => !r.id.startsWith('auto-')).map((recipient, index) => (
                  <div key={recipient.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima Tambahan #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(recipient.id)}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipe *</label>
                        <select
                          value={recipient.recipient_type}
                          onChange={(e) => updateRecipient(recipient.id, 'recipient_type', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                        >
                          <option value="school">Sekolah</option>
                          <option value="group">Kelompok</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {recipient.recipient_type === 'school' ? 'Sekolah' : 'Kelompok'} *
                        </label>
                        {recipient.recipient_type === 'school' ? (
                          <SearchableSelect
                            options={schools.map(school => ({
                              value: school.id,
                              label: school.name,
                              description: `${school.level} - ${school.district}`
                            }))}
                            value={recipient.recipient_id}
                            onChange={(value) => updateRecipient(recipient.id, 'recipient_id', value)}
                            placeholder="Pilih Sekolah"
                            searchPlaceholder="Cari sekolah..."
                            className="text-sm"
                          />
                        ) : (
                          <SearchableSelect
                            options={groups.map(group => ({
                              value: group.id,
                              label: group.name,
                              description: group.description || ''
                            }))}
                            value={recipient.recipient_id}
                            onChange={(value) => updateRecipient(recipient.id, 'recipient_id', value)}
                            placeholder="Pilih Kelompok"
                            searchPlaceholder="Cari kelompok..."
                            className="text-sm"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Porsi *</label>
                        <input
                          type="number"
                          value={recipient.portions || ''}
                          onChange={(e) => updateRecipient(recipient.id, 'portions', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          placeholder="Contoh: 180"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <textarea
                name="notes"
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                placeholder="Catatan tambahan untuk distribusi ini"
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{recipients.filter(r => r.recipient_id && r.portions > 0).length}</span> penerima
              {' · '}
              <span className="font-semibold text-orange-600">
                {recipients.filter(r => r.recipient_id && r.portions > 0).reduce((sum, r) => sum + (r.portions || 0), 0).toLocaleString('id-ID')} porsi
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading
                  ? 'Menyimpan...'
                  : distribution
                    ? 'Simpan Perubahan'
                    : `Buat ${recipients.filter(r => r.recipient_id && r.portions > 0).length} Distribusi`
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
