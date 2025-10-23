'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

interface Attendance {
  _id: string;
  date: string;
  clockIn?: {
    time: string;
    location: any;
    verified: boolean;
  };
  clockOut?: {
    time: string;
    location: any;
    verified: boolean;
  };
  status: string;
  totalHours: number;
}

export default function AttendanceClock() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentLocation();
    fetchTodayAttendance();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError('Location access is required for attendance tracking. Please enable location services.');
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/today`);
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      setError('Please enable location services and allow location access.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // In a real app, you would capture a selfie here
      const selfie = 'selfie_data_placeholder';
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/attendance/clock-in`, {
        latitude: location.latitude,
        longitude: location.longitude,
        selfie,
        notes: 'Clock in from web app'
      });

      setAttendance(response.data.attendance);
      setSuccess('Clock in successful! Welcome to work.');
      
      // Refresh attendance data
      fetchTodayAttendance();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Clock in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const selfie = 'selfie_data_placeholder';
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/attendance/clock-out`, {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        selfie,
        notes: 'Clock out from web app'
      });

      setAttendance(response.data.attendance);
      setSuccess('Clock out successful! Have a great day.');
      
      // Refresh attendance data
      fetchTodayAttendance();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Clock out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canClockIn = !attendance?.clockIn?.time;
  const canClockOut = attendance?.clockIn?.time && !attendance?.clockOut?.time;
  const currentStatus = attendance?.status || 'absent';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'late': return 'text-orange-600 bg-orange-100';
      case 'absent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold text-center mb-6">Attendance Clock</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              hour12: true 
            })}
          </div>
          <div className="text-lg text-gray-600 mb-2">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}>
            Status: {currentStatus.toUpperCase()}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleClockIn}
            disabled={!canClockIn || loading || !location}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
              canClockIn 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Clock In
              </span>
            )}
          </button>

          <button
            onClick={handleClockOut}
            disabled={!canClockOut || loading || !location}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
              canClockOut 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Clock Out
              </span>
            )}
          </button>
        </div>

        {attendance && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Today's Attendance Record
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Clock In:</span>
                  <span className="font-medium">
                    {attendance.clockIn?.time 
                      ? new Date(attendance.clockIn.time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : '--:--'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clock Out:</span>
                  <span className="font-medium">
                    {attendance.clockOut?.time 
                      ? new Date(attendance.clockOut.time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : '--:--'
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium">
                    {attendance.totalHours > 0 
                      ? `${attendance.totalHours.toFixed(2)} hrs`
                      : '--'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location Verified:</span>
                  <span className={`font-medium ${attendance.clockIn?.verified ? 'text-green-600' : 'text-orange-600'}`}>
                    {attendance.clockIn?.verified ? 'Yes' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!location && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-700 text-sm">
                Location services are required for attendance tracking. Please allow location access.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}