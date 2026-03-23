import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Chip, MenuItem, TextField, Alert, Divider,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { updateBedStatus } from '../../store/slices/bedSlice';
import { releaseSingleBed } from '../../services/bedService';

const STATUSES = ['Available', 'Occupied', 'Maintenance', 'Reserved'];

const STATUS_COLORS = {
  Available:   'success',
  Occupied:    'error',
  Maintenance: 'default',
  Reserved:    'warning',
};

const PURPOSE_LABELS = {
  patient_bed:   'Patient Bed',
  doctor_room:   'Doctor Room',
  nurse_station: 'Nurse Station',
  on_call_room:  'On-Call Room',
};

const PURPOSE_CHIP_COLORS = {
  patient_bed:   { bg: '#16a34a', color: '#fff' },
  doctor_room:   { bg: '#1565c0', color: '#fff' },
  nurse_station: { bg: '#6a1b9a', color: '#fff' },
  on_call_room:  { bg: '#b45309', color: '#fff' },
};

const RELEASE_LABELS = {
  patient_bed:   'Release Patient Bed',
  doctor_room:   'Release Doctor Room',
  nurse_station: 'Release Nurse Station',
};

export default function BedDetailModal({ open, bed, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [status,    setStatus]    = useState(bed?.status || 'Available');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [releasing, setReleasing] = useState(false);

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

  const handleSingleRelease = async () => {
    const occupantName = bed.allocatedTo?.name || bed.patient?.firstName || 'occupant';
    if (!window.confirm(`Release ${occupantName} from ${bed.bedNumber}?`)) return;
    try {
      setReleasing(true);
      await releaseSingleBed(bed._id);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Release failed');
    } finally {
      setReleasing(false);
    }
  };

  if (!bed) return null;

  const purposeStyle = PURPOSE_CHIP_COLORS[bed.bedPurpose] || PURPOSE_CHIP_COLORS.patient_bed;
  const isStaffBed   = bed.bedPurpose === 'doctor_room' || bed.bedPurpose === 'nurse_station';
  const isOccupied   = bed.status === 'Occupied';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Bed {bed.bedNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={bed.ward} variant="outlined" size="small" />
          <Chip label={bed.status} color={STATUS_COLORS[bed.status] || 'default'} size="small" />
          <Chip
            label={PURPOSE_LABELS[bed.bedPurpose] || 'Patient Bed'}
            size="small"
            sx={{ backgroundColor: purposeStyle.bg, color: purposeStyle.color }}
          />
          {bed.isSeeded && <Chip label="Demo Record" size="small" variant="outlined" color="info" />}
        </Box>

        {/* Patient occupant */}
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

        {/* Staff occupant */}
        {isStaffBed && bed.allocatedTo?.name && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {bed.bedPurpose === 'doctor_room' ? 'Assigned Doctor' : 'Assigned Nurse'}
            </Typography>
            <Typography variant="body2">{bed.allocatedTo.name}</Typography>
            {bed.allocatedTo.role && (
              <Typography variant="caption" color="text.secondary" display="block">
                Role: {bed.allocatedTo.role}
              </Typography>
            )}
            {bed.allocatedTo.department && (
              <Typography variant="caption" color="text.secondary" display="block">
                Department: {bed.allocatedTo.department}
              </Typography>
            )}
            {bed.assignedDate && (
              <Typography variant="caption" color="text.secondary" display="block">
                Since: {new Date(bed.assignedDate).toLocaleDateString()}
              </Typography>
            )}
            <Divider sx={{ my: 1.5 }} />
          </>
        )}

        {/* Empty staff bed */}
        {isStaffBed && !bed.allocatedTo?.name && bed.status === 'Available' && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No staff currently assigned to this {PURPOSE_LABELS[bed.bedPurpose]?.toLowerCase()}.
            </Typography>
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

        {/* ── Single Release button — shown when bed is occupied ── */}
        {isOccupied && (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              color="error"
              disabled={releasing}
              onClick={handleSingleRelease}
              sx={{ borderRadius: 2 }}
            >
              {releasing ? 'Releasing...' : (RELEASE_LABELS[bed.bedPurpose] || 'Release Bed')}
            </Button>
          </>
        )}
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
