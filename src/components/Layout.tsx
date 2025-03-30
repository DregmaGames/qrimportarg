import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Package, User, Settings as SettingsIcon, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  brand_name: string;
  tax_id: string;
}

function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 50) {
        setIsHovering(true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
        setIsHovering(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('brand_name, tax_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center ml-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg"
                  alt="Argentina Flag"
                  className="h-6 w-8 object-cover rounded"
                />
                <h1 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">
                  Import QR ARG
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="hidden sm:flex sm:items-center sm:space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{userProfile.brand_name}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-gray-600 dark:text-gray-400">CUIT: {userProfile.tax_id}</span>
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          if (!isSidebarOpen) {
            setIsHovering(false);
          }
        }}
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen || isHovering ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '250px' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg"
            alt="Argentina Flag"
            className="h-8 w-10 object-cover rounded"
          />
          <h2 className="ml-3 text-lg font-bold text-gray-800 dark:text-white">
            Import QR ARG
          </h2>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-col pt-4">
          <Link
            to="/products"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              location.pathname === '/products'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Package className="w-5 h-5 mr-3" />
            {t('navigation.products')}
          </Link>
          <Link
            to="/profile"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              location.pathname === '/profile'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <User className="w-5 h-5 mr-3" />
            {t('navigation.users')}
          </Link>
          <Link
            to="/settings"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              location.pathname === '/settings'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mr-3" />
            {t('navigation.settings')}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;