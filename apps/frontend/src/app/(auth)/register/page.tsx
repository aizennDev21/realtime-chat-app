'use client';
import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ email: '', username: '', password: '', display_name: '' });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/v1/auth/register', formData);
      router.push('/login');
    } catch (error: any) {
      console.error('Error detail:', error.response?.data);
      alert('Registrasi gagal: ' + JSON.stringify(error.response?.data?.message || 'Unknown'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-5">Daftar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2" />
        <input type="text" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border p-2" />
        <input type="text" placeholder="Display Name" onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full border p-2" />
        <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border p-2" />
        <button type="submit" className="w-full bg-blue-500 text-white p-2">Daftar</button>
      </form>
    </div>
  );
}
