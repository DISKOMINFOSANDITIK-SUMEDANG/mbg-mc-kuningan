'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/shared/AppLayout';
import SchoolDetail from '@/components/schools/SchoolDetail';
import { DetailPageSkeleton } from '@/components/shared/PageSkeletons';
import { getSchoolById, School } from '@/lib/api-client';

export default function SchoolPage() {
  const params = useParams();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadSchool = async () => {
      try {
        setLoading(true);
        const schoolData = await getSchoolById(params.id as string);
        if (!schoolData) {
          setError(true);
        } else {
          setSchool(schoolData);
        }
      } catch (err) {
        console.error('Error fetching school:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadSchool();
    }
  }, [params.id]);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !school) {
    return (
      <AppLayout className="bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sekolah Tidak Ditemukan</h1>
            <p className="text-gray-600">Sekolah yang Anda cari tidak ditemukan atau telah dihapus.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout className="bg-white">
      <section className="py-16 px-4 bg-gray-50">
        <SchoolDetail school={school} />
      </section>
    </AppLayout>
  );
}
