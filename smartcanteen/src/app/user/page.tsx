'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const querySnapshot = await getDocs(collection(db, 'user_detail'));
    const users = querySnapshot.docs.map(doc => doc.data());

    const matchingUser = users.find(
      user => user.username === username && user.password === password
    );

    if (matchingUser) {
      localStorage.setItem('token', username); // Set token
      router.push('/'); // Go to homepage
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1 className="text-2xl font-bold mb-4">User Login</h1>
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
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Login
      </button>
    </div>
  );
}
