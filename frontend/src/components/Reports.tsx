// components/Reports.tsx
'use client';
import { useState } from 'react';

interface ReportData {
  id: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [reportData] = useState<ReportData[]>([
    {
      id: '1',
      date: '2024-01-01',
      present: 45,
      absent: 3,
      late: 2,
      attendanceRate: 94
    },
    {
      id: '2',
      date: '2024-01-02',
      present: 44,
      absent: 4,
      late: 2,
      attendanceRate: 92
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Attendance Reports</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">24</div>
            <div className="text-sm text-gray-600">Employees Today</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">92%</div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
        </div>

        {/* Report List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Daily Reports</h3>
          {reportData.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {new Date(report.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.attendanceRate >= 90 ? 'bg-green-100 text-green-800' : 
                  report.attendanceRate >= 80 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {report.attendanceRate}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{report.present}</div>
                  <div className="text-gray-600">Present</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{report.absent}</div>
                  <div className="text-gray-600">Absent</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-yellow-600">{report.late}</div>
                  <div className="text-gray-600">Late</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Export Button */}
        <button className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all">
          Export Report
        </button>
      </div>
    </div>
  );
}