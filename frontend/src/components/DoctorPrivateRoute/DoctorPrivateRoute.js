import React from 'react';
import { Navigate } from 'react-router-dom';

// Doctor-specific route guard — checks doctorToken in localStorage
function DoctorPrivateRoute({ children }) {
  const doctorToken = localStorage.getItem('doctorToken');
  const doctorUser = localStorage.getItem('doctorUser');

  if (!doctorToken || !doctorUser) {
    return <Navigate to="/doctor/login" replace />;
  }

  return children;
}

export default DoctorPrivateRoute;
