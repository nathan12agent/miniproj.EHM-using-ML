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
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Psychology as MLIcon,
  LocalHospital as DoctorIcon,
  Assessment as PredictionIcon,
  CheckCircle as ActiveIcon,
  Chat as ChatIcon,
  Login as LoginIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { doctorsAPI, authAPI } from '../../services/api';
import api from '../../services/api';

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'Dermatology', 'Psychiatry', 'Radiology', 'Anesthesiology',
  'Emergency Medicine', 'Surgery', 'Oncology', 'Endocrinology',
  'Gastroenterology', 'Pulmonology', 'Nephrology', 'Ophthalmology', 'ENT', 'Urology',
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialization: '',
  experience: '',
  medicalLicenseNumber: '',
};

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Login creation state
  const [createLoginOpen, setCreateLoginOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loginCredentials, setLoginCredentials] = useState({
    username: '', password: '', role: 'doctor', mlAccess: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorsAPI.getAll(searchTerm ? { search: searchTerm } : {});
      setDoctors(res.data?.doctors || res.data?.data || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleToggleAccess = async (doctorId, field, newValue) => {
    try {
      await api.patch(`/doctors/${doctorId}/access`, { [field]: newValue });
      setDoctors(prev => prev.map(d => d._id === doctorId ? { ...d, [field]: newValue } : d));
      showSnackbar(`${field === 'mlAccess' ? 'ML' : 'Chat'} access ${newValue ? 'enabled' : 'disabled'}`, newValue ? 'success' : 'info');
    } catch (err) {
      showSnackbar('Failed to update access: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditDoctor(null);
    setAddOpen(true);
  };

  const openEdit = (doctor) => {
    setEditDoctor(doctor);
    setForm({
      firstName: doctor.firstName || '',
      lastName: doctor.lastName || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      experience: doctor.experience ?? '',
      medicalLicenseNumber: doctor.medicalLicenseNumber || doctor.licenseNumber || '',
    });
    setAddOpen(true);
  };

  const closeDialog = () => {
    setAddOpen(false);
    setEditDoctor(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (editDoctor) {
        await doctorsAPI.update(editDoctor._id || editDoctor.id, form);
        showSnackbar('Doctor updated successfully');
      } else {
        await doctorsAPI.create(form);
        showSnackbar('Doctor added successfully');
      }
      await fetchDoctors();
      closeDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await doctorsAPI.delete(deleteTarget._id || deleteTarget.id);
      await fetchDoctors();
      setDeleteTarget(null);
      showSnackbar('Doctor deactivated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete doctor.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateLogin = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await authAPI.register({
        name: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        email: selectedDoctor.email,
        username: loginCredentials.username,
        password: loginCredentials.password,
        role: loginCredentials.role,
      });
      if (loginCredentials.mlAccess) {
        await doctorsAPI.update(selectedDoctor._id || selectedDoctor.id, { mlAccess: true });
      }
      setCreateLoginOpen(false);
      setLoginCredentials({ username: '', password: '', role: 'doctor', mlAccess: true });
      fetchDoctors();
      showSnackbar('Login created successfully');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to create login.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(term) ||
      (d.specialization || '').toLowerCase().includes(term) ||
      (d.email || '').toLowerCase().includes(term)
    );
  });

  const stats = {
    total: doctors.length,
    active: doctors.filter((d) => d.status === 'Active').length,
    mlAccess: doctors.filter((d) => d.mlAccess === true).length,
    chatAccess: doctors.filter((d) => d.chatAccess === true).length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'On Leave': return 'warning';
      default: return 'default';
    }
  };

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.specialization;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626', mb: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Doctor Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage medical staff, create logins, and configure ML &amp; Chat access
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDoctors} sx={{ borderRadius: 2 }}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{
              px: 3, py: 1.5, borderRadius: 2, fontWeight: 600,
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}
          >
            Add New Doctor
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total Doctors', value: stats.total, color: '#dc2626', icon: <DoctorIcon /> },
          { label: 'Active Doctors', value: stats.active, color: '#059669', icon: <ActiveIcon /> },
          { label: 'ML Access Enabled', value: stats.mlAccess, color: '#0891b2', icon: <MLIcon /> },
          { label: 'Chat Access Enabled', value: stats.chatAccess, color: '#7c3aed', icon: <ChatIcon /> },
        ].map(({ label, value, color, icon }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                {icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {loading ? <CircularProgress size={24} /> : value}
              </Typography>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <TextField
        placeholder="Search by name, specialization, or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ px: 3 }}>
            <Tab label="All Doctors" />
            <Tab label="Login Management" />
            <Tab label="ML Access Control" />
          </Tabs>
        </Box>

        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress sx={{ color: '#dc2626' }} />
            </Box>
          ) : (
            <>
              {/* All Doctors Tab */}
              {tabValue === 0 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Experience</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>ML Access</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Chat Access</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDoctors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                            {searchTerm ? 'No doctors match your search.' : 'No doctors found.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDoctors.map((doctor) => (
                          <TableRow key={doctor._id || doctor.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ backgroundColor: '#dc2626', width: 40, height: 40 }}>
                                  {(doctor.firstName?.[0] || '?')}{(doctor.lastName?.[0] || '')}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Dr. {doctor.firstName} {doctor.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    License: {doctor.medicalLicenseNumber || doctor.licenseNumber || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{doctor.specialization || '—'}</TableCell>
                            <TableCell>{doctor.phone || '—'}</TableCell>
                            <TableCell>{doctor.experience != null ? `${doctor.experience} yrs` : '—'}</TableCell>
                            <TableCell>
                              <Chip label={doctor.status || 'Unknown'} color={getStatusColor(doctor.status)} size="small" />
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleToggleAccess(doctor._id || doctor.id, 'mlAccess', !doctor.mlAccess)}
                                style={{
                                  padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                  fontWeight: 500, fontSize: 13,
                                  background: doctor.mlAccess ? '#1b5e20' : '#e0e0e0',
                                  color: doctor.mlAccess ? '#fff' : '#555',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {doctor.mlAccess ? 'Enabled' : 'Disabled'}
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleToggleAccess(doctor._id || doctor.id, 'chatAccess', !doctor.chatAccess)}
                                style={{
                                  padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                  fontWeight: 500, fontSize: 13,
                                  background: doctor.chatAccess ? '#0d47a1' : '#e0e0e0',
                                  color: doctor.chatAccess ? '#fff' : '#555',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {doctor.chatAccess ? 'Enabled' : 'Disabled'}
                              </button>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {!doctor.userId && (
                                  <Tooltip title="Create Login">
                                    <IconButton size="small" color="success" onClick={() => {
                                      setSelectedDoctor(doctor);
                                      setLoginCredentials({ ...loginCredentials, username: `${doctor.firstName?.toLowerCase()}.${doctor.lastName?.toLowerCase()}` });
                                      setCreateLoginOpen(true);
                                    }}>
                                      <LoginIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Edit">
                                  <IconButton size="small" color="primary" onClick={() => openEdit(doctor)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {doctor.isSeeded ? (
                                  <Tooltip title="Demo record — cannot delete">
                                    <span>
                                      <IconButton size="small" color="error" disabled>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(doctor)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Login Management Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
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

              {/* ML Access Control Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
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
                                  onChange={() => handleToggleAccess(doctor._id || doctor.id, 'mlAccess', !doctor.mlAccess)}
                                  color="primary"
                                />
                              }
                              label="ML Prediction Access"
                            />
                            <br />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!!doctor.chatAccess}
                                  onChange={() => handleToggleAccess(doctor._id || doctor.id, 'chatAccess', !doctor.chatAccess)}
                                  color="secondary"
                                />
                              }
                              label="Chat Access"
                            />
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

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editDoctor ? `Edit Dr. ${editDoctor.firstName} ${editDoctor.lastName}` : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" value={form.firstName} onChange={handleFormChange('firstName')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" value={form.lastName} onChange={handleFormChange('lastName')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleFormChange('email')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={form.phone} onChange={handleFormChange('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Specialization</InputLabel>
                <Select value={form.specialization} label="Specialization" onChange={handleFormChange('specialization')}>
                  {SPECIALIZATIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Experience (years)" type="number" inputProps={{ min: 0 }} value={form.experience} onChange={handleFormChange('experience')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Medical License Number" value={form.medicalLicenseNumber} onChange={handleFormChange('medicalLicenseNumber')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            sx={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', fontWeight: 600 }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : editDoctor ? 'Save Changes' : 'Add Doctor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Login Dialog */}
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

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Doctor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>Dr. {deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Doctors;
