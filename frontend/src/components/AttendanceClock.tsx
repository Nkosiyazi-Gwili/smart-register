// components/AttendanceClock.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './ui/Toast';

interface AttendanceRecord {
  id: string;
  type: 'in' | 'out';
  timestamp: Date;
  location: string;
  selfie: string;
  status: 'pending' | 'approved' | 'rejected';
  coordinates: { lat: number; lng: number };
}

// Helper function to calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function AttendanceClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState<'in' | 'out'>('out');
  const [isTakingSelfie, setIsTakingSelfie] = useState(false);
  const [punchHistory, setPunchHistory] = useState<AttendanceRecord[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    getCurrentLocation();

    return () => clearInterval(timer);
  }, [user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Check if within company radius
          if (user?.company) {
            const distance = calculateDistance(
              latitude, 
              longitude, 
              user.company.latitude, 
              user.company.longitude
            );
            
            const withinRadius = distance <= (user.company.radius || 50); // Default 50 meters
            setIsWithinRadius(withinRadius);
            
            // Get address from coordinates (mock for demo)
            const address = await reverseGeocode(latitude, longitude);
            
            setLocation({
              lat: latitude,
              lng: longitude,
              address: address
            });

            if (!withinRadius) {
              addToast(`You are ${Math.round(distance)}m away from workplace. Must be within ${user.company.radius}m`, 'warning');
            }
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          addToast('Unable to get your location', 'warning');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Mock reverse geocoding - in real app, use Google Maps API or similar
    if (user?.company && calculateDistance(lat, lng, user.company.latitude, user.company.longitude) <= (user.company.radius || 50)) {
      return user.company.address;
    }
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      addToast('Camera access denied. Please allow camera permissions.', 'error');
      setIsTakingSelfie(false);
    }
  };

  const captureSelfie = (): Promise<string> => {
    return new Promise((resolve) => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
          resolve(imageData);
        }
      }
      resolve('');
    });
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePunch = async () => {
    if (!isWithinRadius && user?.company) {
      addToast(`You must be within ${user.company.radius}m of workplace to check in/out`, 'error');
      return;
    }

    if (!location) {
      addToast('Unable to verify your location', 'error');
      return;
    }

    setIsTakingSelfie(true);
    await startCamera();
  };

  const confirmSelfie = async () => {
    try {
      const selfie = await captureSelfie();
      stopCamera();

      const newPunch: AttendanceRecord = {
        id: Date.now().toString(),
        type: attendanceStatus === 'out' ? 'in' : 'out',
        timestamp: new Date(),
        location: location?.address || 'Unknown Location',
        selfie: selfie,
        status: 'pending',
        coordinates: { lat: location!.lat, lng: location!.lng }
      };

      setPunchHistory(prev => [newPunch, ...prev]);
      setAttendanceStatus(attendanceStatus === 'out' ? 'in' : 'out');
      setIsTakingSelfie(false);
      
      addToast(`Successfully checked ${newPunch.type} at ${newPunch.timestamp.toLocaleTimeString()}`, 'success');
    } catch (error) {
      addToast('Failed to capture selfie', 'error');
      setIsTakingSelfie(false);
    }
  };

  const cancelSelfie = () => {
    stopCamera();
    setIsTakingSelfie(false);
    addToast('Selfie capture cancelled', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Selfie Modal */}
      {isTakingSelfie && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col safe-area-inset">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <button
                  onClick={cancelSelfie}
                  className="bg-black/50 text-white p-3 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center text-white">
                <p className="text-lg font-semibold mb-2">
                  {attendanceStatus === 'out' ? 'Check In' : 'Check Out'}
                </p>
                <p className="text-sm opacity-90">Position your face in the frame</p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={confirmSelfie}
                  className="bg-white rounded-full p-4 shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 bg-red-500 rounded-full border-4 border-white"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Time Card */}
      <div className="card text-center">
        <div className="text-sm text-gray-600 mb-2">Current Time</div>
        <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
          {currentTime.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
        <div className="text-sm text-gray-600">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Location Status */}
      {user?.company && (
        <div className={`card ${isWithinRadius ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isWithinRadius ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="font-medium">
                  {isWithinRadius ? 'Within Work Area' : 'Outside Work Area'}
                </p>
                <p className="text-sm text-gray-600">
                  {user.company.name} • Radius: {user.company.radius}m
                </p>
              </div>
            </div>
            <button
              onClick={getCurrentLocation}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Punch Button */}
      <div className="card text-center">
        <button
          onClick={handlePunch}
          disabled={!isWithinRadius}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all active:scale-95 ${
            attendanceStatus === 'out' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          } ${!isWithinRadius ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {attendanceStatus === 'out' ? 'Check In' : 'Check Out'}
        </button>
        <p className="text-sm text-gray-600 mt-3">
          You are currently <span className="font-semibold">{attendanceStatus === 'out' ? 'checked out' : 'checked in'}</span>
        </p>
        
        {location && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-left">
            <div className="flex items-center text-sm text-blue-700">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location.address}</span>
            </div>
          </div>
        )}
      </div>

      {/* Today's Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Today's Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {punchHistory.find(p => p.type === 'in')?.timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) || '--:--'}
            </div>
            <div className="text-sm text-gray-600">Check In</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {punchHistory.find(p => p.type === 'out')?.timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) || '--:--'}
            </div>
            <div className="text-sm text-gray-600">Check Out</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {punchHistory.slice(0, 5).map((punch) => (
            <div key={punch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  punch.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium capitalize">{punch.type}</span>
                  {punch.selfie && (
                    <img 
                      src={punch.selfie} 
                      alt="Selfie" 
                      className="w-6 h-6 rounded-full object-cover border"
                    />
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {punch.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-xs text-gray-500">{punch.location}</div>
              </div>
            </div>
          ))}
          {punchHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}