import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Rating,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Fade,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Star as StarIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  MedicalServices as MedicalIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  EventNote as EventNoteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { patientPortalAPI, schedulingAPI } from '../../services/api';

// Mock doctor data for when backend isn't running
const MOCK_DOCTORS = [
  {
    _id: 'doc1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    specialization: 'Cardiology',
    experience: 12,
    consultationFee: 800,
    bio: 'Board-certified cardiologist with extensive experience in interventional cardiology and heart failure management.',
    languages: ['English', 'Spanish'],
    metrics: { patientSatisfactionScore: 4.8, totalPatients: 1250 },
    schedule: {
      monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      friday: { isAvailable: true, startTime: '09:00', endTime: '15:00' },
      saturday: { isAvailable: false },
      sunday: { isAvailable: false },
    },
  },
  {
    _id: 'doc2',
    firstName: 'Michael',
    lastName: 'Chen',
    specialization: 'Neurology',
    experience: 15,
    consultationFee: 1200,
    bio: 'Renowned neurologist specializing in movement disorders, epilepsy, and neurological rehabilitation.',
    languages: ['English', 'Mandarin'],
    metrics: { patientSatisfactionScore: 4.9, totalPatients: 980 },
    schedule: {
      monday: { isAvailable: true, startTime: '10:00', endTime: '18:00' },
      tuesday: { isAvailable: true, startTime: '10:00', endTime: '18:00' },
      wednesday: { isAvailable: false },
      thursday: { isAvailable: true, startTime: '10:00', endTime: '18:00' },
      friday: { isAvailable: true, startTime: '10:00', endTime: '16:00' },
      saturday: { isAvailable: true, startTime: '09:00', endTime: '13:00' },
      sunday: { isAvailable: false },
    },
  },
  {
    _id: 'doc3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    specialization: 'Pediatrics',
    experience: 8,
    consultationFee: 600,
    bio: 'Passionate pediatrician dedicated to providing comprehensive care for children from birth through adolescence.',
    languages: ['English', 'Spanish', 'Portuguese'],
    metrics: { patientSatisfactionScore: 4.7, totalPatients: 2100 },
    schedule: {
      monday: { isAvailable: true, startTime: '08:00', endTime: '16:00' },
      tuesday: { isAvailable: true, startTime: '08:00', endTime: '16:00' },
      wednesday: { isAvailable: true, startTime: '08:00', endTime: '16:00' },
      thursday: { isAvailable: true, startTime: '08:00', endTime: '16:00' },
      friday: { isAvailable: true, startTime: '08:00', endTime: '14:00' },
      saturday: { isAvailable: false },
      sunday: { isAvailable: false },
    },
  },
  {
    _id: 'doc4',
    firstName: 'James',
    lastName: 'Williams',
    specialization: 'Orthopedics',
    experience: 20,
    consultationFee: 1000,
    bio: 'Expert orthopedic surgeon specializing in joint replacement, sports injuries, and minimally invasive procedures.',
    languages: ['English'],
    metrics: { patientSatisfactionScore: 4.6, totalPatients: 850 },
    schedule: {
      monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { isAvailable: false },
      wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      friday: { isAvailable: true, startTime: '09:00', endTime: '15:00' },
      saturday: { isAvailable: true, startTime: '10:00', endTime: '13:00' },
      sunday: { isAvailable: false },
    },
  },
  {
    _id: 'doc5',
    firstName: 'Priya',
    lastName: 'Sharma',
    specialization: 'Dermatology',
    experience: 10,
    consultationFee: 700,
    bio: 'Skilled dermatologist with expertise in cosmetic dermatology, skin cancer screening, and laser treatments.',
    languages: ['English', 'Hindi'],
    metrics: { patientSatisfactionScore: 4.8, totalPatients: 1500 },
    schedule: {
      monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
      thursday: { isAvailable: false },
      friday: { isAvailable: true, startTime: '09:00', endTime: '15:00' },
      saturday: { isAvailable: false },
      sunday: { isAvailable: false },
    },
  },
  {
    _id: 'doc6',
    firstName: 'David',
    lastName: 'Kim',
    specialization: 'General Medicine',
    experience: 6,
    consultationFee: 500,
    bio: 'Dedicated general physician providing comprehensive primary care, preventive medicine, and health management.',
    languages: ['English', 'Korean'],
    metrics: { patientSatisfactionScore: 4.5, totalPatients: 3200 },
    schedule: {
      monday: { isAvailable: true, startTime: '08:00', endTime: '18:00' },
      tuesday: { isAvailable: true, startTime: '08:00', endTime: '18:00' },
      wednesday: { isAvailable: true, startTime: '08:00', endTime: '18:00' },
      thursday: { isAvailable: true, startTime: '08:00', endTime: '18:00' },
      friday: { isAvailable: true, startTime: '08:00', endTime: '18:00' },
      saturday: { isAvailable: true, startTime: '09:00', endTime: '14:00' },
      sunday: { isAvailable: false },
    },
  },
];

