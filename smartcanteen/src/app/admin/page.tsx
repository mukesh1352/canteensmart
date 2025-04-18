'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admin'));
      const users = querySnapshot.docs.map(doc => doc.data());

      const matchingUser = users.find(
        user => user.username === username && user.password === password
      );

      if (matchingUser) {
        router.push('/adminpage'); // ✅ Redirect to adminpage
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error occurred during login.');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="border p-2 mb-4 w-full max-w-sm"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 mb-4 w-full max-w-sm"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Login
      </button>
    </div>
  );
}
