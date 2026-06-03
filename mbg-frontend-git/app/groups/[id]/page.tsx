'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getGroupById, Group } from '@/lib/api-client';
import GroupDetail from '@/components/groups/GroupDetail';
import AppLayout from '@/components/shared/AppLayout';
import { DetailPageSkeleton } from '@/components/shared/PageSkeletons';

export default function GroupPage() {
  const params = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        setLoading(true);
        const groupData = await getGroupById(params.id as string);
        if (!groupData) {
          setError(true);
        } else {
          setGroup(groupData);
        }
      } catch (err) {
        console.error('Error loading group:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadGroup();
    }
  }, [params.id]);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !group) {
    return (
      <AppLayout>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Kelompok Tidak Ditemukan</h1>
            <p className="text-gray-600">Kelompok yang Anda cari tidak ditemukan atau telah dihapus.</p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <GroupDetail group={group} />
      </main>
    </AppLayout>
  );
}

