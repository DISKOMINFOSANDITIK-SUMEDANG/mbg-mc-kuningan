'use client';

import { useState, useEffect } from 'react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

interface BeneficiaryTargets {
  total_realized: number;
  total_target: number;
  pesantren_realized: number;
  pesantren_total: number;
  santri_realized: number;
  santri_target: number;
  sekolah_realized: number;
  sekolah_total: number;
  siswa_realized: number;
  siswa_target: number;
  ibu_balita_realized: number;
  ibu_balita_target: number;
  bumil_realized: number;
  bumil_target: number;
  busui_realized: number;
  busui_target: number;
  balita_realized: number;
  balita_target: number;
}

const FIELD_GROUPS = [
  {
    title: 'Ringkasan Total',
    color: 'orange',
    fields: [
      { key: 'total_realized', label: 'Total Penerima (Realisasi)' },
      { key: 'total_target', label: 'Total Target Penerima' },
    ],
  },
  {
    title: 'Pesantren',
    color: 'emerald',
    fields: [
      { key: 'pesantren_realized', label: 'Pesantren Sudah Menerima' },
      { key: 'pesantren_total', label: 'Total Pesantren' },
      { key: 'santri_realized', label: 'Santri Penerima (Realisasi)' },
      { key: 'santri_target', label: 'Target Santri' },
    ],
  },
  {
    title: 'Sekolah',
    color: 'blue',
    fields: [
      { key: 'sekolah_realized', label: 'Sekolah Sudah Menerima' },
      { key: 'sekolah_total', label: 'Total Sekolah' },
      { key: 'siswa_realized', label: 'Siswa Penerima (Realisasi)' },
      { key: 'siswa_target', label: 'Target Siswa' },
    ],
  },
  {
    title: 'Ibu & Balita',
    color: 'pink',
    fields: [
      { key: 'ibu_balita_realized', label: 'Ibu & Balita Penerima (Realisasi)' },
      { key: 'ibu_balita_target', label: 'Target Ibu & Balita' },
      { key: 'bumil_realized', label: 'Bumil Penerima (Realisasi)' },
      { key: 'bumil_target', label: 'Target Bumil' },
      { key: 'busui_realized', label: 'Busui Penerima (Realisasi)' },
      { key: 'busui_target', label: 'Target Busui' },
      { key: 'balita_realized', label: 'Balita Penerima (Realisasi)' },
      { key: 'balita_target', label: 'Target Balita' },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  orange: 'border-orange-200 bg-orange-50',
  emerald: 'border-emerald-200 bg-emerald-50',
  blue: 'border-blue-200 bg-blue-50',
  pink: 'border-pink-200 bg-pink-50',
};

const TITLE_COLOR_MAP: Record<string, string> = {
  orange: 'text-orange-700',
  emerald: 'text-emerald-700',
  blue: 'text-blue-700',
  pink: 'text-pink-700',
};

export default function BeneficiaryTargetsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<BeneficiaryTargets>({
    total_realized: 0,
    total_target: 0,
    pesantren_realized: 0,
    pesantren_total: 0,
    santri_realized: 0,
    santri_target: 0,
    sekolah_realized: 0,
    sekolah_total: 0,
    siswa_realized: 0,
    siswa_target: 0,
    ibu_balita_realized: 0,
    ibu_balita_target: 0,
    bumil_realized: 0,
    bumil_target: 0,
    busui_realized: 0,
    busui_target: 0,
    balita_realized: 0,
    balita_target: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cms/settings/beneficiary-targets', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Gagal memuat data');
      const data = await response.json();
      setForm(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data target penerima manfaat.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof BeneficiaryTargets, value: string) => {
    const num = value === '' ? 0 : parseInt(value.replace(/\D/g, ''), 10);
    setForm((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch('/api/cms/settings/beneficiary-targets', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal menyimpan data');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientOnly>
      <CMSLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Target Penerima Manfaat</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola data target dan realisasi penerima manfaat yang ditampilkan di halaman utama website.
            </p>
          </div>

          {loading ? (
            <PageLoadingState />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                  Data berhasil disimpan.
                </div>
              )}

              {FIELD_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className={`rounded-xl border p-6 ${COLOR_MAP[group.color]}`}
                >
                  <h2 className={`text-base font-semibold mb-4 ${TITLE_COLOR_MAP[group.color]}`}>
                    {group.title}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {field.label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form[field.key as keyof BeneficiaryTargets]}
                          onChange={(e) =>
                            handleChange(field.key as keyof BeneficiaryTargets, e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={loadData}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </CMSLayout>
    </ClientOnly>
  );
}
