import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Psychology as MLIcon,
  AccountCircle as LoginIcon,
  Security as SecurityIcon,
  LocalHospital as DoctorIcon,
  Assessment as PredictionIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { doctorsAPI, authAPI } from '../../services/api';

// ── Defined at module level so React never remounts them on re-render ──────────
const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'Dermatology', 'Psychiatry', 'Radiology', 'Anesthesiology',
  'Emergency Medicine', 'Surgery', 'Oncology', 'Endocrinology',
  'Gastroenterology', 'Pulmonology', 'Nephrology', 'Ophthalmology', 'ENT', 'Urology',
];

function DoctorFormFields({ doctor, setDoctor }) {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="First Name" value={doctor.firstName}
          onChange={(e) => setDoctor({ ...doctor, firstName: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Last Name" value={doctor.lastName}
          onChange={(e) => setDoctor({ ...doctor, lastName: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Email" type="email" value={doctor.email}
          onChange={(e) => setDoctor({ ...doctor, email: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Phone" value={doctor.phone}
          onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Specialization</InputLabel>
          <Select value={doctor.specialization} label="Specialization"
            onChange={(e) => setDoctor({ ...doctor, specialization: e.target.value })}>
            {SPECIALIZATIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Experience (years)" type="number" value={doctor.experience}
          onChange={(e) => setDoctor({ ...doctor, experience: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="License Number" value={doctor.licenseNumber}
          onChange={(e) => setDoctor({ ...doctor, licenseNumber: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select value={doctor.status} label="Status"
            onChange={(e) => setDoctor({ ...doctor, status: e.target.value })}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="On Leave">On Leave</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [createLoginOpen, setCreateLoginOpen] = useState(false);
  const [editDoctorOpen, setEditDoctorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const emptyDoctor = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    licenseNumber: '',
    department: '',
    status: 'Active',
  };

  const [newDoctor, setNewDoctor] = useState(emptyDoctor);
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: '',
    role: 'doctor',
    mlAccess: true,
  });

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      const res = await doctorsAPI.getAll(params);
      // Backend returns { doctors, pagination }
      setDoctors(res.data.doctors || res.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Failed to load doctors. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleAddDoctor = async () => {
    setActionLoading(true);
    try {
      await doctorsAPI.create({ ...newDoctor, createdBy: undefined });
      setNewDoctor(emptyDoctor);
      setAddDoctorOpen(false);
      fetchDoctors();
    } catch (err) {
      console.error('Failed to add doctor:', err);
      setError(err.response?.data?.message || 'Failed to add doctor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDoctor = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await doctorsAPI.update(selectedDoctor._id || selectedDoctor.id, newDoctor);
      setEditDoctorOpen(false);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (err) {
      console.error('Failed to update doctor:', err);
      setError(err.response?.data?.message || 'Failed to update doctor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await doctorsAPI.delete(selectedDoctor._id || selectedDoctor.id);
      setDeleteConfirmOpen(false);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (err) {
      console.error('Failed to delete doctor:', err);
      setError(err.response?.data?.message || 'Failed to deactivate doctor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateLogin = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      // Create a user account linked to this doctor
      await authAPI.register({
        name: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        email: selectedDoctor.email,
        username: loginCredentials.username,
        password: loginCredentials.password,
        role: loginCredentials.role,
      });
      // Grant ML access if toggled
      if (loginCredentials.mlAccess) {
        await doctorsAPI.update(selectedDoctor._id || selectedDoctor.id, { mlAccess: true });
      }
      setCreateLoginOpen(false);
      setLoginCredentials({ username: '', password: '', role: 'doctor', mlAccess: true });
      fetchDoctors();
    } catch (err) {
      console.error('Failed to create login:', err);
      setError(err.response?.data?.message || 'Failed to create login.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMLAccess = async (doctor) => {
    try {
      await doctorsAPI.update(doctor._id || doctor.id, { mlAccess: !doctor.mlAccess });
      fetchDoctors();
    } catch (err) {
      console.error('Failed to toggle ML access:', err);
      setError('Failed to toggle ML access.');
    }
  };

  const openEditDialog = (doctor) => {
    setSelectedDoctor(doctor);
    setNewDoctor({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      experience: doctor.experience,
      licenseNumber: doctor.medicalLicenseNumber || doctor.licenseNumber || '',
      department: doctor.department,
      status: doctor.status,
    });
    setEditDoctorOpen(true);
  };

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'On Leave': return 'warning';
      case 'Inactive':
      case 'Suspended': return 'error';
      default: return 'default';
    }
  };



  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626', mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Doctor Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage medical staff, create logins, and configure ML access
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDoctors}
              sx={{ borderRadius: 2 }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDoctorOpen(true)}
              sx={{
                px: 3, py: 1.5, borderRadius: 2, fontWeight: 600,
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              }}>
              Add New Doctor
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            { label: 'Total Doctors', value: doctors.length, color: '#dc2626', icon: <DoctorIcon /> },
            { label: 'Active Doctors', value: doctors.filter(d => d.status === 'Active').length, color: '#059669', icon: <LoginIcon /> },
            { label: 'ML Access Enabled', value: doctors.filter(d => d.mlAccess).length, color: '#0891b2', icon: <MLIcon /> },
            { label: 'On Leave', value: doctors.filter(d => d.status === 'On Leave').length, color: '#f59e0b', icon: <PredictionIcon /> },
          ].map(({ label, value, color, icon }) => (
            <Grid item xs={12} sm={6} md={3} key={label}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  {icon}
                </Box>
                {loading ? <CircularProgress size={24} /> : (
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{value}</Typography>
                )}
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search doctors by name, specialization, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ px: 3 }}>
            <Tab label="All Doctors" />
            <Tab label="Login Management" />
            <Tab label="ML Access Control" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* ---------- All Doctors Tab ---------- */}
              {tabValue === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Experience</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>ML Access</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDoctors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No doctors found.
                          </TableCell>
                        </TableRow>
                      ) : filteredDoctors.map((doctor) => (
                        <TableRow key={doctor._id || doctor.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ backgroundColor: '#dc2626', width: 40, height: 40 }}>
                                {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{doctor.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{doctor.phone}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              License: {doctor.medicalLicenseNumber || doctor.licenseNumber || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{doctor.experience} yrs</TableCell>
                          <TableCell>
                            <Chip label={doctor.status} color={getStatusColor(doctor.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doctor.mlAccess ? 'Enabled' : 'Disabled'}
                              color={doctor.mlAccess ? 'info' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {!doctor.userId && (
                                <IconButton size="small" color="success" title="Create Login"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setLoginCredentials({ ...loginCredentials, username: `${doctor.firstName?.toLowerCase()}.${doctor.lastName?.toLowerCase()}` });
                                    setCreateLoginOpen(true);
                                  }}>
                                  <LoginIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton size="small" color="info" title="Toggle ML Access"
                                onClick={() => handleToggleMLAccess(doctor)}>
                                <MLIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="primary" title="Edit"
                                onClick={() => openEditDialog(doctor)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" title="Deactivate"
                                onClick={() => { setSelectedDoctor(doctor); setDeleteConfirmOpen(true); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* ---------- Login Management Tab ---------- */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Doctor Login Management</Typography>
                  <Grid container spacing={3}>
                    {filteredDoctors.map((doctor) => (
                      <Grid item xs={12} md={6} key={doctor._id || doctor.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar sx={{ backgroundColor: '#dc2626' }}>
                                {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="h6">Dr. {doctor.firstName} {doctor.lastName}</Typography>
                                <Typography variant="body2" color="text.secondary">{doctor.specialization}</Typography>
                              </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2">Account Status:</Typography>
                              <Chip
                                label={doctor.userId ? 'Login Created' : 'No Login'}
                                color={doctor.userId ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {!doctor.userId ? (
                                <Button variant="contained" size="small" startIcon={<LoginIcon />}
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setLoginCredentials({ ...loginCredentials, username: `${doctor.firstName?.toLowerCase()}.${doctor.lastName?.toLowerCase()}` });
                                    setCreateLoginOpen(true);
                                  }}>
                                  Create Login
                                </Button>
                              ) : (
                                <Button variant="outlined" size="small" startIcon={<SecurityIcon />}>
                                  Reset Password
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* ---------- ML Access Control Tab ---------- */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Machine Learning Access Control</Typography>
                  <Grid container spacing={3}>
                    {filteredDoctors.map((doctor) => (
                      <Grid item xs={12} md={6} key={doctor._id || doctor.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar sx={{ backgroundColor: '#0891b2' }}><MLIcon /></Avatar>
                              <Box>
                                <Typography variant="h6">Dr. {doctor.firstName} {doctor.lastName}</Typography>
                                <Typography variant="body2" color="text.secondary">{doctor.specialization}</Typography>
                              </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!!doctor.mlAccess}
                                  onChange={() => handleToggleMLAccess(doctor)}
                                  color="primary"
                                />
                              }
                              label="ML Prediction Access"
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {doctor.mlAccess
                                ? 'Doctor can access AI-powered disease prediction tools'
                                : 'Doctor cannot access ML prediction features'}
                            </Typography>
                            {doctor.mlAccess && (
                              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f9ff', borderRadius: 1 }}>
                                <Typography variant="caption" color="primary">✓ Disease Prediction Access</Typography><br />
                                <Typography variant="caption" color="primary">✓ Symptom Analysis Tools</Typography><br />
                                <Typography variant="caption" color="primary">✓ Risk Assessment Features</Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </>
          )}
        </Box>
      </Card>

      {/* ===== Add Doctor Dialog ===== */}
      <Dialog open={addDoctorOpen} onClose={() => setAddDoctorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Doctor</DialogTitle>
        <DialogContent>
          <DoctorFormFields doctor={newDoctor} setDoctor={setNewDoctor} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDoctorOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDoctor} variant="contained" disabled={actionLoading || !newDoctor.firstName || !newDoctor.lastName || !newDoctor.email}>
            {actionLoading ? <CircularProgress size={18} /> : 'Add Doctor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Edit Doctor Dialog ===== */}
      <Dialog open={editDoctorOpen} onClose={() => setEditDoctorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Doctor — Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</DialogTitle>
        <DialogContent>
          <DoctorFormFields doctor={newDoctor} setDoctor={setNewDoctor} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDoctorOpen(false)}>Cancel</Button>
          <Button onClick={handleEditDoctor} variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Create Login Dialog ===== */}
      <Dialog open={createLoginOpen} onClose={() => setCreateLoginOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Login for Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField fullWidth label="Username" value={loginCredentials.username}
              onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" type="password" value={loginCredentials.password}
              onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
              sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select value={loginCredentials.role} label="Role"
                onChange={(e) => setLoginCredentials({ ...loginCredentials, role: e.target.value })}>
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="senior_doctor">Senior Doctor</MenuItem>
                <MenuItem value="department_head">Department Head</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch checked={loginCredentials.mlAccess}
                  onChange={(e) => setLoginCredentials({ ...loginCredentials, mlAccess: e.target.checked })} />
              }
              label="Grant ML Access"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateLoginOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateLogin} variant="contained" disabled={actionLoading || !loginCredentials.username || !loginCredentials.password}>
            {actionLoading ? <CircularProgress size={18} /> : 'Create Login'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete Confirm Dialog ===== */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Deactivate Doctor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}?
            Their account will be set to Inactive.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDoctor} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Doctors;