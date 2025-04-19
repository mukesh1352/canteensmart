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
import { useRouter } from 'next/navigation';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Page() {
  const router = useRouter();
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    try {
      // ✅ Zod Validation
      const result = schema.safeParse({ username, password });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

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

      // 🚀 Redirect to user page on success
      router.push('/user');
    } catch (error) {
      console.error('Error during signup:', error);
      setError('Error signing up. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-black/80"></div> {/* Dark overlay */}
      <div className="container max-w-md w-full p-8 bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 relative">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6 text-center">
          Create Account
        </h2>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-cyan-200 text-sm font-medium mb-1">
              Username
            </label>
            <input
             ref={(el) => {
                inputRefs.current[0] = el!;
              }}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 rounded-lg px-4 py-3 w-full"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-cyan-200 text-sm font-medium mb-1">
              Password
            </label>
            <input
              ref={(el) => {
                inputRefs.current[0] = el!;
              }}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 rounded-lg px-4 py-3 w-full"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center ${
              isSubmitting ? 'opacity-70' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/user" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}
