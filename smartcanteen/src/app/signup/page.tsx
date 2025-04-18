'use client';

import React, { useRef, useEffect, useState } from 'react';
import anime from 'animejs';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Page() {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    anime({
      targets: '.container',
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo',
    });

    inputRefs.current.forEach((input, i) => {
      if (input) {
        anime({
          targets: input,
          translateX: [40 * (i + 1), 0],
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutExpo',
          delay: 500 + i * 100,
        });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ Zod Validation
    const result = schema.safeParse({ username, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    try {
      // 🔍 Check if username already exists
      const q = query(collection(db, 'user_detail'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Username already exists. Please choose a different one.');
        return;
      }

      // ✅ Add user to Firestore
      await addDoc(collection(db, 'user_detail'), {
        username,
        password,
        createdAt: serverTimestamp(),
      });

      alert('User signed up!');
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Error during signup:', error);
      setError('Error signing up. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="container max-w-md w-full p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <input
            ref={(el) => {
              inputRefs.current[0] = el!;
            }}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 rounded-lg px-3 py-2 text-base w-full"
          />
          <input
            ref={(el) => {
              inputRefs.current[1] = el!;
            }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 rounded-lg px-3 py-2 text-base w-full"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
