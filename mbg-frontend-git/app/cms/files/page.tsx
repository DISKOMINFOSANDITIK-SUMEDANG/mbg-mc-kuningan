'use client';

import { useState, useEffect } from 'react';
import { IconUpload, IconPhoto, IconFileText, IconTrash, IconDownload, IconExternalLink } from '@tabler/icons-react';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import FileUpload from '@/components/cms/shared/FileUpload';
import FileDisplay from '@/components/cms/shared/FileDisplay';
import { PageLoadingState } from '@/components/cms/shared/LoadingState';

const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || '';

interface FileItem {
  name: string;
  id: string;
  updated_at: string;
  url?: string;
  metadata: {
    size: number;
    mimetype?: string;
  };
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('kitchen-photos');
  const [error, setError] = useState('');

  const folders = [
    { id: 'kitchen-photos', name: 'Foto Dapur', icon: IconPhoto },
    { id: 'nutritionist-photos', name: 'Foto Ahli Gizi', icon: IconPhoto },
    { id: 'slhs-certificates', name: 'Sertifikat SLHS', icon: IconFileText },
  ];

  useEffect(() => {
    loadFiles();
  }, [selectedFolder]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files?folder=${selectedFolder}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
      setError('Gagal memuat file');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (url: string) => {
    setUploading(true);
    try {
      // File sudah diupload, reload list
      await loadFiles();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) {
      return;
    }

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder: selectedFolder,
          fileName: fileName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      await loadFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setError('Gagal menghapus file');
    }
  };

  const getFileUrl = (file: FileItem) => {
    // Use presigned URL from backend if available
    if (file.url) return file.url;
    // Fallback to constructing URL
    return `${STORAGE_BASE_URL}/${STORAGE_BUCKET}/${selectedFolder}/${file.name}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: FileItem): 'image' | 'pdf' => {
    const mimetype = file.metadata?.mimetype;
    if (mimetype) {
      if (mimetype.startsWith('image/')) return 'image';
      if (mimetype === 'application/pdf') return 'pdf';
    }
    // Fallback: detect by file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'pdf';
  };

  return (
    <CMSLayout>
      <ClientOnly fallback={<PageLoadingState message="Memuat halaman..." />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen File</h1>
              <p className="text-gray-600">Kelola file upload untuk SPPG</p>
            </div>
          </div>

          {/* Folder Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Folder</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {folders.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedFolder === folder.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-gray-900">{folder.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File Baru</h3>
            <FileUpload
              onUpload={handleUpload}
              accept={selectedFolder === 'slhs-certificates' ? '.pdf' : 'image/*'}
              maxSize={selectedFolder === 'slhs-certificates' ? 10 : 5}
              folder={selectedFolder}
              className="max-w-md"
            />
          </div>

          {/* Files List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File dalam Folder</h3>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada file dalam folder ini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => {
                  const fileUrl = getFileUrl(file);
                  const fileType = getFileType(file);
                  
                  return (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                      <FileDisplay
                        url={fileUrl}
                        type={fileType}
                        className="w-full h-32 mb-3"
                        showDownload={true}
                        showExternal={true}
                      />
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.metadata.size)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.updated_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDelete(file.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus file"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
