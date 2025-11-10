import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', userType: 'tenant', otp: '', newPassword: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { forgotPassword, resetPassword } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(formData.email, formData.userType);
    
    if (result.success) {
      toast.success('OTP sent to your email!');
      setStep(2);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await resetPassword(formData.email, formData.otp, formData.newPassword, formData.userType);
    
    if (result.success) {
      toast.success('Password reset successfully!');
      setStep(3);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-3xl font-bold text-gray-900">Nestify</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Reset Password' : 'Success'}
          </h2>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                <select
                  className="input-field mt-1"
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                >
                  <option value="tenant">Tenant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="input-field mt-1 text-center"
                  value={formData.otp}
                  onChange={(e) => setFormData({...formData, otp: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  required
                  className="input-field mt-1"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="input-field mt-1"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <p className="text-green-600">Password reset successfully!</p>
              <Link to={`/${formData.userType}/login`} className="btn-primary inline-block">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;