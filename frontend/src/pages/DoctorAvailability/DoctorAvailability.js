import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Fade,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  CurrencyRupee as RupeeIcon,
  Save as SaveIcon,
  EventAvailable as EventAvailableIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { schedulingAPI } from '../../services/api';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DAY_COLORS = {
  monday: '#3b82f6',
  tuesday: '#8b5cf6',
  wednesday: '#10b981',
  thursday: '#f59e0b',
  friday: '#ef4444',
  saturday: '#06b6d4',
  sunday: '#ec4899',
};

function DoctorAvailability() {
  const [availability, setAvailability] = useState([]);
  const [consultationFee, setConsultationFee] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 'monday',
    timeRanges: [{ startTime: '09:00', endTime: '17:00' }],
    slotDuration: 15,
  });

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const response = await schedulingAPI.getAvailability();
      setAvailability(response.data.availability || []);
      setConsultationFee(response.data.consultationFee || '');
    } catch (error) {
      console.error('Error loading availability:', error);
      setSnackbar({ open: true, message: 'Could not load availability. Make sure you are logged in as a doctor.', severity: 'warning' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const handleOpenDialog = (day = null) => {
    if (day) {
      // Editing existing day
      const existing = availability.find(a => a.dayOfWeek === day);
      setEditingDay(day);
      setFormData({
        dayOfWeek: day,
        timeRanges: existing ? existing.timeRanges.map(r => ({ startTime: r.startTime, endTime: r.endTime })) : [{ startTime: '09:00', endTime: '17:00' }],
        slotDuration: existing?.slotDuration || 15,
      });
    } else {
      // Adding new day
      setEditingDay(null);
      const usedDays = availability.map(a => a.dayOfWeek);
      const nextDay = DAYS_OF_WEEK.find(d => !usedDays.includes(d.key));
      setFormData({
        dayOfWeek: nextDay?.key || 'monday',
        timeRanges: [{ startTime: '09:00', endTime: '17:00' }],
        slotDuration: 15,
      });
    }
    setDialogOpen(true);
  };

  const handleAddTimeRange = () => {
    setFormData(prev => ({
      ...prev,
      timeRanges: [...prev.timeRanges, { startTime: '14:00', endTime: '18:00' }],
    }));
  };

  const handleRemoveTimeRange = (index) => {
    setFormData(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.filter((_, i) => i !== index),
    }));
  };

  const handleTimeChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.timeRanges];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, timeRanges: updated };
    });
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      await schedulingAPI.setAvailability(formData);
      setSnackbar({ open: true, message: `Availability for ${formData.dayOfWeek} saved successfully!`, severity: 'success' });
      setDialogOpen(false);
      loadAvailability();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save availability';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
    setSaving(false);
  };

  const handleDeleteDay = async (dayOfWeek) => {
    try {
      await schedulingAPI.deleteAvailability(dayOfWeek);
      setSnackbar({ open: true, message: `Availability for ${dayOfWeek} removed`, severity: 'info' });
      loadAvailability();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to remove availability', severity: 'error' });
    }
  };

  const handleSaveFee = async () => {
    if (!consultationFee || isNaN(consultationFee)) {
      setSnackbar({ open: true, message: 'Please enter a valid fee amount', severity: 'warning' });
      return;
    }
    try {
      await schedulingAPI.setConsultationFee(Number(consultationFee));
      setSnackbar({ open: true, message: 'Consultation fee updated!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update fee', severity: 'error' });
    }
  };

  const formatTime12h = (time24) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const countSlots = (timeRanges, duration) => {
    let total = 0;
    for (const range of timeRanges) {
      const [sh, sm] = range.startTime.split(':').map(Number);
      const [eh, em] = range.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      total += Math.floor((endMin - startMin) / duration);
    }
    return total;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: '#0891b2' }} size={48} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#0891b2',
            mb: 1,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Manage Availability
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set your available days, time slots, and consultation fee
        </Typography>
      </Box>

      {/* Consultation Fee Card */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
          color: 'white',
          borderRadius: 3,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RupeeIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Consultation Fee</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Set your fee in Indian Rupees (₹)</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              type="number"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              placeholder="e.g. 500"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, fontWeight: 700, color: 'white' }}>₹</Typography>,
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  borderRadius: 2,
                  '& input': { color: 'white', fontWeight: 600, fontSize: '1.2rem' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                },
              }}
              sx={{ width: 200 }}
              id="consultation-fee-input"
            />
            <Button
              variant="contained"
              onClick={handleSaveFee}
              startIcon={<SaveIcon />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                borderRadius: 2,
                px: 3,
              }}
              id="save-fee-btn"
            >
              Save Fee
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Weekly Schedule Overview */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#0891b2' }} />
          Weekly Schedule
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            boxShadow: '0 4px 12px rgba(8,145,178,0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0e7490, #0891b2)',
              transform: 'scale(1.02)',
            },
          }}
          id="add-availability-btn"
        >
          Add Day
        </Button>
      </Box>

      {/* Day Cards Grid */}
      {availability.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '2px dashed #d1d5db',
            backgroundColor: '#f9fafb',
          }}
        >
          <ScheduleIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
            No Availability Set
          </Typography>
          <Typography variant="body1" sx={{ color: '#9ca3af', mb: 3 }}>
            Add your available days and time ranges so patients can book appointments.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
            }}
          >
            Set Your First Availability
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {DAYS_OF_WEEK.map((day) => {
            const dayData = availability.find(a => a.dayOfWeek === day.key);
            const isActive = !!dayData;
            const color = DAY_COLORS[day.key];

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={day.key}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: isActive ? `2px solid ${color}` : '2px dashed #e5e7eb',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isActive ? 1 : 0.5,
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: isActive ? 'translateY(-4px)' : 'none',
                      boxShadow: isActive ? `0 12px 28px ${color}25` : 'none',
                    },
                  }}
                >
                  {/* Day Header */}
                  <Box
                    sx={{
                      background: isActive
                        ? `linear-gradient(135deg, ${color}, ${color}dd)`
                        : '#f3f4f6',
                      p: 2,
                      borderRadius: '10px 10px 0 0',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: isActive ? 'white' : '#9ca3af',
                          fontSize: '1rem',
                        }}
                      >
                        {day.label}
                      </Typography>
                      {isActive && (
                        <Chip
                          label={`${countSlots(dayData.timeRanges, dayData.slotDuration || 15)} slots`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    {isActive ? (
                      <>
                        {dayData.timeRanges.map((range, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: `${color}10`,
                            }}
                          >
                            <TimeIcon sx={{ fontSize: 16, color }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                              {formatTime12h(range.startTime)} — {formatTime12h(range.endTime)}
                            </Typography>
                          </Box>
                        ))}
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 1 }}>
                          {dayData.slotDuration || 15} min slots
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(day.key)}
                            sx={{ color, fontWeight: 600, fontSize: '0.75rem' }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteDay(day.key)}
                            sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.75rem' }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" sx={{ color: '#d1d5db', mb: 1 }}>
                          Not Available
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, dayOfWeek: day.key }));
                            handleOpenDialog();
                          }}
                          sx={{ color: '#9ca3af', fontSize: '0.75rem' }}
                        >
                          Add
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add/Edit Availability Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', p: 3, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
                {editingDay ? 'Edit Availability' : 'Add Availability'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Set your time ranges for the selected day
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Day Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Day of Week</InputLabel>
            <Select
              value={formData.dayOfWeek}
              label="Day of Week"
              onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
              disabled={!!editingDay}
              id="day-of-week-select"
            >
              {DAYS_OF_WEEK.map((day) => (
                <MenuItem key={day.key} value={day.key}>{day.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Slot Duration */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Slot Duration</InputLabel>
            <Select
              value={formData.slotDuration}
              label="Slot Duration"
              onChange={(e) => setFormData(prev => ({ ...prev, slotDuration: e.target.value }))}
              id="slot-duration-select"
            >
              <MenuItem value={10}>10 minutes</MenuItem>
              <MenuItem value={15}>15 minutes</MenuItem>
            </Select>
          </FormControl>

          {/* Time Ranges */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
            <TimeIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#0891b2' }} />
            Time Ranges
          </Typography>

          {formData.timeRanges.map((range, index) => (
            <Fade in key={index}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}
              >
                <TextField
                  type="time"
                  label="Start Time"
                  value={range.startTime}
                  onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                  id={`start-time-${index}`}
                />
                <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>to</Typography>
                <TextField
                  type="time"
                  label="End Time"
                  value={range.endTime}
                  onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                  id={`end-time-${index}`}
                />
                {formData.timeRanges.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveTimeRange(index)}
                    sx={{ color: '#ef4444' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Fade>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddTimeRange}
            sx={{ color: '#0891b2', fontWeight: 600, mt: 1 }}
            id="add-time-range-btn"
          >
            Add Another Time Range
          </Button>

          {/* Preview */}
          {formData.timeRanges.length > 0 && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: '#ecfeff', border: '1px solid #a5f3fc' }}>
              <Typography variant="body2" sx={{ color: '#0891b2', fontWeight: 600 }}>
                📋 Preview: {countSlots(formData.timeRanges, formData.slotDuration)} appointment slots will be created
                ({formData.slotDuration} min each)
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#6b7280' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAvailability}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
              '&:hover': { background: 'linear-gradient(135deg, #0e7490, #0891b2)' },
            }}
            id="save-availability-btn"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2, fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DoctorAvailability;
