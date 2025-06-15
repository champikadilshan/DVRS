// src/components/layout/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
  const navigate = useNavigate();
  const clearCredentials = useAuthStore((state) => state.clearCredentials);

  const handleLogout = () => {
    clearCredentials();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">AWS Scanner</span>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
