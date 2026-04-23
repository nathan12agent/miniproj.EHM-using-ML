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
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';

function PatientLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'patient') {
      navigate('/patient/portal');
    }
  }, [isAuthenticated, user, navigate]);

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

    // Demo patient credentials
    const patientCredentials = [
      { email: 'patient1@hospital.com', password: 'patient123', name: 'John Smith', phone: '555-0101' },
      { email: 'patient2@hospital.com', password: 'patient123', name: 'Jane Doe', phone: '555-0102' },
      { email: 'patient3@hospital.com', password: 'patient123', name: 'Robert Wilson', phone: '555-0103' },
    ];

    const patient = patientCredentials.find(
      p => p.email === formData.email && p.password === formData.password
    );

    if (patient) {
      setTimeout(() => {
        const mockUserData = {
          user: {
            id: patient.email,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            role: 'patient',
          },
          token: 'patient-jwt-token-' + Date.now(),
        };
        
        dispatch(loginSuccess(mockUserData));
        navigate('/patient/portal');
      }, 1000);
    } else {
      setTimeout(() => {
        dispatch(loginFailure('Invalid credentials. Please use the demo patient credentials below.'));
      }, 1000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f0fdf4 70%, #ecfdf5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 30% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
          animation: 'float 20s ease-in-out infinite',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(1deg)' },
        },
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={24}
          sx={{ 
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            boxShadow: '0 25px 50px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.05)',
            animation: 'fadeInUp 0.6s ease-out',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '3rem',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 15px 35px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05) rotate(2deg)',
                },
              }}
            >
              🏥
            </Box>
            
            <Typography 
              component="h1" 
              variant="h3" 
              sx={{ 
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                letterSpacing: '0.5px'
              }}
            >
              Patient Portal
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
              Book Your Appointment
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '1rem' }}
            >
              Access your healthcare portal to find doctors and schedule appointments
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
            <TextField
              margin="normal"
              required
              fullWidth
              id="patient-email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#059669',
                  },
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
              id="patient-password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#059669',
                  },
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
                letterSpacing: '0.5px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'rgba(16, 185, 129, 0.5)',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={24} color="inherit" />
                  Signing In...
                </Box>
              ) : (
                'Sign In to Portal'
              )}
            </Button>
            
            <Box sx={{ 
              mt: 4, 
              textAlign: 'center', 
              p: 2.5, 
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              borderRadius: 3, 
              border: '1px solid #a7f3d0' 
            }}>
              <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>
                🔐 Demo Patient Credentials
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>patient1@hospital.com</strong> / patient123 — John Smith
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>patient2@hospital.com</strong> / patient123 — Jane Doe
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>patient3@hospital.com</strong> / patient123 — Robert Wilson
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="text" 
                onClick={() => navigate('/')}
                sx={{ 
                  color: '#6b7280',
                  '&:hover': { color: '#059669' }
                }}
              >
                ← Back to Home
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default PatientLogin;
