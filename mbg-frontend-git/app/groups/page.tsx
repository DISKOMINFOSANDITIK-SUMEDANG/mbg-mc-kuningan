'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IconSearch, IconUsers, IconFilter } from '@tabler/icons-react';
import { Group, getGroups } from '@/lib/api-client';
import AppLayout from '@/components/shared/AppLayout';
import { GroupsPageSkeleton } from '@/components/shared/PageSkeletons';
import { SkeletonList } from '@/components/shared/Skeleton';

function GroupsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getGroups({
          q: searchQuery || undefined
        });
        setGroups(data);
      } catch (err: any) {
        console.error('Error loading groups:', err);
        setError(err.message || 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    router.push(`/groups?${params.toString()}`);
  };

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cari <span className="text-indigo-600">Kelompok</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Temukan kelompok ibu hamil, ibu menyusui, dan balita yang menerima program makan bergizi gratis
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari kelompok..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <IconFilter className="h-5 w-5" />
                  Filter
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <IconSearch className="h-5 w-5" />
                  Cari
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Results */}
        {loading ? (
          <SkeletonList items={6} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error: {error}</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {groups.length} Kelompok Ditemukan
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <IconUsers className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <IconUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak Ada Kelompok Ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah kata kunci pencarian atau filter yang digunakan.
            </p>
          </div>
        )}
      </main>
    </AppLayout>
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<GroupsPageSkeleton />}>
      <GroupsContent />
    </Suspense>
  );
}
