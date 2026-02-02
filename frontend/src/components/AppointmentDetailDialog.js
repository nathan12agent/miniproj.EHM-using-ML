import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Note as NoteIcon,
} from '@mui/icons-material';

const AppointmentDetailDialog = ({ open, onClose, appointment }) => {
  if (!appointment) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Scheduled':
        return 'info';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
      case 'No Show':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Emergency':
        return 'error';
      case 'Surgery':
        return 'warning';
      case 'Follow-up':
        return 'info';
      default:
        return 'primary';
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'primary.main' }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {value || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Appointment Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {appointment.appointmentId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={appointment.type} 
              color={getTypeColor(appointment.type)}
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={appointment.status} 
              color={getStatusColor(appointment.status)}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Patient Information
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {appointment.patient?.patientId}
                  </Typography>
                </Box>
              </Box>
              {appointment.patient?.phone && (
                <Typography variant="body2" color="text.secondary">
                  📞 {appointment.patient.phone}
                </Typography>
              )}
              {appointment.patient?.email && (
                <Typography variant="body2" color="text.secondary">
                  ✉️ {appointment.patient.email}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Doctor Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <DoctorIcon sx={{ mr: 1 }} />
                Doctor Information
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {appointment.doctor?.firstName?.[0]}{appointment.doctor?.lastName?.[0]}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {appointment.doctor?.specialization}
                  </Typography>
                </Box>
              </Box>
              {appointment.doctor?.phone && (
                <Typography variant="body2" color="text.secondary">
                  📞 {appointment.doctor.phone}
                </Typography>
              )}
              {appointment.doctor?.email && (
                <Typography variant="body2" color="text.secondary">
                  ✉️ {appointment.doctor.email}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Appointment Details */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'primary.lighter' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Appointment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<CalendarIcon />}
                    label="Date"
                    value={appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<TimeIcon />}
                    label="Time"
                    value={appointment.appointmentTime}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<TimeIcon />}
                    label="Duration"
                    value={`${appointment.duration || 30} minutes`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<DescriptionIcon />}
                    label="Type"
                    value={appointment.type}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Reason for Visit */}
          {appointment.reason && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  Reason for Visit
                </Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                  {appointment.reason}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Notes */}
          {appointment.notes && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <NoteIcon sx={{ mr: 1 }} />
                  Additional Notes
                </Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                  {appointment.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Record Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Record Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2">
                    <Chip 
                      label={appointment.status} 
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentDetailDialog;
