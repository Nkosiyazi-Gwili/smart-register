// components/StatsOverview.tsx
'use client';
import { useState, useEffect } from 'react';

export default function StatsOverview() {
  const [stats, setStats] = useState({
    hoursWorked: 0,
    daysPresent: 0,
    leaveBalance: 18,
    punctuality: 95
  });

  useEffect(() => {
    setTimeout(() => {
      setStats({
        hoursWorked: 36.5,
        daysPresent: 4,
        leaveBalance: 18,
        punctuality: 95
      });
    }, 500);
  }, []);

  const statCards = [
    {
      title: 'Hours This Week',
      value: stats.hoursWorked,
      suffix: 'hrs',
      color: 'blue',
      icon: '⏱️'
    },
    {
      title: 'Days Present',
      value: stats.daysPresent,
      suffix: '/5',
      color: 'green',
      icon: '📅'
    },
    {
      title: 'Leave Balance',
      value: stats.leaveBalance,
      suffix: 'days',
      color: 'orange',
      icon: '🏖️'
    },
    {
      title: 'Punctuality',
      value: stats.punctuality,
      suffix: '%',
      color: 'purple',
      icon: '🎯'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Good morning! 👋</h2>
            <p className="text-blue-100">You're doing great this week. Keep it up!</p>
          </div>
          <div className="text-4xl">🎉</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
              <span className="text-sm text-gray-600 ml-1">{stat.suffix}</span>
            </div>
            <div className="text-sm text-gray-600">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-4 bg-blue-50 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition-colors active:scale-95">
            Apply Leave
          </button>
          <button className="p-4 bg-green-50 rounded-lg text-green-700 font-medium hover:bg-green-100 transition-colors active:scale-95">
            View Schedule
          </button>
          <button className="p-4 bg-purple-50 rounded-lg text-purple-700 font-medium hover:bg-purple-100 transition-colors active:scale-95">
            Timesheet
          </button>
          <button className="p-4 bg-orange-50 rounded-lg text-orange-700 font-medium hover:bg-orange-100 transition-colors active:scale-95">
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}