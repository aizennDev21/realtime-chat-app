'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export default function DiscoverPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      const token = useAuthStore.getState().accessToken;
      try {
        const { data } = await axios.get('http://localhost:3001/api/v1/groups/discover', { 
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` }
        });
        setGroups(data.items);
      } catch (error) {
        console.error('Gagal memuat grup:', error);
      }
    };
    fetchGroups();
  }, []);

  const handleJoin = async (groupId: string) => {
    const token = useAuthStore.getState().accessToken;
    try {
      await axios.post(`http://localhost:3001/api/v1/groups/${groupId}/join`, {}, { 
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
      });
      router.push(`/chat`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal bergabung');
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">Jelajah Grup</h1>
      <div className="grid gap-4">
        {groups.map(group => (
          <div key={group.id} className="border p-4 rounded flex justify-between items-center">
            <div>
              <h2 className="font-bold">{group.name}</h2>
              <p className="text-sm text-gray-600">{group.memberCount} anggota</p>
            </div>
            <button onClick={() => handleJoin(group.id)} className="bg-green-500 text-white px-4 py-2 rounded">Gabung</button>
          </div>
        ))}
      </div>
    </div>
  );
}
