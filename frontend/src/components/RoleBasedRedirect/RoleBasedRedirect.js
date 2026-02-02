import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleBasedRedirect = () => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on user role
  if (user?.role === 'Doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  // Default to admin dashboard for other roles
  return <Navigate to="/admin/dashboard" replace />;
};

export default RoleBasedRedirect;
