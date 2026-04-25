import React, { useState, useEffect } from 'react';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  CircularProgress, Tabs, Tab, Grid, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';
import { nurseAuthAPI } from '../../services/api';

const WARDS = ['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'];
const SHIFTS = ['Morning', 'Evening', 'Night'];

function NurseLogin() {
  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    ward: 'General', shift: 'Morning', specialization: '', experience: 0,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Nurse') {
      navigate('/nurse/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const res = await nurseAuthAPI.login(loginData);
      dispatch(loginSuccess(res.data));
      navigate('/nurse/dashboard');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Invalid credentials'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const res = await nurseAuthAPI.register(registerData);
      dispatch(loginSuccess(res.data));
      navigate('/nurse/dashboard');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Registration failed'));
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      position: 'relative',
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23059669\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }
    }}>
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper elevation={24} sx={{
          p: { xs: 4, sm: 6 }, borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(5, 150, 105, 0.1)', boxShadow: '0 20px 40px rgba(5, 150, 105, 0.1)',
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 100, height: 100, borderRadius: 3,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '3rem', mx: 'auto', mb: 3,
              boxShadow: '0 15px 35px rgba(5, 150, 105, 0.3)',
            }}>
              👩‍⚕️
            </Box>
            <Typography component="h1" variant="h3" sx={{
              fontFamily: 'Poppins, sans-serif', fontWeight: 700,
              color: '#059669', mb: 1, textTransform: 'uppercase', letterSpacing: '1px'
            }}>
              Nurse Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
              Access your nursing dashboard, manage shifts & patient care
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} centered
            sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600 },
              '& .Mui-selected': { color: '#059669 !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#059669' }
            }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {tabValue === 0 && (
            <Box component="form" onSubmit={handleLogin}>
              <TextField margin="normal" required fullWidth label="Email" type="email"
                value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                disabled={loading} sx={{ mb: 2 }} />
              <TextField margin="normal" required fullWidth label="Password" type="password"
                value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                disabled={loading} sx={{ mb: 3 }} />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                sx={{
                  py: 2, fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.3)', borderRadius: 3,
                  '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
                }}>
                {loading ? <><CircularProgress size={24} color="inherit" sx={{ mr: 1 }} /> Signing In...</> : 'Sign In'}
              </Button>
              <Box sx={{ mt: 4, p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500, mb: 1 }}>
                  🔐 Nurse Credentials (password: nurse123)
                </Typography>
                <Typography variant="body2" color="text.secondary">Meena Krishnan: meena.k@hospital.com</Typography>
                <Typography variant="body2" color="text.secondary">Anjali Desai: anjali.d@hospital.com</Typography>
                <Typography variant="body2" color="text.secondary">Rekha Iyer: rekha.i@hospital.com</Typography>
                <Typography variant="body2" color="text.secondary">Pooja Mehta: pooja.m@hospital.com</Typography>
                <Typography variant="body2" color="text.secondary">Kavitha Rao: kavitha.r@hospital.com</Typography>
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box component="form" onSubmit={handleRegister}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField required fullWidth label="First Name" value={registerData.firstName}
                    onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField required fullWidth label="Last Name" value={registerData.lastName}
                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField required fullWidth label="Email" type="email" value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField required fullWidth label="Password" type="password" value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    helperText="Minimum 6 characters" />
                </Grid>
                <Grid item xs={12}>
                  <TextField required fullWidth label="Phone" value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Ward</InputLabel>
                    <Select value={registerData.ward} label="Ward"
                      onChange={(e) => setRegisterData({ ...registerData, ward: e.target.value })}>
                      {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Shift</InputLabel>
                    <Select value={registerData.shift} label="Shift"
                      onChange={(e) => setRegisterData({ ...registerData, shift: e.target.value })}>
                      {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                sx={{
                  mt: 3, py: 2, fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.3)', borderRadius: 3,
                  '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
                }}>
                {loading ? <><CircularProgress size={24} color="inherit" sx={{ mr: 1 }} /> Registering...</> : 'Register & Login'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default NurseLogin;
