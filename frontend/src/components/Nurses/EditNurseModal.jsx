import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { updateNurse } from '../../store/slices/nurseSlice';

const WARDS = ['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'];
const SHIFTS = ['Morning', 'Evening', 'Night'];
const STATUSES = ['On Duty', 'On Break', 'Off Duty'];

export default function EditNurseModal({ open, nurse, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nurse) setForm({
      firstName: nurse.firstName || '',
      lastName: nurse.lastName || '',
      email: nurse.email || '',
      phone: nurse.phone || '',
      ward: nurse.ward || 'General',
      shift: nurse.shift || 'Morning',
      status: nurse.status || 'On Duty',
      specialization: nurse.specialization || '',
      experience: nurse.experience || '',
    });
  }, [nurse]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const result = await dispatch(updateNurse({ id: nurse._id, data: form }));
    setLoading(false);
    if (updateNurse.fulfilled.match(result)) {
      onSuccess?.();
    } else {
      setError(result.payload || 'Failed to update nurse');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Nurse</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><TextField label="First Name" name="firstName" value={form.firstName || ''} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}><TextField label="Last Name" name="lastName" value={form.lastName || ''} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}><TextField label="Phone" name="phone" value={form.phone || ''} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}><TextField label="Specialization" name="specialization" value={form.specialization || ''} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={4}>
            <TextField select label="Ward" name="ward" value={form.ward || 'General'} onChange={handleChange} fullWidth size="small">
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField select label="Shift" name="shift" value={form.shift || 'Morning'} onChange={handleChange} fullWidth size="small">
              {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField select label="Status" name="status" value={form.status || 'On Duty'} onChange={handleChange} fullWidth size="small">
              {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField label="Experience (years)" name="experience" type="number" value={form.experience || ''} onChange={handleChange} fullWidth size="small" /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
