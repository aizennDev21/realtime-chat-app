'use client';
import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const setUser = useAuthStore(state => state.setUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3001/api/v1/auth/login', formData, { withCredentials: true });
      // In real app, fetch user profile after login
      setUser({ id: '1', email: formData.email, username: 'user', displayName: 'User', role: 'USER' }, data.accessToken);
      router.push('/chat');
    } catch (error) {
      alert('Login gagal');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-5">Masuk</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2" />
        <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border p-2" />
        <button type="submit" className="w-full bg-blue-500 text-white p-2">Masuk</button>
      </form>
    </div>
  );
}
