'use client';

import { useState, useEffect } from 'react';
import { IconX, IconUser, IconMail, IconPhone, IconCamera, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';
import FileUpload from './FileUpload';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  user_profiles: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
  }[];
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserProfileModal({ isOpen, onClose, onSuccess }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });
  
  // Account form data
  const [accountData, setAccountData] = useState({
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/cms/profile'), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        
        // Set profile form data — handle both nested and flat response
        const profile = data.user_profiles?.[0] || data;
        setProfileData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || ''
        });
        
        // Set account form data
        setAccountData({
          email: data.email || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/cms/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setSuccess('Profil berhasil diperbarui!');
        onSuccess();
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    if (accountData.new_password && accountData.new_password !== accountData.confirm_password) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (accountData.new_password && accountData.new_password.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/cms/account'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: accountData.email,
          current_password: accountData.current_password,
          new_password: accountData.new_password || undefined
        }),
      });

      if (response.ok) {
        setSuccess('Akun berhasil diperbarui!');
        onSuccess();
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      setError('Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setProfileData(prev => ({ ...prev, avatar_url: url }));
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    return new Date(lastLogin).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Pengaturan Profil</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Akun
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 font-medium">✓ {success}</p>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative p-2 border-2 border-dashed border-gray-300 rounded-full">
                  <FileUpload
                    onUpload={handleAvatarUpload}
                    currentUrl={profileData.avatar_url}
                    accept="image/*"
                    maxSize={5}
                    folder="avatars"
                    className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                  />
                  {profileData.avatar_url && (
                    <div className="absolute inset-2 rounded-full overflow-hidden pointer-events-none">
                      <img
                        src={profileData.avatar_url}
                        alt="Current Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Always visible camera icon with background */}
                  <div className="absolute inset-2 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 rounded-full p-2 shadow-sm">
                      <IconCamera className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {profileData.avatar_url ? 'Ubah Avatar' : 'Upload Avatar'}
                  </p>
                  <p className="text-xs text-gray-500">JPG, PNG atau GIF. Maksimal 5MB.</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* User Info Display */}
              {userProfile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Informasi Akun</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium text-gray-900">{userProfile.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <p className="font-medium text-gray-900 capitalize">{userProfile.role}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium text-gray-900">
                        {userProfile.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Terakhir Login:</span>
                      <p className="font-medium text-gray-900">{formatLastLogin(userProfile.last_login)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Saat Ini *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={accountData.current_password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, current_password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.current ? (
                      <IconEyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <IconEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={accountData.new_password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, new_password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.new ? (
                      <IconEyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <IconEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              {accountData.new_password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={accountData.confirm_password}
                      onChange={(e) => setAccountData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!!accountData.new_password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <IconEyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <IconEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
