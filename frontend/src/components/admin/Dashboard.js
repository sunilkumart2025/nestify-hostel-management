import React, { useState, useEffect } from 'react';
import { Users, Building2, CreditCard, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LoadingSpinner, SkeletonCard } from '../ui/LoadingSpinner';
import useResponsive from '../../hooks/useResponsive';
import api from '../../utils/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="stat-card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 dark:bg-${color}-900 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center text-sm ${
              change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {change > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className={`grid gap-4 sm:gap-6 ${
        isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'
      }`}>
        <StatCard
          icon={Users}
          title="Total Tenants"
          value={dashboardData?.totalTenants || 0}
          color="blue"
        />
        <StatCard
          icon={Building2}
          title="Occupied Rooms"
          value={dashboardData?.occupiedRooms || 0}
          color="green"
        />
        <StatCard
          icon={Building2}
          title="Available Rooms"
          value={dashboardData?.availableRooms || 0}
          color="yellow"
        />
        <StatCard
          icon={CreditCard}
          title="Monthly Collection"
          value={`₹${dashboardData?.monthlyCollection?.current || 0}`}
          change={dashboardData?.monthlyCollection?.change}
          color="purple"
        />
      </div>

      {/* Recent Activity Section */}
      <div className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
      }`}>
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-3">
            {dashboardData?.recentTransactions?.length > 0 ? (
              dashboardData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{transaction.tenants?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.bills?.bill_number}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium text-gray-900 dark:text-white">₹{transaction.amount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Payments</h3>
            <div className="flex items-center">
              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-2 py-1 rounded-full">
                {dashboardData?.pendingPayments?.length || 0}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {dashboardData?.pendingPayments?.length > 0 ? (
              dashboardData.pendingPayments.slice(0, 5).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{bill.tenants?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Room {bill.rooms?.room_number}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium text-red-600 dark:text-red-400">₹{bill.total_amount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{bill.billing_month}/{bill.billing_year}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No pending payments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;