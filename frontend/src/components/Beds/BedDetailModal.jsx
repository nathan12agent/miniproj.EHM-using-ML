import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Chip, MenuItem, TextField, Alert, Divider,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { updateBedStatus } from '../../store/slices/bedSlice';

const STATUSES = ['Available', 'Occupied', 'Maintenance', 'Reserved'];

const STATUS_COLORS = {
  Available: 'success',
  Occupied: 'error',
  Maintenance: 'default',
  Reserved: 'warning',
};

export default function BedDetailModal({ open, bed, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState(bed?.status || 'Available');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    const result = await dispatch(updateBedStatus({ id: bed._id, data: { status } }));
    setLoading(false);
    if (updateBedStatus.fulfilled.match(result)) {
      onSuccess?.();
    } else {
      setError(result.payload || 'Failed to update bed');
    }
  };

  if (!bed) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Bed {bed.bedNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={bed.ward} variant="outlined" size="small" />
          <Chip label={bed.status} color={STATUS_COLORS[bed.status] || 'default'} size="small" />
          {bed.isSeeded && <Chip label="Demo Record" size="small" variant="outlined" color="info" />}
        </Box>

        {bed.patient && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" fontWeight={600} gutterBottom>Current Patient</Typography>
            <Typography variant="body2">
              {bed.patient.firstName} {bed.patient.lastName}
            </Typography>
            {bed.patient.patientId && (
              <Typography variant="caption" color="text.secondary">ID: {bed.patient.patientId}</Typography>
            )}
            {bed.assignedDate && (
              <Typography variant="caption" color="text.secondary" display="block">
                Admitted: {new Date(bed.assignedDate).toLocaleDateString()}
              </Typography>
            )}
            <Divider sx={{ my: 1.5 }} />
          </>
        )}

        <TextField
          select
          label="Update Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          fullWidth
          size="small"
          sx={{ mt: 1 }}
        >
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
