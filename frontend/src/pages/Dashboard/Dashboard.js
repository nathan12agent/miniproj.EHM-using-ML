import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as DoctorIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  MoreVert as MoreVertIcon,
  Receipt as BillingIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import { patientsAPI, doctorsAPI, appointmentsAPI } from '../../services/api';
import PatientForm from '../../components/PatientForm';
import DoctorForm from '../../components/DoctorForm';
import AppointmentForm from '../../components/AppointmentForm';
import BillForm from '../../components/BillForm';
import ReportForm from '../../components/ReportForm';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [doctorFormOpen, setDoctorFormOpen] = useState(false);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [reportFormOpen, setReportFormOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
        patientsAPI.getAll({ limit: 1000 }),
        doctorsAPI.getAll({ limit: 1000 }),
        appointmentsAPI.getAll({ limit: 100 })
      ]);

      const patients = patientsRes.data.patients || [];
      const doctors = doctorsRes.data.doctors || [];
      const appointments = appointmentsRes.data.appointments || [];

      // Calculate today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointments.filter(apt => 
        apt.appointmentDate && new Date(apt.appointmentDate).toISOString().split('T')[0] === today
      );

      // Calculate pending appointments
      const pendingAppts = appointments.filter(apt => 
        apt.status === 'Scheduled' || apt.status === 'Pending'
      );

      setStats({
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        todayAppointments: todayAppts.length,
        pendingAppointments: pendingAppts.length,
      });

      // Get recent appointments (limit to 5)
      setRecentAppointments(appointments.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MedicalStatCard = ({ title, value, icon, isRed = false, onClick }) => (
    <Card 
      onClick={onClick}
      sx={{ 
        height: 160,
        background: isRed ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : '#ffffff',
        color: isRed ? 'white' : 'text.primary',
        border: isRed ? 'none' : '1px solid #e5e7eb',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isRed ? '0 12px 30px rgba(220, 38, 38, 0.4)' : '0 8px 25px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: isRed ? 'rgba(255,255,255,0.2)' : 'rgba(220, 38, 38, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isRed ? 'white' : '#dc2626',
            mb: 2,
          }}
        >
          {icon}
        </Box>
        
        <Typography 
          variant="h3" 
          component="h2" 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            fontSize: '2rem',
          }}
        >
          {value.toLocaleString()}
        </Typography>
        
        <Typography 
          variant="body2"
          sx={{ 
            fontWeight: 600,
            opacity: isRed ? 0.9 : 0.7,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#dc2626',
            mb: 1,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
          Welcome to the Hospital Admin Center - Monitor your hospital operations
        </Typography>
      </Box>
      
      {/* Top Statistics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MedicalStatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<PeopleIcon fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MedicalStatCard
            title="Active Doctors"
            value={stats.totalDoctors}
            icon={<DoctorIcon fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MedicalStatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<EventIcon fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MedicalStatCard
            title="Pending"
            value={stats.pendingAppointments}
            icon={<TrendingUpIcon fontSize="large" />}
          />
        </Grid>
      </Grid>

      {/* Medical Action Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MedicalStatCard
            title="Add Patient"
            value="+"
            icon={<PeopleIcon fontSize="large" />}
            isRed={true}
            onClick={() => setPatientFormOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MedicalStatCard
            title="Add Appointment"
            value="+"
            icon={<EventIcon fontSize="large" />}
            isRed={true}
            onClick={() => setAppointmentFormOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MedicalStatCard
            title="Add Staff"
            value="+"
            icon={<DoctorIcon fontSize="large" />}
            isRed={true}
            onClick={() => setDoctorFormOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MedicalStatCard
            title="Add Billing"
            value="+"
            icon={<BillingIcon fontSize="large" />}
            isRed={true}
            onClick={() => setBillFormOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MedicalStatCard
            title="Add Report"
            value="+"
            icon={<ReportIcon fontSize="large" />}
            isRed={true}
            onClick={() => setReportFormOpen(true)}
          />
        </Grid>
      </Grid>

      {/* Form Dialogs */}
      <PatientForm
        open={patientFormOpen}
        onClose={() => setPatientFormOpen(false)}
        onSuccess={() => {
          setPatientFormOpen(false);
          fetchDashboardData();
        }}
      />

      <DoctorForm
        open={doctorFormOpen}
        onClose={() => setDoctorFormOpen(false)}
        onSuccess={() => {
          setDoctorFormOpen(false);
          fetchDashboardData();
        }}
      />

      <AppointmentForm
        open={appointmentFormOpen}
        onClose={() => setAppointmentFormOpen(false)}
        onSuccess={() => {
          setAppointmentFormOpen(false);
          fetchDashboardData();
        }}
      />

      <BillForm
        open={billFormOpen}
        onClose={() => setBillFormOpen(false)}
        onSuccess={() => {
          setBillFormOpen(false);
        }}
      />

      <ReportForm
        open={reportFormOpen}
        onClose={() => setReportFormOpen(false)}
        onSuccess={() => {
          setReportFormOpen(false);
        }}
      />

      {/* Charts and Analytics Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 300 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#dc2626' }}>
                Recent Activities
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentAppointments.map((appointment, index) => (
                  <Box key={appointment.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {appointment.patientName.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {appointment.patientName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointment.doctorName} • {appointment.time}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 300 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#dc2626' }}>
                Total Revenue
              </Typography>
              
              {/* Mock Chart Area */}
              <Box sx={{ 
                height: 200, 
                backgroundColor: '#f9fafb', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Mock Line Chart */}
                <Box sx={{ 
                  width: '100%', 
                  height: '60%', 
                  background: 'linear-gradient(45deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.3) 50%, rgba(220, 38, 38, 0.1) 100%)',
                  borderRadius: 1,
                  position: 'relative'
                }}>
                  <Typography variant="h4" sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 700,
                    color: '#dc2626'
                  }}>
                    $125K
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly Revenue
                </Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  +12.5%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 300 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#dc2626' }}>
                Patient Summary
              </Typography>
              
              {/* Mock Pie Chart */}
              <Box sx={{ 
                height: 200, 
                backgroundColor: '#f9fafb', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Box sx={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%',
                  background: `conic-gradient(
                    #dc2626 0deg 120deg,
                    #f59e0b 120deg 200deg,
                    #059669 200deg 280deg,
                    #0891b2 280deg 360deg
                  )`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#dc2626' }}>
                      1,250
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { label: 'Critical', color: '#dc2626' },
                  { label: 'Stable', color: '#f59e0b' },
                  { label: 'Recovered', color: '#059669' },
                  { label: 'Outpatient', color: '#0891b2' }
                ].map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;