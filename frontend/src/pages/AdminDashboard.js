import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import Rooms from '../components/admin/Rooms';
import Tenants from '../components/admin/Tenants';
import Billing from '../components/admin/Billing';
import Analytics from '../components/admin/Analytics';
import Profile from '../components/admin/Profile';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;