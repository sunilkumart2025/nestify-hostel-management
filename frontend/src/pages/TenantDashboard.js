import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TenantLayout from '../components/TenantLayout';
import Dashboard from '../components/tenant/Dashboard';
import Payments from '../components/tenant/Payments';
import Profile from '../components/tenant/Profile';

const TenantDashboard = () => {
  return (
    <TenantLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </TenantLayout>
  );
};

export default TenantDashboard;