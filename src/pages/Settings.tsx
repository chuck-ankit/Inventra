import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/api';
import {
  User,
  Bell,
  Palette,
  Globe,
  Shield,
  Save,
  X,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Clock,
  Mail,
  Smartphone,
  Package,
} from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 'Never',
    password: {
      current: '',
      new: '',
      confirm: '',
    },
  });

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Language settings state
  const [languageSettings, setLanguageSettings] = useState({
    interfaceLanguage: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour (AM/PM)',
  });

  const [languageSuccess, setLanguageSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSecuritySettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.startsWith('password.')) {
      const field = name.split('.')[1];
      setSecuritySettings(prev => ({
        ...prev,
        password: {
          ...prev.password,
          [field]: value
        }
      }));
    } else {
      setSecuritySettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    try {
      // Here you would typically call your API to update language settings
      // await updateLanguageSettings({ [name]: value });
      
      setLanguageSettings(prev => ({
        ...prev,
        [name]: value
      }));

      // Show success message
      setLanguageSuccess(true);
      setTimeout(() => setLanguageSuccess(false), 3000);

      // If language is changed, you might want to reload translations
      if (name === 'interfaceLanguage') {
        // await loadTranslations(value);
      }
    } catch (error) {
      console.error('Error updating language settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const { user: updatedUser, token } = await authService.updateProfile(formData);
      updateUser(updatedUser, token);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      setShowSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    // Validate passwords
    if (securitySettings.password.new !== securitySettings.password.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (securitySettings.password.new.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      const { user: updatedUser, token } = await authService.updatePassword({
        currentPassword: securitySettings.password.current,
        password: securitySettings.password.new
      });
      
      // Update user state with new token
      updateUser(updatedUser, token);
      
      // Clear password fields
      setSecuritySettings(prev => ({
        ...prev,
        password: {
          current: '',
          new: '',
          confirm: '',
        }
      }));
      
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password. Please check your current password.');
    }
  };

  const handleTwoFactorToggle = async () => {
    try {
      // Here you would typically call your API to toggle 2FA
      // await toggleTwoFactor(!securitySettings.twoFactorEnabled);
      
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: !prev.twoFactorEnabled
      }));
    } catch (error) {
      console.error('Error toggling 2FA:', error);
    }
  };

  const handleSessionTimeoutChange = async (timeout: string) => {
    try {
      // Here you would typically call your API to update session timeout
      // await updateSessionTimeout(timeout);
      
      setSecuritySettings(prev => ({
        ...prev,
        sessionTimeout: timeout
      }));
    } catch (error) {
      console.error('Error updating session timeout:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-5 w-5" /> },
    { id: 'language', label: 'Language', icon: <Globe className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* Sidebar - Hidden on mobile, shown as dropdown */}
          <div className="lg:col-span-3 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200">
            <div className="p-4 lg:p-6">
              <div className="lg:hidden mb-4">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
              <nav className="hidden lg:block space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    <span className="ml-3">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 p-4 sm:p-6 lg:p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Profile Information</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Update your account's profile information and email address
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        placeholder="Choose a username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
                {showSuccess && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Profile updated successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage how you receive notifications and updates
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Order Updates</h3>
                        <p className="text-sm text-gray-500">Get notified about order status changes</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Appearance Settings</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Customize the look and feel of your dashboard
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button className="flex items-center justify-center space-x-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <Sun className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Light</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <Moon className="h-5 w-5 text-gray-300" />
                        <span className="text-sm font-medium text-gray-300">Dark</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <Monitor className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">System</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Font Size</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <span className="text-sm font-medium text-gray-700">Small</span>
                      </button>
                      <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <span className="text-base font-medium text-gray-700">Medium</span>
                      </button>
                      <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <span className="text-lg font-medium text-gray-700">Large</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Color Scheme</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <button className="w-full h-12 rounded-full bg-blue-600 border-2 border-transparent hover:border-blue-800 shadow-md transition-all duration-200"></button>
                      <button className="w-full h-12 rounded-full bg-green-600 border-2 border-transparent hover:border-green-800 shadow-md transition-all duration-200"></button>
                      <button className="w-full h-12 rounded-full bg-purple-600 border-2 border-transparent hover:border-purple-800 shadow-md transition-all duration-200"></button>
                      <button className="w-full h-12 rounded-full bg-red-600 border-2 border-transparent hover:border-red-800 shadow-md transition-all duration-200"></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Language Settings</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose your preferred language and format settings
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Interface Language</h3>
                    <select 
                      name="interfaceLanguage"
                      value={languageSettings.interfaceLanguage}
                      onChange={handleLanguageChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="English">English</option>
                      <option value="हिंदी">हिंदी (Hindi)</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Date Format</h3>
                    <select 
                      name="dateFormat"
                      value={languageSettings.dateFormat}
                      onChange={handleLanguageChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Time Format</h3>
                    <select 
                      name="timeFormat"
                      value={languageSettings.timeFormat}
                      onChange={handleLanguageChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="12-hour (AM/PM)">12-hour (AM/PM)</option>
                      <option value="24-hour">24-hour</option>
                    </select>
                  </div>
                  {languageSuccess && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Language settings updated successfully
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Security Settings</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage your account security and password
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={securitySettings.twoFactorEnabled}
                        onChange={handleTwoFactorToggle}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Session Timeout</h3>
                    <select 
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => handleSessionTimeoutChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="Never">Never</option>
                    </select>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          name="password.current"
                          value={securitySettings.password.current}
                          onChange={handleSecurityChange}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          name="password.new"
                          value={securitySettings.password.new}
                          onChange={handleSecurityChange}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          name="password.confirm"
                          value={securitySettings.password.confirm}
                          onChange={handleSecurityChange}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handlePasswordUpdate}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>
                    {passwordError && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">
                              {passwordError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                              Password updated successfully
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 