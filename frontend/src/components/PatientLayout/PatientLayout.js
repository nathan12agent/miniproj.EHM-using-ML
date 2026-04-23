import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';

function PatientLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          borderBottom: 'none',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HospitalIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'white',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                }}
              >
                Patient Portal
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}
              >
                Appointment Booking System
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
                  <PersonIcon sx={{ fontSize: 18, color: 'white' }} />
                </Avatar>
              }
              label={user?.name || 'Patient'}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 600,
                '& .MuiChip-label': { px: 1 },
              }}
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Page Content */}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}

export default PatientLayout;
