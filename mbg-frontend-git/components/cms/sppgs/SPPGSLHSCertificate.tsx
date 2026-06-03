'use client';

import { useState, useEffect } from 'react';
import { IconCertificate, IconEdit, IconDeviceFloppy, IconX, IconPlus, IconDownload, IconCalendar } from '@tabler/icons-react';
import FileUpload from '@/components/cms/shared/FileUpload';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import FileDisplay from '@/components/cms/shared/FileDisplay';

interface SLHSCertificate {
  id: string;
  certificate_number: string;
  file_url: string;
  issue_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

interface SPPGSLHSCertificateProps {
  sppgId: string;
}

export default function SPPGSLHSCertificate({ sppgId }: SPPGSLHSCertificateProps) {
  const [certificate, setCertificate] = useState<SLHSCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    certificate_number: '',
    file_url: '',
    issue_date: '',
    expiry_date: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadCertificate();
  }, [sppgId]);

  const loadCertificate = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/slhs-certificate`));
      if (!response.ok) {
        throw new Error('Failed to fetch SLHS certificate');
      }
      const data = await response.json();
      setCertificate(data);
      if (data) {
        setFormData({
          certificate_number: data.certificate_number || '',
          file_url: data.file_url || '',
          issue_date: data.issue_date || '',
          expiry_date: data.expiry_date || ''
        });
      }
    } catch (error) {
      console.error('Error loading certificate:', error);
      setError('Gagal memuat sertifikat SLHS');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.certificate_number.trim() || !formData.issue_date || !formData.expiry_date) {
      setError('Nomor sertifikat, tanggal terbit, dan tanggal berakhir harus diisi');
      return;
    }

    try {
      const method = certificate ? 'PUT' : 'POST';
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/slhs-certificate`), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save certificate');
      }

      setIsEditing(false);
      loadCertificate();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (certificate) {
      setFormData({
        certificate_number: certificate.certificate_number || '',
        file_url: certificate.file_url || '',
        issue_date: certificate.issue_date || '',
        expiry_date: certificate.expiry_date || ''
      });
    } else {
      setFormData({
        certificate_number: '',
        file_url: '',
        issue_date: '',
        expiry_date: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Sertifikat Laik Higiene Sanitasi (SLHS)</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {certificate ? <IconEdit className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
            {certificate ? 'Edit' : 'Tambah'} Sertifikat
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Sertifikat *
                </label>
                <input
                  type="text"
                  name="certificate_number"
                  value={formData.certificate_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nomor sertifikat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Sertifikat SLHS (PDF)
                </label>
                <FileUpload
                  onUpload={(url) => setFormData(prev => ({ ...prev, file_url: url }))}
                  onRemove={() => setFormData(prev => ({ ...prev, file_url: '' }))}
                  currentUrl={formData.file_url}
                  accept=".pdf"
                  maxSize={10}
                  folder="slhs-certificates"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Terbit *
                </label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir *
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <IconX className="h-4 w-4 inline mr-2" />
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <IconDeviceFloppy className="h-4 w-4 inline mr-2" />
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {certificate ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                    <IconCertificate className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Sertifikat SLHS</h4>
                    <p className="text-sm text-gray-600">No. {certificate.certificate_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isExpired(certificate.expiry_date) ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Kedaluwarsa
                    </span>
                  ) : isExpiringSoon(certificate.expiry_date) ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Akan Kedaluwarsa
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Aktif
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <IconCalendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Diterbitkan:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(certificate.issue_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconCalendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Berlaku hingga:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(certificate.expiry_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {certificate.file_url && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">File Sertifikat:</h5>
                    <FileDisplay
                      url={certificate.file_url}
                      type="pdf"
                      className="w-full h-32"
                      showDownload={true}
                      showExternal={true}
                    />
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>Diperbarui: {new Date(certificate.updated_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <IconCertificate className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Sertifikat SLHS</h4>
              <p className="text-gray-600">Tambahkan sertifikat SLHS untuk SPPG ini</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
