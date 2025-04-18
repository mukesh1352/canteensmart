"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import anime from 'animejs';
import { useRouter } from 'next/navigation';

const Header = () => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLoginOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Animation effect
  useEffect(() => {
    setIsMounted(true);
    
    if (headerRef.current) {
      headerRef.current.style.opacity = '0';
      headerRef.current.style.transform = 'translateY(-20px) scale(0.95)';
      headerRef.current.style.letterSpacing = '0.2em';

      const animation = anime({
        targets: headerRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        scale: [0.95, 1],
        letterSpacing: ['0.2em', '0em'],
        duration: 1200,
        easing: 'easeOutElastic(1, .8)',
        delay: 300,
      });

      return () => {
        animation.pause();
      };
    }
  }, []);

  const handleLoginClick = useCallback((role: 'User' | 'Admin') => {
    router.push(role === 'User' ? '/user' : '/admin');
    setShowLoginOptions(false);
  }, [router]);

  const handleSignupClick = useCallback(() => {
    setShowSignupModal(true);
  }, []);

  const handleCloseSignupModal = useCallback(() => {
    setShowSignupModal(false);
  }, []);

  const handleRegister = useCallback(() => {
    setShowSignupModal(false);
    router.push('/signup');
  }, [router]);

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
      <h1
        ref={headerRef}
        className="text-3xl font-extrabold text-center tracking-wide"
        style={isMounted ? {} : { opacity: 0 }}
      >
        Smart Canteen Management
      </h1>

      <div className="flex gap-3">
        {/* Login Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="bg-gray-800 text-green-400 font-semibold px-6 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
            onClick={() => setShowLoginOptions(!showLoginOptions)}
            aria-haspopup="true"
            aria-expanded={showLoginOptions}
            aria-label="Login options"
          >
            Login
          </button>

          {showLoginOptions && (
            <div 
              className="absolute right-0 mt-2 w-40 bg-gray-800 text-white rounded shadow-lg z-50 border border-gray-700"
              role="menu"
            >
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
                onClick={() => handleLoginClick('User')}
                role="menuitem"
              >
                User
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
                onClick={() => handleLoginClick('Admin')}
                role="menuitem"
              >
                Admin
              </button>
            </div>
          )}
        </div>

        {/* Signup Button */}
        <button
          className="bg-gray-800 text-green-400 font-semibold px-6 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          onClick={handleSignupClick}
          aria-label="Sign up"
        >
          Signup
        </button>
      </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white p-8 rounded-lg w-full max-w-md mx-4 text-gray-800 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Signup</h2>
            <p className="mb-6">Click below to complete your registration.</p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:outline-none"
                onClick={handleRegister}
              >
                Go to Signup Page
              </button>
              <button
                className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors duration-200 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                onClick={handleCloseSignupModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;