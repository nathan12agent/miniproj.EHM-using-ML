import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, TextField,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton, Checkbox, List, ListItem, ListItemText,
} from '@mui/material';
import {
  PlayArrow as StartIcon, Stop as StopIcon, Add as AddIcon,
  Delete as DeleteIcon, CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { nursesAPI } from '../../services/api';

function NurseDashboard() {
  const { user } = useSelector((state) => state.auth);
  const nurseId = user?.nurseProfile?.id;
  const [nurse, setNurse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialogs
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [breakReason, setBreakReason] = useState('');

  // Forms
  const [vitalsForm, setVitalsForm] = useState({ patientId: '', temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', oxygenSaturation: '', respiratoryRate: '', notes: '' });
  const [handoverForm, setHandoverForm] = useState({ toShift: '', notes: '', criticalPatients: '', pendingTasks: '' });
  const [taskForm, setTaskForm] = useState({ task: '', category: 'Other', dueTime: '' });

  const fetchNurse = useCallback(async () => {
    if (!nurseId) return;
    setLoading(true);
    try {
      const res = await nursesAPI.getById(nurseId);
      setNurse(res.data);
    } catch (err) {
      setError('Failed to load nurse data');
    } finally {
      setLoading(false);
    }
  }, [nurseId]);

  useEffect(() => { fetchNurse(); }, [fetchNurse]);

  const handleStartBreak = async () => {
    try {
      await nursesAPI.startBreak(nurseId, { reason: breakReason || 'Regular break' });
      setBreakReason('');
      setSuccess('Break started');
      fetchNurse();
    } catch (err) { setError('Failed to start break'); }
  };

  const handleEndBreak = async () => {
    try {
      await nursesAPI.endBreak(nurseId);
      setSuccess('Break ended — you are back on duty');
      fetchNurse();
    } catch (err) { setError('Failed to end break'); }
  };

  const handleLogVitals = async () => {
    try {
      await nursesAPI.logVitals(nurseId, vitalsForm);
      setVitalsOpen(false);
      setVitalsForm({ patientId: '', temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', oxygenSaturation: '', respiratoryRate: '', notes: '' });
      setSuccess('Vitals logged successfully');
      fetchNurse();
    } catch (err) { setError('Failed to log vitals'); }
  };

  const handleAddHandover = async () => {
    try {
      await nursesAPI.addHandoverNote(nurseId, {
        fromShift: nurse?.shift, toShift: handoverForm.toShift,
        notes: handoverForm.notes,
        criticalPatients: handoverForm.criticalPatients.split(',').map(s => s.trim()).filter(Boolean),
        pendingTasks: handoverForm.pendingTasks.split(',').map(s => s.trim()).filter(Boolean),
      });
      setHandoverOpen(false);
      setHandoverForm({ toShift: '', notes: '', criticalPatients: '', pendingTasks: '' });
      setSuccess('Handover note added');
      fetchNurse();
    } catch (err) { setError('Failed to add handover note'); }
  };

  const handleAddTask = async () => {
    try {
      await nursesAPI.addTask(nurseId, taskForm);
      setTaskOpen(false);
      setTaskForm({ task: '', category: 'Other', dueTime: '' });
      setSuccess('Task added');
      fetchNurse();
    } catch (err) { setError('Failed to add task'); }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await nursesAPI.toggleTask(nurseId, taskId);
      fetchNurse();
    } catch (err) { setError('Failed to update task'); }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await nursesAPI.deleteTask(nurseId, taskId);
      fetchNurse();
    } catch (err) { setError('Failed to delete task'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

  const isOnBreak = nurse?.status === 'On Break';
  const activeBreak = nurse?.breakLog?.find(b => !b.endTime);
  const todayBreaks = nurse?.breakLog?.filter(b => b.endTime && new Date(b.startTime).toDateString() === new Date().toDateString()) || [];
  const totalBreakMins = todayBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);
  const tasks = nurse?.taskChecklist || [];
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Nurse Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome, {nurse?.firstName} {nurse?.lastName} — {nurse?.ward} Ward
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Current Status', value: nurse?.status || 'N/A', color: isOnBreak ? '#f59e0b' : '#059669' },
          { label: 'Ward', value: nurse?.ward || 'N/A', color: '#0891b2' },
          { label: 'Shift', value: nurse?.shift || 'N/A', color: '#8b5cf6' },
          { label: 'Patients', value: `${nurse?.assignedPatients?.length || 0} / ${nurse?.maxPatientLoad || 5}`, color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card sx={{ textAlign: 'center', p: 2, borderTop: `4px solid ${color}` }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{value}</Typography>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Break Management */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>⏱️ Break Management</Typography>
            {isOnBreak ? (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You are currently on break since {activeBreak ? new Date(activeBreak.startTime).toLocaleTimeString() : '—'}
                </Alert>
                <Button variant="contained" color="success" startIcon={<StopIcon />} onClick={handleEndBreak} fullWidth>
                  End Break & Return to Duty
                </Button>
              </Box>
            ) : (
              <Box>
                <TextField fullWidth label="Break reason (optional)" value={breakReason}
                  onChange={(e) => setBreakReason(e.target.value)} sx={{ mb: 2 }} size="small" />
                <Button variant="contained" startIcon={<StartIcon />} onClick={handleStartBreak} fullWidth
                  sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  Start Break
                </Button>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Today's breaks: {todayBreaks.length} ({totalBreakMins} min total)
            </Typography>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>⚡ Quick Actions</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button variant="outlined" fullWidth onClick={() => setVitalsOpen(true)} sx={{ py: 1.5 }}>
                  🩺 Log Vitals
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button variant="outlined" fullWidth onClick={() => setHandoverOpen(true)} sx={{ py: 1.5 }}>
                  📝 Handover Note
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button variant="outlined" fullWidth onClick={() => setTaskOpen(true)} sx={{ py: 1.5 }}>
                  ✅ Add Task
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button variant="outlined" fullWidth onClick={() => window.location.href = '/nurse/leave-shifts'} sx={{ py: 1.5 }}>
                  📅 Apply Leave
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Task Checklist */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>📋 Task Checklist ({completedTasks}/{tasks.length})</Typography>
              <IconButton size="small" onClick={() => setTaskOpen(true)}><AddIcon /></IconButton>
            </Box>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No tasks yet. Add one!</Typography>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {tasks.map((t) => (
                  <ListItem key={t._id} sx={{ borderRadius: 1, mb: 0.5, bgcolor: t.completed ? '#f0fdf4' : 'transparent' }}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => handleDeleteTask(t._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }>
                    <Checkbox size="small" checked={t.completed} onChange={() => handleToggleTask(t._id)} sx={{ color: '#059669', '&.Mui-checked': { color: '#059669' } }} />
                    <ListItemText primary={t.task}
                      secondary={`${t.category}${t.dueTime ? ' • Due: ' + t.dueTime : ''}`}
                      primaryTypographyProps={{ sx: { textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#9ca3af' : 'inherit' } }} />
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        {/* Recent Handover Notes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>📝 Recent Handover Notes</Typography>
            {(!nurse?.handoverNotes || nurse.handoverNotes.length === 0) ? (
              <Typography variant="body2" color="text.secondary">No handover notes yet.</Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {nurse.handoverNotes.slice(-5).reverse().map((h, i) => (
                  <Box key={i} sx={{ p: 2, mb: 1, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip label={`${h.fromShift} → ${h.toShift}`} size="small" color="info" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(h.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{h.notes}</Typography>
                    {h.criticalPatients?.length > 0 && (
                      <Typography variant="caption" color="error">⚠️ Critical: {h.criticalPatients.join(', ')}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Log Vitals Dialog */}
      <Dialog open={vitalsOpen} onClose={() => setVitalsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Patient Vitals</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Patient Name / ID" value={vitalsForm.patientId}
                onChange={(e) => setVitalsForm({ ...vitalsForm, patientId: e.target.value })} />
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Temperature (°F)" type="number" value={vitalsForm.temperature} onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Heart Rate (bpm)" type="number" value={vitalsForm.heartRate} onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="BP Systolic" type="number" value={vitalsForm.bloodPressureSystolic} onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureSystolic: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="BP Diastolic" type="number" value={vitalsForm.bloodPressureDiastolic} onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="O2 Saturation (%)" type="number" value={vitalsForm.oxygenSaturation} onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Resp Rate" type="number" value={vitalsForm.respiratoryRate} onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={vitalsForm.notes} onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVitalsOpen(false)}>Cancel</Button>
          <Button onClick={handleLogVitals} variant="contained" sx={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>Log Vitals</Button>
        </DialogActions>
      </Dialog>

      {/* Handover Note Dialog */}
      <Dialog open={handoverOpen} onClose={() => setHandoverOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Shift Handover Note</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Handing over to shift</InputLabel>
                <Select value={handoverForm.toShift} label="Handing over to shift"
                  onChange={(e) => setHandoverForm({ ...handoverForm, toShift: e.target.value })}>
                  {['Morning', 'Evening', 'Night'].filter(s => s !== nurse?.shift).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Handover Notes" multiline rows={3} value={handoverForm.notes} onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Critical Patients (comma-separated)" value={handoverForm.criticalPatients} onChange={(e) => setHandoverForm({ ...handoverForm, criticalPatients: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Pending Tasks (comma-separated)" value={handoverForm.pendingTasks} onChange={(e) => setHandoverForm({ ...handoverForm, pendingTasks: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHandoverOpen(false)}>Cancel</Button>
          <Button onClick={handleAddHandover} variant="contained" sx={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={taskOpen} onClose={() => setTaskOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Task" value={taskForm.task} onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={taskForm.category} label="Category" onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}>
                  {['Medication', 'Vitals', 'Hygiene', 'Documentation', 'Other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Time" type="time" value={taskForm.dueTime} onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTask} variant="contained" disabled={!taskForm.task} sx={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NurseDashboard;
