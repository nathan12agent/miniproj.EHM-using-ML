import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';

function DoctorLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    loginType: 'doctor',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/doctor/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    // Demo doctor credentials
    const doctorCredentials = [
      { username: 'sarah.johnson', password: 'doctor123', name: 'Dr. Sarah Johnson', specialization: 'Cardiology', mlAccess: true },
      { username: 'michael.chen', password: 'doctor123', name: 'Dr. Michael Chen', specialization: 'Neurology', mlAccess: true },
      { username: 'emily.rodriguez', password: 'doctor123', name: 'Dr. Emily Rodriguez', specialization: 'Pediatrics', mlAccess: true },
    ];

    const doctor = doctorCredentials.find(
      d => d.username === formData.username && d.password === formData.password
    );

    if (doctor) {
      setTimeout(() => {
        const mockUserData = {
          user: {
            id: doctor.username,
            name: doctor.name,
            username: doctor.username,
            specialization: doctor.specialization,
            role: 'doctor',
            mlAccess: doctor.mlAccess,
          },
          token: 'doctor-jwt-token-' + Date.now(),
        };
        
        dispatch(loginSuccess(mockUserData));
        navigate('/doctor/dashboard');
      }, 1000);
    } else {
      setTimeout(() => {
        dispatch(loginFailure('Invalid credentials. Please use the demo doctor credentials.'));
      }, 1000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230891b2" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={24}
          sx={{ 
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: '0 20px 40px rgba(8, 145, 178, 0.1)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '3rem',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 15px 35px rgba(8, 145, 178, 0.3)',
              }}
            >
              👨‍⚕️
            </Box>
            
            <Typography 
              component="h1" 
              variant="h3" 
              sx={{ 
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                color: '#0891b2',
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Doctor Portal
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Poppins, sans-serif',
                color: '#6b7280',
                mb: 1,
                fontWeight: 500
              }}
            >
              Medical Professional Access
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '1rem' }}
            >
              Access your medical dashboard and AI prediction tools
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 500,
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Login Type</InputLabel>
              <Select
                name="loginType"
                value={formData.loginType}
                label="Login Type"
                onChange={handleChange}
              >
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                boxShadow: '0 6px 20px rgba(8, 145, 178, 0.3)',
                borderRadius: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
                  boxShadow: '0 8px 25px rgba(8, 145, 178, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: 'rgba(8, 145, 178, 0.5)',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={24} color="inherit" />
                  Authenticating...
                </Box>
              ) : (
                'Access Portal'
              )}
            </Button>
            
            <Box sx={{ mt: 4, textAlign: 'center', p: 2, backgroundColor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
              <Typography variant="body2" sx={{ color: '#0891b2', fontWeight: 500, mb: 1 }}>
                🔐 Demo Doctor Credentials
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: sarah.johnson | Password: doctor123 (ML Access)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: emily.rodriguez | Password: doctor123 (ML Access)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: michael.chen | Password: doctor123 (ML Access)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default DoctorLogin;