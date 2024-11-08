// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Repositories', path: '/repositories' },
    { name: 'Vulnerabilities', path: '/vulnerabilities' },
  ];

  return (
    <div className="w-64 bg-white shadow-sm">
      <div className="h-full px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
