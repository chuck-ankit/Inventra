import { useAuthStore } from '../../stores/authStore';
import { Bell, User, LogOut, Menu, Search, X, Settings, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import db from '../../db/db';
import { LowStockAlert } from '../../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [alertItems, setAlertItems] = useState<Record<string, any>>({});
  const [showAlerts, setShowAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch alerts and their associated items
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const lowStockAlerts = await db.lowStockAlerts
          .where('resolved')
          .equals(0)
          .toArray();
        
        setAlerts(lowStockAlerts);

        // Fetch associated items
        const items: Record<string, any> = {};
        for (const alert of lowStockAlerts) {
          const item = await db.inventory.get(alert.itemId);
          if (item) {
            items[alert.itemId] = item;
          }
        }
        setAlertItems(items);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();

    // Listen for new alerts
    const handleNewAlert = () => {
      fetchAlerts();
    };

    window.addEventListener('low-stock-alert', handleNewAlert);
    
    return () => {
      window.removeEventListener('low-stock-alert', handleNewAlert);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close search on route change
  useEffect(() => {
    setShowSearch(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white shadow-sm z-10 sticky top-0 backdrop-blur-sm bg-white/90">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg md:hidden transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center ml-2 md:ml-0 group">
              <img src="/logo.svg" alt="Inventra Logo" className="h-8 w-8 transition-transform duration-200 group-hover:scale-105" />
              <h1 className="ml-2 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Inventra</h1>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full h-10 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  isSearchFocused ? 'shadow-md' : ''
                }`}
              />
              <Search className={`absolute left-3 top-2.5 h-5 w-5 transition-colors duration-200 ${
                isSearchFocused ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </form>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Mobile Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg md:hidden transition-colors duration-200"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => navigate('/help')}
                className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
                aria-label="Help"
              >
                <HelpCircle size={20} />
              </button>
            </div>

            {/* Notifications */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg relative transition-colors duration-200"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform translate-x-1/2 -translate-y-1/2 animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>
              
              {showAlerts && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ease-out">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b flex justify-between items-center">
                      <h3 className="font-medium">Notifications</h3>
                      {alerts.length > 0 && (
                        <button
                          onClick={() => {/* Handle mark all as read */}}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {alerts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {alerts.map((alert) => {
                          const item = alertItems[alert.itemId];
                          return (
                            <div 
                              key={alert.id} 
                              className="px-4 py-3 text-sm text-gray-700 border-b hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                              onClick={() => navigate(`/inventory/${alert.itemId}`)}
                            >
                              <p className="font-medium text-red-600">Low Stock Alert</p>
                              <p className="mt-1">{item?.name || 'Unknown item'} is below minimum quantity</p>
                              <p className="mt-1 text-xs text-gray-500">{alert.date.toLocaleString()}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-200">
                  <User size={18} />
                </div>
                <span className="ml-2 text-gray-700 hidden md:block">{user?.username}</span>
              </button>
              
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ease-out">
                  <div className="py-1">
                    <div className="block px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.username}</p>
                      <p className="text-gray-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <Settings size={16} className="mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          navigate('/help');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <HelpCircle size={16} className="mr-2" />
                        Help & Support
                      </button>
                      <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="md:hidden px-4 py-2 border-t border-gray-200 animate-slideDown">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full h-10 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

export default Navbar;