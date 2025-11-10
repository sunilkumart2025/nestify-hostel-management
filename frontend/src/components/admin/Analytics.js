import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, Home } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/admin/analytics', { params: dateRange });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get('/admin/reports/payment', {
        params: dateRange,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Payment report downloaded');
    } catch (error) {
      toast.error('Failed to download payment report');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="input-field"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className="input-field"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics?.totalRevenue?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.activeTenants || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.occupancyRate || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.collectionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
        <div className="h-64 flex items-end space-x-2">
          {analytics?.monthlyRevenue?.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="bg-blue-500 w-full rounded-t"
                style={{ height: `${(month.amount / Math.max(...analytics.monthlyRevenue.map(m => m.amount))) * 200}px` }}
              ></div>
              <p className="text-xs mt-2 text-gray-600">{month.month}</p>
              <p className="text-xs text-gray-800">₹{month.amount.toLocaleString()}</p>
            </div>
          )) || []}
        </div>
      </div>

      {/* Payment Report Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Payment Report</h3>
          <button
            onClick={() => downloadReport('payment')}
            className="btn-primary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Payment Report
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Generate detailed payment report for the selected date range above.
        </p>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.recentTransactions?.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.tenants?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(transaction.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.payment_method}
                  </td>
                </tr>
              )) || []}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;