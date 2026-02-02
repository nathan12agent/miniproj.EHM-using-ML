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
  Avatar,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { appointmentsAPI } from '../../services/api';
import AppointmentForm from '../../components/AppointmentForm';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancel(id);
        fetchAppointments();
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        alert('Failed to cancel appointment');
      }
    }
  };

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

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => 
    apt.appointmentDate && new Date(apt.appointmentDate).toISOString().split('T')[0] === today
  );
  const upcomingAppointments = appointments.filter(apt => 
    apt.appointmentDate && new Date(apt.appointmentDate) > new Date()
  );
  const pastAppointments = appointments.filter(apt => 
    apt.appointmentDate && new Date(apt.appointmentDate) < new Date(today)
  );

  const getTabAppointments = () => {
    switch (tabValue) {
      case 0: return todayAppointments;
      case 1: return upcomingAppointments;
      case 2: return pastAppointments;
      default: return appointments;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1,
              }}
            >
              Appointment Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule and manage patient appointments efficiently
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedAppointment(null);
              setFormOpen(true);
            }}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            Schedule New
          </Button>
        </Box>

        <AppointmentForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setSelectedAppointment(null);
          }}
          onSuccess={fetchAppointments}
          appointment={selectedAppointment}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <CalendarIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {todayAppointments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's Appointments
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'success.light',
                  color: 'success.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <TimeIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {upcomingAppointments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'info.light',
                  color: 'info.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <PersonIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {appointments.filter(apt => apt.status === 'Confirmed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ px: 3 }}
          >
            <Tab 
              label={
                <Badge badgeContent={todayAppointments.length} color="primary">
                  Today
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={upcomingAppointments.length} color="secondary">
                  Upcoming
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={pastAppointments.length} color="default">
                  Past
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {getTabAppointments().length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No appointments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0 && "No appointments scheduled for today"}
                {tabValue === 1 && "No upcoming appointments"}
                {tabValue === 2 && "No past appointments"}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {getTabAppointments().map((appointment) => (
                <Grid item xs={12} key={appointment._id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            width: 48,
                            height: 48,
                          }}
                        >
                          {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
                        </Avatar>
                        
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            with Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mt={1}>
                            <Typography variant="body2" color="text.secondary">
                              📅 {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              🕐 {appointment.appointmentTime}
                            </Typography>
                            <Chip 
                              label={appointment.type} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={appointment.visitType || 'Outpatient'} 
                              size="small" 
                              color={appointment.visitType === 'Inpatient' ? 'error' : 'success'}
                              icon={appointment.visitType === 'Inpatient' ? <span>🛏️</span> : <span>👨‍⚕️</span>}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          sx={{ fontWeight: 500 }}
                        />
                        
                        <Box>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setFormOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleCancel(appointment._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Card>
    </Box>
  );
}

export default Appointments;