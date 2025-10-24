'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Smart Register
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Eskilz College Attendance System
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your college email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </div>
        </form>
        
        {/* Demo Credentials Section */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Demo Accounts - Click to Auto-fill</h3>
            
            {/* Admin Account */}
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                 onClick={() => fillDemoCredentials('admin@eskilzcollege.co.za', 'admin123')}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800">System Administrator</p>
                  <p className="text-xs text-blue-600">admin@eskilzcollege.co.za</p>
                </div>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Admin</span>
              </div>
            </div>

            {/* Manager Accounts */}
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                   onClick={() => fillDemoCredentials('hr@eskilzcollege.co.za', 'password123')}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-800">HR Manager</p>
                    <p className="text-xs text-green-600">hr@eskilzcollege.co.za</p>
                  </div>
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Manager</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                   onClick={() => fillDemoCredentials('it@eskilzcollege.co.za', 'password123')}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-purple-800">IT Manager</p>
                    <p className="text-xs text-purple-600">it@eskilzcollege.co.za</p>
                  </div>
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">Manager</span>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                   onClick={() => fillDemoCredentials('academic@eskilzcollege.co.za', 'password123')}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-orange-800">Academic Manager</p>
                    <p className="text-xs text-orange-600">academic@eskilzcollege.co.za</p>
                  </div>
                  <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">Manager</span>
                </div>
              </div>
            </div>

            {/* Employee Accounts */}
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                   onClick={() => fillDemoCredentials('john.doe@eskilzcollege.co.za', 'password123')}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Software Developer</p>
                    <p className="text-xs text-gray-600">john.doe@eskilzcollege.co.za</p>
                  </div>
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">Employee</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                   onClick={() => fillDemoCredentials('linda.brown@eskilzcollege.co.za', 'password123')}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Lecturer</p>
                    <p className="text-xs text-gray-600">linda.brown@eskilzcollege.co.za</p>
                  </div>
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">Employee</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                   onClick={() => fillDemoCredentials('jane.smith@eskilzcollege.co.za', 'password123')}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Sales Executive</p>
                    <p className="text-xs text-gray-600">jane.smith@eskilzcollege.co.za</p>
                  </div>
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">Employee</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>All passwords:</strong> password123 (except Admin: admin123)
              </p>
            </div>
          </div>
        </div>

        {/* College Information */}
        <div className="text-center">
          <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Eskilz Private FET College</h4>
            <p className="text-xs text-blue-700">
              267 Market Street, Witkoppen Rd, Noordhang, Randburg, 2188
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Modern Attendance System with GPS & Facial Recognition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}