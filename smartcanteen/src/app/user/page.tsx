'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'user_detail'));
      const users = querySnapshot.docs.map((doc) => doc.data());

      const matchingUser = users.find(
        (user) => user.username === username && user.password === password
      );

      if (matchingUser) {
        localStorage.setItem('token', username); // Set token
        router.push('/'); // Redirect to homepage
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error occurred during login.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <motion.div
        className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-gray-700"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <h1 className="text-4xl font-bold text-center text-white mb-8 tracking-tight">
              User Login
            </h1>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-8 rounded-lg shadow-2xl max-w-sm w-full transform transition-all duration-300">
              <Dialog.Title className="text-2xl font-bold text-center mb-6 text-white">
                User Login
              </Dialog.Title>

              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input input-bordered input-primary w-full bg-gray-700 text-white border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-600 transition-all duration-300 rounded-lg py-2 px-4"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered input-primary w-full bg-gray-700 text-white border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-600 transition-all duration-300 rounded-lg py-2 px-4"
                />
                <button
                  onClick={handleLogin}
                  className="btn btn-primary w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-lg py-2 transition-all duration-300"
                >
                  Login
                </button>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="absolute top-2 right-2 text-white hover:text-indigo-500 transition-all duration-300"
                >
                  ✕
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </motion.div>
    </div>
  );
}