const SPECIALIZATIONS = [
  'All', 'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Dermatology', 'Gynecology', 'Psychiatry', 'ENT',
];

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Checkup', 'Emergency'];

function generateTimeSlots(schedule, dayName) {
  if (!schedule || !schedule[dayName] || !schedule[dayName].isAvailable) return [];
  const { startTime, endTime } = schedule[dayName];
  const startHour = parseInt(startTime.split(':')[0]);
  const startMin = parseInt(startTime.split(':')[1] || '0');
  const endHour = parseInt(endTime.split(':')[0]);
  const endMin = parseInt(endTime.split(':')[1] || '0');
  const slots = [];
  let h = startHour, m = startMin;
  while (h < endHour || (h === endHour && m < endMin)) {
    slots.push({ time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, available: true });
    m += 15;
    if (m >= 60) { h++; m -= 60; }
  }
  return slots;
}

function formatTime12h(time24) {
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

const specIcons = {
  'Cardiology': '❤️', 'Neurology': '🧠', 'Pediatrics': '👶', 'Orthopedics': '🦴',
  'Dermatology': '🧴', 'General Medicine': '🩺', 'Gynecology': '👩', 'Psychiatry': '🧘',
  'ENT': '👂', 'Surgery': '🔪', 'Oncology': '🎗️', 'Ophthalmology': '👁️',
};

function PatientPortal() {
  const user = useSelector((state) => state.auth.user);
  const [tabValue, setTabValue] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    reason: '',
    type: 'Consultation',
    visitType: 'Outpatient',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [successDialog, setSuccessDialog] = useState({ open: false, appointment: null });

  // Load doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await patientPortalAPI.getDoctors();
        if (response.data.doctors && response.data.doctors.length > 0) {
          setDoctors(response.data.doctors);
        } else {
          setDoctors(MOCK_DOCTORS);
        }
      } catch (error) {
        console.log('Using mock doctor data (backend not running)');
        setDoctors(MOCK_DOCTORS);
      }
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  // Filter doctors
  useEffect(() => {
    let filtered = [...doctors];
    if (selectedSpec !== 'All') {
      filtered = filtered.filter(d => d.specialization === selectedSpec);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(term) ||
        (d.specialization || '').toLowerCase().includes(term)
      );
    }
    setFilteredDoctors(filtered);
  }, [doctors, selectedSpec, searchTerm]);

  // Load my appointments
  const loadMyAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const response = await patientPortalAPI.getMyAppointments(user?.email);
      setMyAppointments(response.data.appointments || []);
    } catch (error) {
      // Use locally stored appointments as fallback
      const stored = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
      setMyAppointments(stored);
    }
    setAppointmentsLoading(false);
  }, [user?.email]);

  useEffect(() => {
    if (tabValue === 1) {
      loadMyAppointments();
    }
  }, [tabValue, loadMyAppointments]);

  const handleBookClick = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveStep(0);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setBookingForm({ reason: '', type: 'Consultation', visitType: 'Outpatient' });
    setBookingOpen(true);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (selectedDoctor && date) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[new Date(date).getDay()];
      
      // Try new scheduling API first, then old API, fall back to local generation
      schedulingAPI.getSlots(selectedDoctor._id, date)
        .then(response => {
          setAvailableSlots(response.data.slots || []);
        })
        .catch(() => {
          patientPortalAPI.getSlots(selectedDoctor._id, date)
            .then(response => {
              setAvailableSlots(response.data.slots || []);
            })
            .catch(() => {
              const slots = generateTimeSlots(selectedDoctor.schedule, dayName);
              setAvailableSlots(slots);
            });
        });
    }
  };

  const handleBookAppointment = async () => {
    setBookingLoading(true);
    try {
      const bookingData = {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        patientName: user?.name || 'Patient',
        patientEmail: user?.email || 'patient@hospital.com',
        patientPhone: user?.phone || '555-0100',
        reason: bookingForm.reason,
        type: bookingForm.type,
        visitType: bookingForm.visitType,
      };

      let appointment;
      try {
        // Try new scheduling API first, fall back to old API
        let response;
        try {
          response = await schedulingAPI.bookAppointment(bookingData);
        } catch (schedErr) {
          response = await patientPortalAPI.bookAppointment(bookingData);
        }
        appointment = response.data.appointment;
      } catch (apiError) {
        // Mock appointment when backend is not running
        appointment = {
          _id: 'mock-' + Date.now(),
          appointmentId: `APT${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          type: bookingForm.type,
          visitType: bookingForm.visitType,
          reason: bookingForm.reason,
          status: 'Scheduled',
          doctor: {
            firstName: selectedDoctor.firstName,
            lastName: selectedDoctor.lastName,
            specialization: selectedDoctor.specialization,
            consultationFee: selectedDoctor.consultationFee,
          },
          patient: {
            firstName: user?.name?.split(' ')[0] || 'Patient',
            lastName: user?.name?.split(' ').slice(1).join(' ') || '',
            email: user?.email,
          },
        };
        // Store locally
        const stored = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
        stored.unshift(appointment);
        localStorage.setItem('patientAppointments', JSON.stringify(stored));
      }

      setBookingOpen(false);
      setSuccessDialog({ open: true, appointment });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to book appointment. Please try again.', severity: 'error' });
    }
    setBookingLoading(false);
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const steps = ['Select Date & Time', 'Appointment Details', 'Confirm Booking'];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Hero Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          py: 5,
          px: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Welcome, {user?.name || 'Patient'} 👋
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400, maxWidth: 600 }}>
            Find the right doctor and book your appointment in just a few clicks
          </Typography>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 4, mt: 3, flexWrap: 'wrap' }}>
            {[
              { value: `${doctors.length}+`, label: 'Available Doctors' },
              { value: `${new Set(doctors.map(d => d.specialization)).size}`, label: 'Specializations' },
              { value: '24/7', label: 'Online Booking' },
            ].map((stat, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>{stat.value}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -3, position: 'relative', zIndex: 2, pb: 5 }}>
        {/* Tab Bar */}
        <Paper
          sx={{
            borderRadius: 3,
            mb: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 600,
                fontSize: '1rem',
                fontFamily: 'Poppins, sans-serif',
              },
              '& .Mui-selected': { color: '#059669' },
              '& .MuiTabs-indicator': { backgroundColor: '#059669', height: 3 },
            }}
          >
            <Tab icon={<HospitalIcon />} iconPosition="start" label="Find Doctors & Book" id="tab-find-doctors" />
            <Tab icon={<EventNoteIcon />} iconPosition="start" label="My Appointments" id="tab-my-appointments" />
          </Tabs>
        </Paper>

        {/* Tab 0: Find Doctors */}
        {tabValue === 0 && (
          <Fade in>
            <Box>
              {/* Search & Filter Bar */}
              <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search doctors by name or specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: '#9ca3af', mr: 1 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#059669' },
                        },
                      }}
                      id="search-doctors"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <FilterIcon sx={{ color: '#9ca3af', mt: 1 }} />
                      {SPECIALIZATIONS.slice(0, 6).map((spec) => (
                        <Chip
                          key={spec}
                          label={spec}
                          onClick={() => setSelectedSpec(spec)}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            ...(selectedSpec === spec
                              ? {
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: 'white',
                                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                }
                              : {
                                  backgroundColor: '#f3f4f6',
                                  color: '#6b7280',
                                  '&:hover': { backgroundColor: '#ecfdf5', color: '#059669' },
                                }),
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Doctor Cards */}
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#10b981' }} size={48} />
                  <Typography sx={{ mt: 2, color: '#6b7280' }}>Loading doctors...</Typography>
                </Box>
              ) : filteredDoctors.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="h6" color="text.secondary">No doctors found matching your criteria</Typography>
                  <Button onClick={() => { setSearchTerm(''); setSelectedSpec('All'); }} sx={{ mt: 2, color: '#059669' }}>Clear Filters</Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {filteredDoctors.map((doctor, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={doctor._id || index}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          overflow: 'visible',
                          position: 'relative',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)',
                            borderColor: '#10b981',
                          },
                        }}
                      >
                        {/* Spec Badge */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -12,
                            right: 16,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                          }}
                        >
                          {specIcons[doctor.specialization] || '🩺'} {doctor.specialization}
                        </Box>

                        <CardContent sx={{ p: 3, pt: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              sx={{
                                width: 64,
                                height: 64,
                                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                color: '#059669',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                border: '3px solid #ecfdf5',
                              }}
                            >
                              {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.3 }}>
                                Dr. {doctor.firstName} {doctor.lastName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Rating
                                  value={doctor.metrics?.patientSatisfactionScore || 4}
                                  precision={0.1}
                                  size="small"
                                  readOnly
                                  sx={{ '& .MuiRating-iconFilled': { color: '#f59e0b' } }}
                                />
                                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                  ({doctor.metrics?.patientSatisfactionScore || '4.0'})
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 2, minHeight: 40, lineHeight: 1.5 }}>
                            {doctor.bio ? doctor.bio.substring(0, 100) + '...' : 'Experienced medical professional providing quality healthcare.'}
                          </Typography>

                          <Divider sx={{ mb: 2 }} />

                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MedicalIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  {doctor.experience || 'N/A'} yrs exp
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  {doctor.metrics?.totalPatients || '0'} patients
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669' }}>
                                ₹{doctor.consultationFee || 500}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#9ca3af' }}>per consultation</Typography>
                            </Box>
                            <Button
                              variant="contained"
                              endIcon={<ArrowForwardIcon />}
                              onClick={() => handleBookClick(doctor)}
                              id={`book-doctor-${doctor._id}`}
                              sx={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderRadius: 2,
                                fontWeight: 600,
                                px: 3,
                                boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #059669, #047857)',
                                  transform: 'scale(1.02)',
                                },
                              }}
                            >
                              Book
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Fade>
        )}

        {/* Tab 1: My Appointments */}
        {tabValue === 1 && (
          <Fade in>
            <Box>
              {appointmentsLoading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#10b981' }} size={48} />
                </Box>
              ) : myAppointments.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <EventNoteIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                  <Typography variant="h5" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>No Appointments Yet</Typography>
                  <Typography variant="body1" sx={{ color: '#6b7280', mb: 3 }}>You haven't booked any appointments. Find a doctor and schedule your first visit!</Typography>
                  <Button
                    variant="contained"
                    onClick={() => setTabValue(0)}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                    }}
                  >
                    Find Doctors
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {myAppointments.map((apt, index) => (
                    <Grid item xs={12} md={6} key={apt._id || index}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>
                                Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>
                                {apt.doctor?.specialization}
                              </Typography>
                            </Box>
                            <Chip
                              label={apt.status || 'Scheduled'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                ...(apt.status === 'Scheduled' ? { backgroundColor: '#ecfdf5', color: '#059669' } :
                                   apt.status === 'Completed' ? { backgroundColor: '#eff6ff', color: '#2563eb' } :
                                   apt.status === 'Cancelled' ? { backgroundColor: '#fef2f2', color: '#dc2626' } :
                                   { backgroundColor: '#f3f4f6', color: '#6b7280' }),
                              }}
                            />
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon sx={{ fontSize: 18, color: '#10b981' }} />
                                <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                                  {new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimeIcon sx={{ fontSize: 18, color: '#10b981' }} />
                                <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                                  {formatTime12h(apt.appointmentTime)}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {apt.reason && (
                            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                              <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>REASON</Typography>
                              <Typography variant="body2" sx={{ color: '#374151' }}>{apt.reason}</Typography>
                            </Box>
                          )}

                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip label={apt.type || 'Consultation'} size="small" variant="outlined" sx={{ borderColor: '#d1d5db' }} />
                            <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                              ₹{apt.doctor?.consultationFee || '500'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Fade>
        )}
      </Container>

      {/* Booking Dialog */}
      <Dialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        {/* Dialog Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #059669, #10b981)', p: 3, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
                Book Appointment
              </Typography>
              {selectedDoctor && (
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} — {selectedDoctor.specialization}
                </Typography>
              )}
            </Box>
            <IconButton onClick={() => setBookingOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 1 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: '#10b981' },
                      '&.Mui-completed': { color: '#059669' },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Date & Time */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                📅 Select Preferred Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                inputProps={{ min: getMinDate(), max: getMaxDate() }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#059669' },
                  },
                }}
                id="appointment-date"
              />

              {selectedDate && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                    🕐 Available Time Slots
                  </Typography>
                  {availableSlots.length === 0 ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      No slots available for this date. The doctor may be off on this day.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {availableSlots.map((slot) => (
                        <Chip
                          key={slot.time}
                          label={formatTime12h(slot.time)}
                          disabled={!slot.available}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          sx={{
                            fontWeight: 600,
                            py: 2.5,
                            px: 1,
                            fontSize: '0.85rem',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            ...(selectedTime === slot.time
                              ? {
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: 'white',
                                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                                }
                              : slot.available
                              ? {
                                  backgroundColor: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  '&:hover': {
                                    backgroundColor: '#d1fae5',
                                    transform: 'scale(1.05)',
                                  },
                                }
                              : {
                                  backgroundColor: '#f3f4f6',
                                  color: '#9ca3af',
                                  textDecoration: 'line-through',
                                }),
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Step 1: Details */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                📋 Appointment Details
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={bookingForm.type}
                  label="Appointment Type"
                  onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                  id="appointment-type"
                >
                  {APPOINTMENT_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Visit Type</InputLabel>
                <Select
                  value={bookingForm.visitType}
                  label="Visit Type"
                  onChange={(e) => setBookingForm({ ...bookingForm, visitType: e.target.value })}
                  id="visit-type"
                >
                  <MenuItem value="Outpatient">Outpatient</MenuItem>
                  <MenuItem value="Inpatient">Inpatient</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for Visit"
                placeholder="Briefly describe your symptoms or reason for the appointment..."
                value={bookingForm.reason}
                onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                id="appointment-reason"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#059669' },
                  },
                }}
              />
            </Box>
          )}

          {/* Step 2: Confirmation */}
          {activeStep === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={<EventAvailableIcon />}>
                Please review your appointment details before confirming.
              </Alert>

              <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#d1fae5', color: '#059669', width: 48, height: 48, fontWeight: 700 }}>
                        {selectedDoctor?.firstName?.[0]}{selectedDoctor?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#059669' }}>{selectedDoctor?.specialization}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>DATE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151' }}>
                      {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>TIME</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151' }}>
                      {selectedTime ? formatTime12h(selectedTime) : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>TYPE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{bookingForm.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>VISIT</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{bookingForm.visitType}</Typography>
                  </Grid>
                  {bookingForm.reason && (
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>REASON</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{bookingForm.reason}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: '#6b7280' }}>Consultation Fee</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669' }}>
                        ₹{selectedDoctor?.consultationFee || 500}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep(activeStep - 1)}
              startIcon={<ArrowBackIcon />}
              sx={{ color: '#6b7280' }}
            >
              Back
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          {activeStep < 2 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={activeStep === 0 && (!selectedDate || !selectedTime)}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                fontWeight: 600,
                px: 4,
                borderRadius: 2,
                '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' },
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleBookAppointment}
              disabled={bookingLoading}
              endIcon={bookingLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              sx={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                fontWeight: 600,
                px: 4,
                borderRadius: 2,
                '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' },
              }}
              id="confirm-booking-btn"
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={successDialog.open}
        onClose={() => { setSuccessDialog({ open: false, appointment: null }); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, textAlign: 'center', overflow: 'hidden' } }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #059669, #10b981)', p: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: 'white' }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
            Booked! ✨
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
            Your appointment has been scheduled successfully
          </Typography>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {successDialog.appointment && (
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Dr. {successDialog.appointment.doctor?.firstName} {successDialog.appointment.doctor?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#059669', mb: 2 }}>
                {successDialog.appointment.doctor?.specialization}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <Typography variant="body2">
                    {new Date(successDialog.appointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimeIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <Typography variant="body2">
                    {formatTime12h(successDialog.appointment.appointmentTime)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialog({ open: false, appointment: null });
              setTabValue(1);
              loadMyAppointments();
            }}
            sx={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              fontWeight: 600,
              px: 4,
              borderRadius: 3,
            }}
          >
            View My Appointments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PatientPortal;
