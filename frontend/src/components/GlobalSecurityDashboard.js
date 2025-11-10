import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GlobalSecurityDashboard = () => {
  const [globalStats, setGlobalStats] = useState({
    activeSessions: 0,
    maxSessions: 500,
    availableSlots: 500,
    failedLoginsToday: 0,
    totalAdmins: 0,
    totalTenants: 0
  });
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchGlobalStats();
    fetchActiveSessions();
    fetchSecurityEvents();
    const interval = setInterval(() => {
      fetchGlobalStats();
      fetchActiveSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/global-security/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGlobalStats(response.data);
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/global-security/active-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/global-security/security-events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const usagePercentage = (globalStats.activeSessions / globalStats.maxSessions) * 100;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">🌐 Global Platform Security</h2>
      
      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Active Users</h3>
          <p className={`text-2xl font-bold ${getStatusColor(usagePercentage)}`}>
            {globalStats.activeSessions}/{globalStats.maxSessions}
          </p>
          <p className="text-sm text-gray-600">{usagePercentage.toFixed(1)}% capacity</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Total Hostels</h3>
          <p className="text-2xl font-bold text-green-600">{globalStats.totalAdmins}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Total Tenants</h3>
          <p className="text-2xl font-bold text-purple-600">{globalStats.totalTenants}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800">Failed Logins Today</h3>
          <p className="text-2xl font-bold text-red-600">{globalStats.failedLoginsToday}</p>
        </div>
      </div>

      {/* Global Capacity Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Platform Capacity</span>
          <span className="text-sm text-gray-600">{globalStats.availableSlots} slots available</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-300 ${
              usagePercentage > 80 ? 'bg-red-500' : 
              usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Active Sessions ({sessions.length})</h3>
          <div className="max-h-64 overflow-y-auto">
            {sessions.slice(0, 10).map((session, index) => (
              <div key={index} className="p-2 mb-2 rounded bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    {session.user_type === 'admin' ? '👨‍💼' : '👤'} {session.user_email}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(session.login_time).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  IP: {session.ip_address} | {session.device_type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Events */}
        <div>
          <h3 className="font-semibold mb-3">Recent Security Events</h3>
          <div className="max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event, index) => (
              <div key={index} className={`p-2 mb-2 rounded ${
                event.severity === 'critical' ? 'bg-red-50' :
                event.severity === 'high' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    event.severity === 'critical' ? 'text-red-800' :
                    event.severity === 'high' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {event.severity === 'critical' ? '🚨' : 
                     event.severity === 'high' ? '⚠️' : 'ℹ️'} {event.event_type}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {event.user_email && (
                  <div className="text-sm text-gray-600">
                    User: {event.user_email} | IP: {event.ip_address}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSecurityDashboard;