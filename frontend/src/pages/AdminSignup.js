import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import DemoNotice from '../components/DemoNotice';

const AdminSignup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    hostelName: '',
    hostelAddress: '',
    password: '',
    confirmPassword: '',
    nestKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { signup, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(formData, 'admin');
      
      if (result.success) {
        toast.success('Account created! Please verify your email.');
        setStep(2);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await verifyOTP(formData.email, otp, 'signup');
      
      if (result.success) {
        toast.success('Email verified successfully!');
        navigate('/admin/login');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification code to {formData.email}
            </p>
          </div>

          <DemoNotice message="Enter any 6-digit code (e.g., 123456) to continue in demo mode" />

          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            <form onSubmit={handleOTPVerification} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength="6"
                  className="input-field mt-1 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-3xl font-bold text-gray-900">Nestify</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create Admin Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your hostel management account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field mt-1"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="input-field mt-1"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="altPhone" className="block text-sm font-medium text-gray-700">
                  Alternative Phone
                </label>
                <input
                  id="altPhone"
                  name="altPhone"
                  type="tel"
                  className="input-field mt-1"
                  value={formData.altPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows="3"
                className="input-field mt-1"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="hostelName" className="block text-sm font-medium text-gray-700">
                  Hostel Name *
                </label>
                <input
                  id="hostelName"
                  name="hostelName"
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.hostelName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="nestKey" className="block text-sm font-medium text-gray-700">
                  NestKey *
                </label>
                <input
                  id="nestKey"
                  name="nestKey"
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Contact admin for NestKey"
                  value={formData.nestKey}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="hostelAddress" className="block text-sm font-medium text-gray-700">
                Hostel Address *
              </label>
              <textarea
                id="hostelAddress"
                name="hostelAddress"
                rows="3"
                required
                className="input-field mt-1"
                value={formData.hostelAddress}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;