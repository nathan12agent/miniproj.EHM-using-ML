import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleDoctorLoginClick = () => {
    navigate('/doctor/login');
  };

  const features = [
    {
      icon: <HospitalIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Complete Healthcare Management',
      description: 'Manage patients, doctors, appointments, and medical records in one integrated system.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Secure & Compliant',
      description: 'HIPAA compliant with advanced security features to protect sensitive medical data.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Fast & Efficient',
      description: 'Streamlined workflows and intuitive interface for maximum productivity.',
    },
    {
      icon: <SupportIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: '24/7 Support',
      description: 'Round-the-clock technical support and maintenance for uninterrupted service.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              ⚕
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: '#1f2937',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Hospital Logo
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              sx={{ 
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#06b6d4',
                  color: '#06b6d4'
                }
              }}
            >
              ABOUT
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#06b6d4',
                  color: '#06b6d4'
                }
              }}
            >
              SERVICES
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#06b6d4',
                  color: '#06b6d4'
                }
              }}
            >
              BLOG
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#06b6d4',
                  color: '#06b6d4'
                }
              }}
            >
              CONTACT
            </Button>
            <Button
              variant="outlined"
              onClick={handleDoctorLoginClick}
              sx={{
                borderColor: '#06b6d4',
                color: '#06b6d4',
                fontWeight: 600,
                px: 3,
                mr: 2,
                '&:hover': {
                  borderColor: '#0891b2',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                }
              }}
            >
              DOCTOR LOGIN
            </Button>
            <Button
              variant="contained"
              onClick={handleLoginClick}
              sx={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                }
              }}
            >
              ADMIN LOGIN
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ color: 'white' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Your health,
                  <br />
                  our priority
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                    maxWidth: '500px',
                  }}
                >
                  Advanced hospital management system designed to streamline healthcare operations, 
                  improve patient care, and enhance administrative efficiency.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleLoginClick}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      backgroundColor: 'white',
                      color: '#0891b2',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    READ MORE
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    LEARN MORE
                  </Button>
                </Box>
                
                {/* Bottom Stats */}
                <Box sx={{ mt: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      1000+
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Patients Served
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      50+
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Medical Staff
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      24/7
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Emergency Care
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                {/* Doctor and Patient Illustration Placeholder */}
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 400,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Box sx={{ textAlign: 'center', color: 'white' }}>
                    <HospitalIcon sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
                    <Typography variant="h6" sx={{ opacity: 0.7 }}>
                      Professional Healthcare
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.5, mt: 1 }}>
                      Doctor & Patient Care Illustration
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              color: '#1f2937',
              mb: 2,
            }}
          >
            Why Choose Our System?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#6b7280',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Comprehensive healthcare management solution designed for modern hospitals and clinics
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 2,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          py: 8,
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                mb: 2,
              }}
            >
              Ready to Get Started?
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                opacity: 0.8,
                mb: 4,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Access the admin dashboard to manage your hospital operations efficiently
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleLoginClick}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Access Admin Dashboard
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Welcome;