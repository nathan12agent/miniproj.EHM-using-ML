import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Avatar,
  Fade,
  Pagination,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  EventNote as EventNoteIcon,
  CurrencyRupee as RupeeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { schedulingAPI } from '../../services/api';

function formatTime12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

const STATUS_CONFIG = {
  'Scheduled': { color: '#f59e0b', bg: '#fffbeb', icon: <ScheduleIcon /> },
  'Confirmed': { color: '#3b82f6', bg: '#eff6ff', icon: <CheckCircleIcon /> },
  'In Progress': { color: '#8b5cf6', bg: '#f5f3ff', icon: <ScheduleIcon /> },
  'Completed': { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleIcon /> },
  'Cancelled': { color: '#ef4444', bg: '#fef2f2', icon: <CancelIcon /> },
  'No Show': { color: '#6b7280', bg: '#f3f4f6', icon: <CancelIcon /> },
};

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const response = await schedulingAPI.getDoctorAppointments(params);
      setAppointments(response.data.appointments || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }
    setLoading(false);
  }, [page, filterStatus, filterDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

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
          My Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all your booked appointments
        </Typography>
      </Box>

      {/* Stats Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total', value: totalCount, color: '#0891b2' },
          { label: 'Today', value: appointments.filter(a => {
            const today = new Date().toDateString();
            return new Date(a.appointmentDate).toDateString() === today;
          }).length, color: '#f59e0b' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'Completed').length, color: '#10b981' },
          { label: 'Upcoming', value: appointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length, color: '#3b82f6' },
        ].map((stat, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card sx={{ textAlign: 'center', p: 2, borderRadius: 2, borderTop: `3px solid ${stat.color}` }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>{stat.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FilterIcon sx={{ color: '#9ca3af' }} />
        <TextField
          type="date"
          label="Filter by Date"
          value={filterDate}
          onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 200 }}
          id="filter-date"
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            id="filter-status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="Scheduled">Scheduled</MenuItem>
            <MenuItem value="Confirmed">Confirmed</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        {(filterDate || filterStatus) && (
          <Chip
            label="Clear Filters"
            onDelete={() => { setFilterDate(''); setFilterStatus(''); setPage(1); }}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Paper>

      {/* Appointments Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#0891b2' }} size={48} />
          <Typography sx={{ mt: 2, color: '#6b7280' }}>Loading appointments...</Typography>
        </Box>
      ) : appointments.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <EventNoteIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
            No Appointments Found
          </Typography>
          <Typography variant="body1" sx={{ color: '#9ca3af' }}>
            {filterDate || filterStatus ? 'Try adjusting your filters' : 'No patients have booked appointments yet'}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {appointments.map((apt, index) => {
              const statusConf = STATUS_CONFIG[apt.status] || STATUS_CONFIG['Scheduled'];
              return (
                <Grid item xs={12} sm={6} lg={4} key={apt._id || index}>
                  <Fade in>
                    <Card
                      sx={{
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      {/* Status Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: 16,
                          backgroundColor: statusConf.bg,
                          color: statusConf.color,
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: `1px solid ${statusConf.color}30`,
                          boxShadow: `0 2px 8px ${statusConf.color}20`,
                        }}
                      >
                        {apt.status}
                      </Box>

                      <CardContent sx={{ p: 3, pt: 3.5 }}>
                        {/* Patient Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 48, height: 48,
                              backgroundColor: '#e0f2fe',
                              color: '#0891b2',
                              fontWeight: 700,
                            }}
                          >
                            {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1f2937' }}>
                              {apt.patient?.firstName} {apt.patient?.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              ID: {apt.patient?.patientId || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Date & Time */}
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: '#0891b2' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                {new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
                                  weekday: 'short', day: 'numeric', month: 'short'
                                })}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimeIcon sx={{ fontSize: 16, color: '#0891b2' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                {formatTime12h(apt.appointmentTime)}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Contact */}
                        {apt.patient?.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>{apt.patient.phone}</Typography>
                          </Box>
                        )}
                        {apt.patient?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <EmailIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>{apt.patient.email}</Typography>
                          </Box>
                        )}

                        {/* Reason */}
                        {apt.reason && (
                          <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: '#f9fafb', borderRadius: 1.5 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>REASON</Typography>
                            <Typography variant="body2" sx={{ color: '#374151' }}>{apt.reason}</Typography>
                          </Box>
                        )}

                        {/* Footer: Type & Fee */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip label={apt.type || 'Consultation'} size="small" variant="outlined" sx={{ borderColor: '#d1d5db' }} />
                          <Typography variant="body2" sx={{ color: '#0891b2', fontWeight: 700 }}>
                            ₹{apt.consultationFee || apt.doctor?.consultationFee || '0'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': { fontWeight: 600 },
                  '& .Mui-selected': { backgroundColor: '#0891b2 !important', color: 'white' },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default DoctorAppointments;
