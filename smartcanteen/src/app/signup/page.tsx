'use client';

import React, { useRef, useEffect } from 'react';
import anime from 'animejs';

export default function Page() {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    // Animate container
    anime({
      targets: '.container',
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo',
    });

    // Animate inputs
    inputRefs.current.forEach((input, i) => {
      if (input) {
        anime({
          targets: input,
          translateX: [40 * (i + 1), 0], // Move more to the right
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutExpo',
          delay: 500 + (i * 100),
        });
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="container max-w-md w-full p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h2>
        <form className="space-y-4">
          <input
           ref={(el) => {
            inputRefs.current[0] = el!;
          }}
          
            type="text"
            placeholder="Username"
            className="input bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 rounded-lg px-3 py-2 text-base w-full"
          />
          <input
            ref={(el) => {
                inputRefs.current[0] = el!;
              }}
              
            type="email"
            placeholder="Email"
            className="input bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 rounded-lg px-3 py-2 text-base w-full"
          />
          <input
            ref={(el) => {
                inputRefs.current[0] = el!;
              }}
              
            type="password"
            placeholder="Password"
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
