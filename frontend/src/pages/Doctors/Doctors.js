import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
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
  EventBusy as LeaveIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { doctorsAPI } from '../../services/api';
import api from '../../services/api';

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Emergency Medicine',
  'Internal Medicine',
  'Surgery',
  'Radiology',
  'Psychiatry',
  'Orthopedics',
  'Dermatology',
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
  const [addOpen, setAddOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleToggleAccess = async (doctorId, field, newValue) => {
    try {
      await api.patch(`/doctors/${doctorId}/access`, { [field]: newValue });
      setDoctors(prev => prev.map(d => d._id === doctorId ? { ...d, [field]: newValue } : d));
      showSnackbar(`${field === 'mlAccess' ? 'ML' : 'Chat'} access ${newValue ? 'enabled' : 'disabled'} successfully`, newValue ? 'success' : 'info');
    } catch (err) {
      showSnackbar('Failed to update access: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorsAPI.getAll();
      setDoctors(res.data?.doctors || res.data?.data || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
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
      medicalLicenseNumber: doctor.medicalLicenseNumber || '',
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
      } else {
        await doctorsAPI.create(form);
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete doctor.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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
    onLeave: doctors.filter((d) => d.status === 'On Leave').length,
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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#dc2626',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Doctor Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage medical staff and configure ML access
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          }}
        >
          Add New Doctor
        </Button>
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
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {loading ? <CircularProgress size={24} /> : value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
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

      {/* Table */}
      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress sx={{ color: '#dc2626' }} />
          </Box>
        ) : (
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
                              {doctor.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{doctor.specialization || '—'}</TableCell>
                      <TableCell>{doctor.phone || '—'}</TableCell>
                      <TableCell>
                        {doctor.experience != null ? `${doctor.experience} yrs` : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doctor.status || 'Unknown'}
                          color={getStatusColor(doctor.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleAccess(doctor._id || doctor.id, 'mlAccess', !doctor.mlAccess)}
                          style={{
                            padding: '4px 14px',
                            borderRadius: 20,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: 13,
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
                            padding: '4px 14px',
                            borderRadius: 20,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: 13,
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
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget(doctor)}
                              >
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
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editDoctor
            ? `Edit Dr. ${editDoctor.firstName} ${editDoctor.lastName}`
            : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={form.firstName}
                onChange={handleFormChange('firstName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={form.lastName}
                onChange={handleFormChange('lastName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={handleFormChange('email')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={handleFormChange('phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={form.specialization}
                  label="Specialization"
                  onChange={handleFormChange('specialization')}
                >
                  {SPECIALIZATIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Experience (years)"
                type="number"
                inputProps={{ min: 0 }}
                value={form.experience}
                onChange={handleFormChange('experience')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical License Number"
                value={form.medicalLicenseNumber}
                onChange={handleFormChange('medicalLicenseNumber')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            sx={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              fontWeight: 600,
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : editDoctor ? 'Save Changes' : 'Add Doctor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Doctor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>Dr. {deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
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
