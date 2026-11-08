'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function ChatDashboard() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return <div>Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard Chat</h1>
      <p>Selamat datang, {user?.displayName}!</p>
      <div className="flex gap-4 mt-4">
        <button 
          onClick={() => router.push('/discover')} 
          className="bg-blue-500 text-white p-2 rounded"
        >
          Jelajahi Grup
        </button>
        <button onClick={logout} className="bg-red-500 text-white p-2 rounded">Logout</button>
      </div>
    </div>
  );
}
