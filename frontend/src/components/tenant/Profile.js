import React, { useState, useEffect } from 'react';
import { User, Home, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '', altPhone: '', address: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/tenant/profile');
      setProfile(response.data);
      setFormData({
        phone: response.data.phone || '',
        altPhone: response.data.alt_phone || '',
        address: response.data.address || ''
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/tenant/profile', formData);
      setProfile(response.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary text-sm"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  rows="3"
                  className="input-field mt-1"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary">
                Update Profile
              </button>
            </form>
          ) : (
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
                <label className="block text-sm font-medium text-gray-700">Registration ID</label>
                <p className="mt-1 text-sm text-gray-900">{profile?.registration_id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Hostel Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Home className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Hostel Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hostel Name</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.admins?.hostel_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Number</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.rooms?.room_number || 'Not assigned'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
              <p className="mt-1 text-sm text-gray-900">₹{profile?.rooms?.rent_amount || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admission Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(profile?.admission_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;