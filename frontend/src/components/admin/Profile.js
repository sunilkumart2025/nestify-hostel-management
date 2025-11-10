import React, { useState, useEffect } from 'react';
import { User, Key, CreditCard, Mail } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ razorpayKeyId: '', razorpayKeySecret: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/admin/profile');
      setProfile(response.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const regenerateStayKey = async () => {
    try {
      const response = await api.post('/api/admin/regenerate-stay-key');
      setProfile({...profile, stay_key: response.data.stayKey});
      toast.success('StayKey regenerated successfully');
    } catch (error) {
      toast.error('Failed to regenerate StayKey');
    }
  };

  const sendOTP = async () => {
    try {
      await api.post('/api/admin/send-profile-otp');
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error('Failed to send OTP');
    }
  };

  const updatePaymentSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/admin/payment-settings', paymentData);
      toast.success('Payment settings updated successfully');
      setShowPaymentModal(false);
      setPaymentData({ razorpayKeyId: '', razorpayKeySecret: '', otp: '' });
      setOtpSent(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update payment settings');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hostel Name</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.hostel_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hostel Address</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.hostel_address}</p>
            </div>
          </div>
        </div>

        {/* StayKey Management */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">StayKey Management</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current StayKey</label>
              <div className="mt-1 flex items-center space-x-2">
                <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1">
                  {profile?.stay_key}
                </code>
                <button
                  onClick={regenerateStayKey}
                  className="btn-secondary text-sm"
                >
                  Regenerate
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Share this key with tenants for registration. Regenerating will expire the old key.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Payment Settings</h3>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary text-sm"
            >
              Update Settings
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Razorpay Key ID</label>
              <p className="mt-1 text-sm text-gray-900">
                {profile?.razorpay_key_id ? '••••••••••••' + profile.razorpay_key_id.slice(-4) : 'Not configured'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`badge ${profile?.razorpay_key_id ? 'badge-success' : 'badge-warning'}`}>
                {profile?.razorpay_key_id ? 'Configured' : 'Not configured'}
              </span>
            </div>
          </div>
          {!profile?.razorpay_key_id && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Configure your Razorpay credentials to enable payment collection from tenants.
                Get your credentials from <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Razorpay Dashboard</a>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Settings Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">Update Payment Settings</h3>
            <form onSubmit={updatePaymentSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Razorpay Key ID</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="rzp_test_xxxxxxxxxx"
                  value={paymentData.razorpayKeyId}
                  onChange={(e) => setPaymentData({...paymentData, razorpayKeyId: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Razorpay Key Secret</label>
                <input
                  type="password"
                  required
                  className="input-field mt-1"
                  placeholder="Your secret key"
                  value={paymentData.razorpayKeySecret}
                  onChange={(e) => setPaymentData({...paymentData, razorpayKeySecret: e.target.value})}
                />
              </div>
              
              {!otpSent ? (
                <button
                  type="button"
                  onClick={sendOTP}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send OTP to Email
                </button>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    className="input-field mt-1"
                    placeholder="000000"
                    value={paymentData.otp}
                    onChange={(e) => setPaymentData({...paymentData, otp: e.target.value})}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentData({ razorpayKeyId: '', razorpayKeySecret: '', otp: '' });
                    setOtpSent(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!otpSent || paymentData.otp.length !== 6}
                >
                  Update Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;