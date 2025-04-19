'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HiUserCircle } from 'react-icons/hi';  // Icon for user menu

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLoginClick = useCallback((role: 'User' | 'Admin') => {
    router.push(role === 'User' ? '/user' : '/admin');
    setShowMenu(false);
  }, [router]);

  const handleSignupClick = useCallback(() => {
    router.push('/signup');
    setShowMenu(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/');
    setShowMenu(false);
  };

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 relative">
      <h1 className="text-3xl font-extrabold text-center tracking-wide">
        Smart Canteen Management
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
        >
          <HiUserCircle size={30} />
        </button>

        {showMenu && (
          <div className="absolute top-12 right-0 w-48 bg-gray-800 text-white rounded shadow-lg z-50 border border-gray-700">
            {/* Order History Button - Always visible */}
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
              onClick={() => router.push('/history')}
            >
              Order History
            </button>

            {/* Conditional Buttons */}
            {!isLoggedIn ? (
              <>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
                  onClick={() => handleLoginClick('User')}
                >
                  Login as User
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
                  onClick={() => handleLoginClick('Admin')}
                >
                  Login as Admin
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
                  onClick={handleSignupClick}
                >
                  Signup
                </button>
              </>
            ) : (
              <>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-150"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
