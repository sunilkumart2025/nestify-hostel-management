import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const TenantSignup = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', altPhone: '', address: '', 
    password: '', confirmPassword: '', stayKey: '', admissionDate: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await signup(formData, 'tenant');
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/tenant/login');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-3xl font-bold text-gray-900">Nestify</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create Tenant Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join your hostel community</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  className="input-field mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  required
                  className="input-field mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alternative Phone</label>
                <input
                  type="tel"
                  className="input-field mt-1"
                  value={formData.altPhone}
                  onChange={(e) => setFormData({...formData, altPhone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                rows="3"
                className="input-field mt-1"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">StayKey *</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Get from hostel admin"
                  value={formData.stayKey}
                  onChange={(e) => setFormData({...formData, stayKey: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admission Date *</label>
                <input
                  type="date"
                  required
                  className="input-field mt-1"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  required
                  className="input-field mt-1"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/tenant/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSignup;