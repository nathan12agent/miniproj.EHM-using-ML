import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, TextField,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Divider,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { nursesAPI } from '../../services/api';

function NurseLeaveShifts() {
  const { user } = useSelector((state) => state.auth);
  const nurseId = user?.nurseProfile?.id;
  const [nurse, setNurse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);

  const [leaveForm, setLeaveForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });
  const [shiftForm, setShiftForm] = useState({ requestedShift: '', reason: '' });

  const fetchNurse = useCallback(async () => {
    if (!nurseId) return;
    setLoading(true);
    try { const res = await nursesAPI.getById(nurseId); setNurse(res.data); }
    catch (err) { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, [nurseId]);

  useEffect(() => { fetchNurse(); }, [fetchNurse]);

  const handleApplyLeave = async () => {
    try {
      await nursesAPI.applyLeave(nurseId, leaveForm);
      setLeaveOpen(false);
      setLeaveForm({ type: 'Casual', startDate: '', endDate: '', reason: '' });
      setSuccess('Leave request submitted! Waiting for admin approval.');
      fetchNurse();
    } catch (err) { setError('Failed to submit leave request'); }
  };

  const handleRequestShift = async () => {
    try {
      await nursesAPI.requestShiftChange(nurseId, {
        currentShift: nurse?.shift,
        requestedShift: shiftForm.requestedShift,
        reason: shiftForm.reason,
      });
      setShiftOpen(false);
      setShiftForm({ requestedShift: '', reason: '' });
      setSuccess('Shift change request submitted! Waiting for admin approval.');
      fetchNurse();
    } catch (err) { setError('Failed to submit shift change request'); }
  };

  const getStatusColor = (status) => {
    switch (status) { case 'Approved': return 'success'; case 'Rejected': return 'error'; default: return 'warning'; }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

  const leaveRequests = nurse?.leaveRequests || [];
  const shiftRequests = nurse?.shiftChangeRequests || [];

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Leave & Shift Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Current: {nurse?.shift} Shift • {nurse?.ward} Ward
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={() => setLeaveOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
          📅 Apply for Leave
        </Button>
        <Button variant="contained" onClick={() => setShiftOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>
          🔄 Request Shift Change
        </Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ px: 3 }}>
            <Tab label={`Leave Requests (${leaveRequests.length})`} />
            <Tab label={`Shift Change Requests (${shiftRequests.length})`} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              {leaveRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No leave requests yet. Click "Apply for Leave" to submit one.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {[...leaveRequests].reverse().map((l, i) => (
                    <Grid item xs={12} md={6} key={l._id || i}>
                      <Card variant="outlined" sx={{ borderLeft: `4px solid ${l.status === 'Approved' ? '#059669' : l.status === 'Rejected' ? '#dc2626' : '#f59e0b'}` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Chip label={l.type} size="small" color="info" />
                            <Chip label={l.status} size="small" color={getStatusColor(l.status)} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{l.reason}</Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Applied: {new Date(l.appliedAt).toLocaleString()}
                          </Typography>
                          {l.reviewNote && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Admin note: {l.reviewNote}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {shiftRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No shift change requests yet.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {[...shiftRequests].reverse().map((s, i) => (
                    <Grid item xs={12} md={6} key={s._id || i}>
                      <Card variant="outlined" sx={{ borderLeft: `4px solid ${s.status === 'Approved' ? '#059669' : s.status === 'Rejected' ? '#dc2626' : '#f59e0b'}` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Chip label={`${s.currentShift} → ${s.requestedShift}`} size="small" color="info" />
                            <Chip label={s.status} size="small" color={getStatusColor(s.status)} />
                          </Box>
                          <Typography variant="body2" color="text.secondary">{s.reason}</Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Requested: {new Date(s.appliedAt).toLocaleString()}
                          </Typography>
                          {s.reviewNote && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Admin note: {s.reviewNote}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for Leave</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select value={leaveForm.type} label="Leave Type" onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                  {['Sick', 'Casual', 'Emergency', 'Annual'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Start Date" type="date" value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="End Date" type="date" value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Reason" multiline rows={3} value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyLeave} variant="contained"
            disabled={!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason}
            sx={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Change Dialog */}
      <Dialog open={shiftOpen} onClose={() => setShiftOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Shift Change</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Current Shift" value={nurse?.shift || ''} disabled />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Requested Shift</InputLabel>
                <Select value={shiftForm.requestedShift} label="Requested Shift"
                  onChange={(e) => setShiftForm({ ...shiftForm, requestedShift: e.target.value })}>
                  {['Morning', 'Evening', 'Night'].filter(s => s !== nurse?.shift).map(s =>
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Reason" multiline rows={3} value={shiftForm.reason}
                onChange={(e) => setShiftForm({ ...shiftForm, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftOpen(false)}>Cancel</Button>
          <Button onClick={handleRequestShift} variant="contained"
            disabled={!shiftForm.requestedShift || !shiftForm.reason}
            sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NurseLeaveShifts;
