import React, { useState, useEffect } from 'react';
import { CreditCard, Home, Clock, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/tenant/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  const { tenant, pendingBillsCount, recentPayments } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {tenant?.name}!</h2>
        <p className="text-blue-100">
          {tenant?.admins?.hostel_name} • Room {tenant?.rooms?.room_number}
        </p>
        <p className="text-sm text-blue-200 mt-1">
          Registration ID: {tenant?.registration_id}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBillsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Room Rent</p>
              <p className="text-2xl font-bold text-gray-900">₹{tenant?.rooms?.rent_amount || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Payments Made</p>
              <p className="text-2xl font-bold text-gray-900">{recentPayments?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
        <div className="space-y-4">
          {recentPayments?.length > 0 ? (
            recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{payment.bills?.bill_number}</p>
                  <p className="text-sm text-gray-500">
                    {payment.bills?.billing_month}/{payment.bills?.billing_year}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{payment.amount}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(payment.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent payments</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/tenant/dashboard/payments"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-blue-700 font-medium">View & Pay Bills</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hostel Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hostel:</span>
              <span className="text-sm font-medium">{tenant?.admins?.hostel_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Room:</span>
              <span className="text-sm font-medium">{tenant?.rooms?.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Admission Date:</span>
              <span className="text-sm font-medium">
                {new Date(tenant?.admission_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;