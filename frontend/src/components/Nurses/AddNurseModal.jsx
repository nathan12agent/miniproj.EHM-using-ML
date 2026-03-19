import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { addNurse } from '../../store/slices/nurseSlice';

const WARDS = ['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'];
const SHIFTS = ['Morning', 'Evening', 'Night'];

export default function AddNurseModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', ward: 'General', shift: 'Morning', specialization: '', experience: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    const result = await dispatch(addNurse(form));
    setLoading(false);
    if (addNurse.fulfilled.match(result)) {
      setForm({ firstName: '', lastName: '', email: '', phone: '', ward: 'General', shift: 'Morning', specialization: '', experience: '' });
      onSuccess?.();
      onClose();
    } else {
      setError(result.payload || 'Failed to create nurse');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Nurse</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><TextField label="First Name *" name="firstName" value={form.firstName} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}><TextField label="Last Name *" name="lastName" value={form.lastName} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={12}><TextField label="Email *" name="email" value={form.email} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}><TextField label="Phone *" name="phone" value={form.phone} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}><TextField label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} fullWidth size="small" /></Grid>
          <Grid item xs={6}>
            <TextField select label="Ward *" name="ward" value={form.ward} onChange={handleChange} fullWidth size="small">
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Shift *" name="shift" value={form.shift} onChange={handleChange} fullWidth size="small">
              {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField label="Experience (years)" name="experience" type="number" value={form.experience} onChange={handleChange} fullWidth size="small" /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Nurse'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
