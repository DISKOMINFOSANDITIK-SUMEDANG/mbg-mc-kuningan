'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '@/components/shared/AppLayout';
import { ContactPageSkeleton } from '@/components/shared/PageSkeletons';
import { IconMapPin, IconMail, IconClock, IconSend, IconCheck, IconAlertCircle, IconShieldLock, IconUser, IconSchool, IconBuildingFactory, IconBrandWhatsapp } from '@tabler/icons-react';
import Image from 'next/image';

const Select = dynamic(() => import('react-select'), { ssr: false });
const AsyncPaginate = dynamic(
  () => import('react-select-async-paginate').then(mod => mod.AsyncPaginate),
  { ssr: false }
);

interface SppgOption {
  id: string;
  name: string;
}

type JenisPelapor = 'individu' | 'sekolah' | 'sppg' | '';

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    jenis_pelapor: 'individu' as JenisPelapor,
    name: '',
    sppg_id: '',
    tujuan: '',
    target_id: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    _honeypot: '' // Bot detection field (hidden)
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sppgOptions, setSppgOptions] = useState<SppgOption[]>([]);
  const [sppgLoading, setSppgLoading] = useState(false);
  const [selectedSchoolOption, setSelectedSchoolOption] = useState<{ value: string; label: string } | null>(null);

  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  // Fetch SPPG options
  const fetchSppgOptions = useCallback(async () => {
    if (sppgOptions.length > 0) return; // Already fetched
    setSppgLoading(true);
    try {
      const response = await fetch('/api/contact/sppg-options');
      const result = await response.json();
      if (result.success && result.data) {
        setSppgOptions(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch SPPG options:', err);
    } finally {
      setSppgLoading(false);
    }
  }, [sppgOptions.length]);


  const loadSchoolOptions = async (
    inputValue: string,
    _: unknown,
    additional: unknown
  ) => {
    const page = (additional as { page: number } | undefined)?.page ?? 1;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (inputValue) params.set('q', inputValue);
    const response = await fetch(`/api/contact/school-options?${params}`);
    const result = await response.json();
    return {
      options: (result.data || []).map((s: SppgOption) => ({ value: s.id, label: s.name })),
      hasMore: result.hasMore ?? false,
      additional: { page: page + 1 },
    };
  };

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Fetch SPPG options when 'sppg' is selected
  useEffect(() => {
    if (formData.jenis_pelapor === 'sppg') {
      fetchSppgOptions();
    }
  }, [formData.jenis_pelapor, fetchSppgOptions]);

  // Fetch SPPG target options when Tujuan changes to sppg
  useEffect(() => {
    if (formData.tujuan === 'sppg') fetchSppgOptions();
  }, [formData.tujuan, fetchSppgOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Client-side rate limiting (max 3 attempts per 2 min)
      if (lockedUntil && Date.now() < lockedUntil) {
        const remainSec = Math.ceil((lockedUntil - Date.now()) / 1000);
        throw new Error(`Terlalu banyak percobaan. Silakan tunggu ${remainSec} detik.`);
      }

      if (submitAttempts >= 3) {
        const lockTime = Date.now() + 120000; // 2 min lock
        setLockedUntil(lockTime);
        setSubmitAttempts(0);
        throw new Error('Terlalu banyak percobaan. Silakan tunggu 2 menit.');
      }
      setSubmitAttempts(prev => prev + 1);

      // Client-side validation
      if (!formData.jenis_pelapor) {
        throw new Error('Silakan pilih jenis pelapor terlebih dahulu');
      }

      if (formData.jenis_pelapor === 'individu' || formData.jenis_pelapor === 'sekolah') {
        if (formData.name.trim().length < 3) {
          const label = formData.jenis_pelapor === 'individu' ? 'Nama Lengkap' : 'Nama Sekolah';
          throw new Error(`${label} harus minimal 3 karakter`);
        }
        if (formData.name.length > 100) {
          throw new Error('Nama terlalu panjang (maks 100 karakter)');
        }
        // Block obvious injection in name field
        if (/<[^>]*>|javascript:|on\w+\s*=/i.test(formData.name)) {
          throw new Error('Nama mengandung karakter yang tidak diizinkan');
        }
      }

      if (formData.jenis_pelapor === 'sppg' && !formData.sppg_id) {
        throw new Error('Silakan pilih SPPG');
      }

      // Email basic check
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Format email tidak valid');
      }

      if (!formData.subject) {
        throw new Error('Silakan pilih subjek');
      }
      
      if (formData.message.trim().length < 10) {
        throw new Error('Pesan harus minimal 10 karakter');
      }

      if (formData.message.length > 2000) {
        throw new Error('Pesan terlalu panjang (maks 2000 karakter)');
      }

      // Block obvious attack patterns in message
      if (/<script|<iframe|javascript:|UNION\s+SELECT|DROP\s+TABLE/i.test(formData.message)) {
        throw new Error('Pesan mengandung konten yang tidak diizinkan');
      }

      // Submit to API with security headers
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengirim pesan');
      }

      // Success
      setIsSubmitted(true);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          jenis_pelapor: 'individu' as JenisPelapor,
          name: '',
          sppg_id: '',
          tujuan: '',
          target_id: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          _honeypot: ''
        });
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const selectStyles = {
    control: (base: object, state: { isFocused: boolean }) => ({
      ...base,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
      borderRadius: '0.5rem',
      minHeight: '50px',
      padding: '2px 4px',
      '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#9ca3af' },
    }),
    option: (base: object, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
      fontSize: '0.875rem',
    }),
    menu: (base: object) => ({
      ...base,
      borderRadius: '0.5rem',
      overflow: 'hidden',
      zIndex: 50,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    }),
    placeholder: (base: object) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
    singleValue: (base: object) => ({ ...base, color: '#111827', fontSize: '0.875rem' }),
    input: (base: object) => ({ ...base, fontSize: '0.875rem' }),
  };

  if (loading) {
    return <ContactPageSkeleton />;
  }

  return (
    <AppLayout className="bg-white">
      {/* Hero Section */}
      <section className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Hubungi Kami
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ada pertanyaan tentang program Makan Bergizi Gratis? 
              Kami siap membantu dan mendengarkan masukan Anda.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Informasi Kontak
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconMapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Alamat Kantor</h3>
                  <p className="text-gray-600">
                    Dinas Komunikasi dan Informatika, Jl. Aruji Kartawinata No.15, Kec. Kuningan, Kabupaten Kuningan, Jawa Barat 45511<br />
                    Kabupaten Kuningan<br />
                    Situ, Kec. Kuningan Utara<br />
                    Kabupaten Kuningan, Jawa Barat 45621
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconBrandWhatsapp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">WhatsApp</h3>
                  <p className="text-gray-600">085182245865</p>
                  <p className="text-sm text-gray-500">Hanya menerima pesan WhatsApp</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconMail className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">makanbergizi@kuningankab.go.id</p>
                  <p className="text-sm text-gray-500">Respon dalam 24 jam</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconClock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Jam Operasional</h3>
                  <p className="text-gray-600">
                    Senin - Jumat: 08:00 - 17:00 WIB<br />
                    Sabtu: 08:00 - 12:00 WIB<br />
                    Minggu: Tutup
                  </p>
                </div>
              </div>
            </div>

           
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Kirim Pesan/Pengaduan
            </h2>

            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Pesan Terkirim!</h3>
                <p className="text-green-600">
                  Terima kasih atas pesan Anda.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 text-red-800">
                      <IconAlertCircle className="h-5 w-5" />
                      <p className="font-medium">{error}</p>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Privacy Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <IconShieldLock className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Data Anda kami rahasiakan.</p>
                    </div>
                  </div>

                  {/* Honeypot field - hidden from users, visible to bots */}
                  <input
                    type="text"
                    name="_honeypot"
                    value={formData._honeypot}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Jenis Pelapor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Siapa yang melapor? *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, jenis_pelapor: 'individu', name: '', sppg_id: '' })}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                          formData.jenis_pelapor === 'individu'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <IconUser className={`h-6 w-6 mb-2 ${formData.jenis_pelapor === 'individu' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Individu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSchoolOption(null); setFormData({ ...formData, jenis_pelapor: 'sekolah', name: '', sppg_id: '', tujuan: '', target_id: '' }); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                          formData.jenis_pelapor === 'sekolah'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <IconSchool className={`h-6 w-6 mb-2 ${formData.jenis_pelapor === 'sekolah' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Pihak Sekolah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSchoolOption(null); setFormData({ ...formData, jenis_pelapor: 'sppg', name: '', sppg_id: '', tujuan: '', target_id: '' }); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                          formData.jenis_pelapor === 'sppg'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <IconBuildingFactory className={`h-6 w-6 mb-2 ${formData.jenis_pelapor === 'sppg' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">SPPG</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Fields based on jenis_pelapor */}
                  {formData.jenis_pelapor && (
                    <>
                      {/* Nama field for Individu */}
                      {formData.jenis_pelapor === 'individu' && (
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Lengkap *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            minLength={3}
                            maxLength={100}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Masukkan nama lengkap Anda"
                          />
                        </div>
                      )}

                      {/* Nama Sekolah field for Pihak Sekolah */}
                      {formData.jenis_pelapor === 'sekolah' && (
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Sekolah *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            minLength={3}
                            maxLength={100}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Masukkan nama sekolah"
                          />
                        </div>
                      )}

                      {/* SPPG Select for SPPG */}
                      {formData.jenis_pelapor === 'sppg' && (
                        <div>
                          <label htmlFor="sppg_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih SPPG *
                          </label>
                          <Select
                            inputId="sppg_id"
                            options={sppgOptions.map(sppg => ({ value: sppg.id, label: sppg.name }))}
                            value={
                              formData.sppg_id
                                ? { value: formData.sppg_id, label: sppgOptions.find(s => s.id === formData.sppg_id)?.name || '' }
                                : null
                            }
                            onChange={(option) =>
                              setFormData({ ...formData, sppg_id: (option as { value: string } | null)?.value || '' })
                            }
                            isLoading={sppgLoading}
                            isDisabled={sppgLoading}
                            isClearable
                            placeholder="Cari atau pilih SPPG..."
                            noOptionsMessage={() => 'SPPG tidak ditemukan'}
                            loadingMessage={() => 'Mengambil data SPPG...'}
                            styles={selectStyles}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            maxLength={100}
                            pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}"
                            title="Masukkan email yang valid"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="contoh@email.com"
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Nomor Telepon
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            pattern="[0-9+\s-]{10,15}"
                            maxLength={15}
                            title="Masukkan nomor telepon yang valid (contoh: 081234567890)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="08xxxxxxxxxx"
                          />
                        </div>
                      </div>

                      {/* Tujuan section — only shown for Individu */}
                      {formData.jenis_pelapor === 'individu' && (
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Tujuan
                        </label>
                        <select
                          id="tujuan"
                          name="tujuan"
                          value={formData.tujuan}
                          onChange={(e) => { setSelectedSchoolOption(null); setFormData({ ...formData, tujuan: e.target.value, target_id: '' }); }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Pilih Tujuan (opsional)</option>
                          <option value="sekolah">Sekolah</option>
                          <option value="sppg">SPPG</option>
                        </select>
                      </div>
                      )}

                      {/* Target select based on Tujuan */}
                      {formData.jenis_pelapor === 'individu' && formData.tujuan === 'sppg' && (
                        <div>
                          <label htmlFor="target_sppg" className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih SPPG yang Dituju *
                          </label>
                          <Select
                            inputId="target_sppg"
                            options={sppgOptions.map(s => ({ value: s.id, label: s.name }))}
                            value={formData.target_id ? { value: formData.target_id, label: sppgOptions.find(s => s.id === formData.target_id)?.name || '' } : null}
                            onChange={(option) => setFormData({ ...formData, target_id: (option as { value: string } | null)?.value || '' })}
                            isLoading={sppgLoading}
                            isDisabled={sppgLoading}
                            isClearable
                            placeholder="Cari atau pilih SPPG..."
                            noOptionsMessage={() => 'SPPG tidak ditemukan'}
                            loadingMessage={() => 'Mengambil data SPPG...'}
                            styles={selectStyles}
                          />
                        </div>
                      )}

                      {formData.jenis_pelapor === 'individu' && formData.tujuan === 'sekolah' && (
                        <div>
                          <label htmlFor="target_sekolah" className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Sekolah yang Dituju *
                          </label>
                          <AsyncPaginate
                            inputId="target_sekolah"
                            value={selectedSchoolOption}
                            loadOptions={loadSchoolOptions}
                            additional={{ page: 1 }}
                            onChange={(option) => {
                              const opt = option as { value: string; label: string } | null;
                              setSelectedSchoolOption(opt);
                              setFormData({ ...formData, target_id: opt?.value || '' });
                            }}
                            isClearable
                            placeholder="Cari atau pilih sekolah..."
                            noOptionsMessage={() => 'Sekolah tidak ditemukan'}
                            loadingMessage={() => 'Mengambil data sekolah...'}
                            styles={selectStyles}
                            debounceTimeout={300}
                            key={formData.tujuan}
                          />
                        </div>
                      )}

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Kategori *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Pilih Kategori</option>
                          <option value="keluhan-saran">Keluhan & Saran</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          Pesan *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          minLength={10}
                          maxLength={2000}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          placeholder="Tuliskan pesan Anda di sini..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || (lockedUntil !== null && Date.now() < lockedUntil)}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <IconSend className="h-5 w-5" />
                            <span>Kirim Pesan/Pengaduan</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
              </form>
              </>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasi Kantor</h3>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6 bg-gray-200 rounded-lg min-h-[16rem] flex items-center justify-center">
                  <div className="text-center">
                    <IconMapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Peta Lokasi Kantor</p>
                    <p className="text-sm text-gray-400">Jl. Angkrek No.103, Situ, Kec. Kuningan Utara</p>
                  </div>
                </div>
                {/* LAPOR Section */}
                <div className="col-span-12 lg:col-span-6 bg-blue-50 rounded-lg p-6 border border-blue-100 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Image src="/images/logo_lapor.png" alt="LAPOR" width={40} height={40} />
                    <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">Layanan Aspirasi dan Pengaduan Online Rakyat</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Ada masalah terkait MBG?</h4>
                    <p className="text-gray-600 mt-1">Laporkan kendala atau keluhan Anda melalui layanan <span className="font-medium">LAPOR!</span>. Kami siap menindaklanjuti untuk perbaikan program.</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <a
                      href="https://www.lapor.go.id/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                    >
                      <IconSend className="h-5 w-5" />
                      <span>Laporkan Sekarang</span>
                    </a>
                    <div className="flex items-center text-blue-700">
                      <IconAlertCircle className="h-5 w-5 mr-2" />
                      <span className="text-sm">Respons cepat dan terukur</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Pertanyaan yang Sering Diajukan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Bagaimana cara mendaftarkan sekolah ke program ini?
              </h3>
              <p className="text-gray-600">
                Sekolah dapat mendaftar melalui formulir online atau menghubungi 
                Dinas Pendidikan Kabupaten Kuningan. Tim kami akan melakukan 
                verifikasi dan evaluasi kelayakan sekolah.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Apakah program ini gratis untuk sekolah?
              </h3>
              <p className="text-gray-600">
                Ya, program Makan Bergizi Gratis sepenuhnya gratis untuk sekolah 
                yang terdaftar. Semua biaya operasional ditanggung oleh 
                Pemerintah Kabupaten Kuningan.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Bagaimana kualitas makanan yang disediakan?
              </h3>
              <p className="text-gray-600">
                Menu makanan disusun oleh ahli gizi profesional sesuai standar 
                kesehatan nasional. Setiap menu memenuhi kebutuhan nutrisi 
                harian anak sekolah.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Apakah ada monitoring kualitas program?
              </h3>
              <p className="text-gray-600">
                Ya, kami melakukan monitoring berkala terhadap kualitas makanan, 
                kebersihan dapur, dan kepuasan siswa. Laporan evaluasi 
                tersedia setiap bulan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
