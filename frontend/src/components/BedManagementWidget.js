import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  Hotel as BedIcon,
  Person as PersonIcon,
  LocalHospital as NurseIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  MedicalServices as DoctorIcon,
} from '@mui/icons-material';
import { bedsAPI, nursesAPI, patientsAPI, doctorsAPI } from '../services/api';
import { toast } from 'react-toastify';

const BedManagementWidget = () => {
  const [tabValue, setTabValue] = useState(0);
  const [beds, setBeds] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [addBedDialogOpen, setAddBedDialogOpen] = useState(false);
  const [addNurseDialogOpen, setAddNurseDialogOpen] = useState(false);
  const [addDoctorDialogOpen, setAddDoctorDialogOpen] = useState(false);
  const [nurseDialogOpen, setNurseDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New bed form state
  const [newBed, setNewBed] = useState({
    bedNumber: '',
    ward: 'General',
    status: 'Available',
    notes: ''
  });

  // New nurse form state
  const [newNurse, setNewNurse] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ward: 'General',
    shift: 'Morning',
    status: 'Off Duty',
    specialization: '',
    experience: 0,
    workingHours: 8,
    maxPatientLoad: 5
  });

  // New doctor form state
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    experience: 0,
    consultationFee: 100
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchBedData(),
        fetchNurseData(),
        fetchPatients(),
        fetchDoctors()
      ]);
    } catch (err) {
      setError('Failed to load data');
      toast.error('Failed to load bed management data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll({ limit: 1000 });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  };

  const fetchBedData = async () => {
    try {
      const response = await bedsAPI.getAll();
      setBeds(response.data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
      throw error;
    }
  };

  const fetchNurseData = async () => {
    try {
      const response = await nursesAPI.getAll();
      setNurses(response.data.nurses || []);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      throw error;
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getAll({ limit: 1000 });
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  };

  const handleDischarge = async (bedId) => {
    try {
      setLoading(true);
      await bedsAPI.discharge(bedId);
      toast.success('Patient discharged successfully');
      setDetailsOpen(false);
      await fetchBedData();
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBed = async () => {
    if (!selectedPatientId || !selectedBed) {
      toast.error('Please select a patient');
      return;
    }

    try {
      setLoading(true);
      await bedsAPI.assignBed(selectedBed._id, selectedPatientId);
      toast.success('Bed assigned successfully');
      setAssignDialogOpen(false);
      setDetailsOpen(false);
      setSelectedPatientId('');
      await fetchBedData();
    } catch (error) {
      console.error('Error assigning bed:', error);
      toast.error(error.response?.data?.message || 'Failed to assign bed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBed = async () => {
    // Validate bed number
    if (!newBed.bedNumber.trim()) {
      toast.error('Please enter a bed number');
      return;
    }

    try {
      setLoading(true);
      await bedsAPI.create(newBed);
      toast.success('Bed created successfully');
      setAddBedDialogOpen(false);
      // Reset form
      setNewBed({
        bedNumber: '',
        ward: 'General',
        status: 'Available',
        notes: ''
      });
      await fetchBedData();
    } catch (error) {
      console.error('Error creating bed:', error);
      toast.error(error.response?.data?.message || 'Failed to create bed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNurse = async () => {
    // Validate required fields
    if (!newNurse.firstName.trim() || !newNurse.lastName.trim()) {
      toast.error('Please enter first and last name');
      return;
    }
    if (!newNurse.email.trim()) {
      toast.error('Please enter email');
      return;
    }
    if (!newNurse.phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    try {
      setLoading(true);
      await nursesAPI.create(newNurse);
      toast.success('Nurse added successfully');
      setAddNurseDialogOpen(false);
      // Reset form
      setNewNurse({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        ward: 'General',
        shift: 'Morning',
        status: 'Off Duty',
        specialization: '',
        experience: 0,
        workingHours: 8,
        maxPatientLoad: 5
      });
      await fetchNurseData();
    } catch (error) {
      console.error('Error adding nurse:', error);
      toast.error(error.response?.data?.message || 'Failed to add nurse');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async () => {
    // Validate required fields
    if (!newDoctor.firstName.trim() || !newDoctor.lastName.trim()) {
      toast.error('Please enter first and last name');
      return;
    }
    if (!newDoctor.email.trim()) {
      toast.error('Please enter email');
      return;
    }
    if (!newDoctor.phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    if (!newDoctor.specialization.trim()) {
      toast.error('Please enter specialization');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare doctor data with required fields
      const doctorData = {
        ...newDoctor,
        dateOfBirth: new Date('1980-01-01'), // Default date
        gender: 'Male', // Default gender
        medicalLicenseNumber: `LIC-${Date.now()}`, // Auto-generate
        status: 'Active'
      };
      
      await doctorsAPI.create(doctorData);
      toast.success('Doctor added successfully');
      setAddDoctorDialogOpen(false);
      // Reset form
      setNewDoctor({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialization: '',
        experience: 0,
        consultationFee: 100
      });
      await fetchDoctors();
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleNurseClick = (nurse) => {
    setSelectedNurse(nurse);
    // Pre-select already assigned patients
    const assignedIds = nurse.assignedPatients ? nurse.assignedPatients.map(p => p._id) : [];
    setSelectedPatientIds(assignedIds);
    setNurseDialogOpen(true);
  };

  const handleAssignPatientsToNurse = async () => {
    if (!selectedNurse) return;

    try {
      setLoading(true);
      
      // Get current assigned patient IDs
      const currentPatientIds = selectedNurse.assignedPatients 
        ? selectedNurse.assignedPatients.map(p => p._id) 
        : [];
      
      // Find patients to add (in selectedPatientIds but not in currentPatientIds)
      const patientsToAdd = selectedPatientIds.filter(id => !currentPatientIds.includes(id));
      
      // Find patients to remove (in currentPatientIds but not in selectedPatientIds)
      const patientsToRemove = currentPatientIds.filter(id => !selectedPatientIds.includes(id));
      
      // Add new patients
      for (const patientId of patientsToAdd) {
        await nursesAPI.assignPatient(selectedNurse._id, patientId);
      }
      
      // Remove patients
      for (const patientId of patientsToRemove) {
        await nursesAPI.removePatient(selectedNurse._id, patientId);
      }
      
      toast.success('Nurse assignments updated successfully');
      setNurseDialogOpen(false);
      setSelectedNurse(null);
      setSelectedPatientIds([]);
      await fetchNurseData();
    } catch (error) {
      console.error('Error updating nurse assignments:', error);
      toast.error(error.response?.data?.message || 'Failed to update assignments');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientToggle = (patientId) => {
    setSelectedPatientIds(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  const getBedColor = (status) => {
    switch (status) {
      case 'Occupied':
        return '#ef4444'; // Red
      case 'Available':
        return '#10b981'; // Green
      case 'Maintenance':
        return '#f59e0b'; // Orange
      default:
        return '#6b7280'; // Gray
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Critical':
        return 'error';
      case 'Stable':
        return 'success';
      case 'Recovering':
        return 'info';
      default:
        return 'default';
    }
  };

  const getBedStats = (ward) => {
    const wardBeds = beds.filter(b => ward === 'All' || b.ward === ward);
    return {
      total: wardBeds.length,
      occupied: wardBeds.filter(b => b.status === 'Occupied').length,
      available: wardBeds.filter(b => b.status === 'Available').length,
      maintenance: wardBeds.filter(b => b.status === 'Maintenance').length,
    };
  };

  const getNurseStats = (ward) => {
    const wardNurses = nurses.filter(n => ward === 'All' || n.ward === ward);
    return {
      total: wardNurses.length,
      onDuty: wardNurses.filter(n => n.status === 'On Duty').length,
      onBreak: wardNurses.filter(n => n.status === 'On Break').length,
    };
  };

  // Get patients without beds
  const getPatientsWithoutBeds = () => {
    const assignedPatientIds = beds
      .filter(b => b.patient)
      .map(b => b.patient._id || b.patient);
    
    return patients.filter(p => !assignedPatientIds.includes(p._id));
  };

  // Get patients WITH beds (for nurse assignment)
  const getPatientsWithBeds = () => {
    const patientsWithBeds = beds
      .filter(b => b.patient && b.status === 'Occupied')
      .map(b => ({
        ...b.patient,
        bedNumber: b.bedNumber,
        ward: b.ward
      }));
    
    return patientsWithBeds;
  };

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setDetailsOpen(true);
  };

  const BedCard = ({ bed }) => {
    const patientName = bed.patient 
      ? `${bed.patient.firstName} ${bed.patient.lastName}`
      : null;
    
    // Enhanced tooltip content
    const tooltipContent = bed.status === 'Occupied' && bed.patient ? (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {bed.bedNumber} - {bed.ward} Ward
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          👤 Patient: {patientName}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          🆔 ID: {bed.patient.patientId}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          🩸 Blood: {bed.patient.bloodGroup || 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#bbb' }}>
          📅 Admitted: {bed.assignedDate ? new Date(bed.assignedDate).toLocaleDateString() : 'N/A'}
        </Typography>
      </Box>
    ) : (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {bed.bedNumber} - {bed.ward} Ward
        </Typography>
        <Typography variant="body2">
          Status: {bed.status}
        </Typography>
      </Box>
    );
    
    return (
      <Tooltip 
        title={tooltipContent}
        arrow
        placement="top"
      >
        <Card
          onClick={() => handleBedClick(bed)}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: `2px solid ${getBedColor(bed.status)}`,
            backgroundColor: bed.status === 'Occupied' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            },
          }}
        >
          <CardContent sx={{ p: 2, textAlign: 'center' }}>
            <BedIcon 
              sx={{ 
                fontSize: 40, 
                color: getBedColor(bed.status),
                mb: 1 
              }} 
            />
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {bed.bedNumber}
            </Typography>
            <Chip 
              label={bed.status} 
              size="small"
              sx={{ 
                backgroundColor: getBedColor(bed.status),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            />
            {patientName && (
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                {patientName.split(' ')[0]}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Tooltip>
    );
  };

  const NurseCard = ({ nurse }) => {
    const nurseName = `${nurse.firstName} ${nurse.lastName}`;
    const patientCount = nurse.assignedPatients ? nurse.assignedPatients.length : 0;
    
    // Enhanced tooltip for nurse
    const nurseTooltip = (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          👨‍⚕️ {nurseName}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          📧 {nurse.email}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          📞 {nurse.phone}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          🏥 {nurse.ward} Ward • {nurse.shift} Shift
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          💼 {nurse.specialization || 'General Nursing'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          ⏰ {nurse.workingHours || 8}h shift
        </Typography>
        <Typography variant="body2">
          👥 {patientCount}/{nurse.maxPatientLoad || 5} patients
        </Typography>
      </Box>
    );
    
    return (
      <Tooltip title={nurseTooltip} arrow placement="left">
        <Card 
          sx={{ 
            mb: 2,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3,
              backgroundColor: 'rgba(220, 38, 38, 0.02)'
            }
          }}
          onClick={() => handleNurseClick(nurse)}
        >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {nurse.firstName[0]}{nurse.lastName[0]}
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {nurseName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {nurse.ward} Ward • {nurse.shift} Shift
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip 
                label={nurse.status} 
                size="small"
                color={nurse.status === 'On Duty' ? 'success' : 'warning'}
                sx={{ mb: 0.5 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                {patientCount}/{nurse.maxPatientLoad || 5} Patients
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {nurse.workingHours || 8}h shift
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      </Tooltip>
    );
  };

  const currentWard = ['All', 'ICU', 'General', 'Emergency'][tabValue];
  const bedStats = getBedStats(currentWard);
  const nurseStats = getNurseStats(currentWard);
  const filteredBeds = beds.filter(b => currentWard === 'All' || b.ward === currentWard);
  const filteredNurses = nurses.filter(n => currentWard === 'All' || n.ward === currentWard);
  const availablePatients = getPatientsWithoutBeds();

  if (loading && beds.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#dc2626' }}>
          Bed & Nurse Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAllData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddBedDialogOpen(true)}
          >
            Add Bed
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<NurseIcon />}
            onClick={() => setAddNurseDialogOpen(true)}
          >
            Add Nurse
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<DoctorIcon />}
            onClick={() => setAddDoctorDialogOpen(true)}
          >
            Add Doctor
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All Wards" />
        <Tab label="ICU" />
        <Tab label="General" />
        <Tab label="Emergency" />
      </Tabs>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f0f9ff', border: '1px solid #3b82f6' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                {bedStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Beds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
                {bedStats.occupied}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Occupied ({((bedStats.occupied / bedStats.total) * 100).toFixed(0)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                {bedStats.available}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fefce8', border: '1px solid #f59e0b' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {nurseStats.onDuty}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nurses On Duty
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Bed Layout */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Bed Layout - {currentWard} Ward
              </Typography>
              <Grid container spacing={2}>
                {filteredBeds.map((bed) => (
                  <Grid item xs={6} sm={4} md={3} key={bed.id}>
                    <BedCard bed={bed} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Nurses List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Nurses - {currentWard} Ward
              </Typography>
              <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {filteredNurses.map((nurse) => (
                  <NurseCard key={nurse._id} nurse={nurse} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patients Without Beds Section */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
                Patients Without Beds
              </Typography>
              <Chip 
                label={`${getPatientsWithoutBeds().length} patients`} 
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            
            {getPatientsWithoutBeds().length === 0 ? (
              <Alert severity="success">
                All patients have been assigned beds! 🎉
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {getPatientsWithoutBeds().map((patient) => (
                  <Grid item xs={12} sm={6} md={3} key={patient._id}>
                    <Card 
                      sx={{ 
                        border: '2px solid #f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {patient.firstName[0]}{patient.lastName[0]}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {patient.firstName} {patient.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {patient.patientId}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={patient.gender} 
                            size="small" 
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip 
                            label="No Bed" 
                            size="small" 
                            color="warning"
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Bed Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bed Details - {selectedBed?.bedNumber}
        </DialogTitle>
        <DialogContent>
          {selectedBed && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Ward
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedBed.ward}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip 
                      label={selectedBed.status} 
                      size="small"
                      sx={{ 
                        backgroundColor: getBedColor(selectedBed.status),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Grid>
                {selectedBed.patient && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Patient
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedBed.patient.firstName} {selectedBed.patient.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {selectedBed.patient.patientId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Gender
                      </Typography>
                      <Typography variant="body2">
                        {selectedBed.patient.gender}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Date of Birth
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedBed.patient.dateOfBirth).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    {selectedBed.assignedDate && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Assigned Date
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedBed.assignedDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Assigned Doctor
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedBed.patient.assignedDoctor?._id || ''}
                          onChange={async (e) => {
                            try {
                              await patientsAPI.assignDoctor(selectedBed.patient._id, e.target.value);
                              toast.success('Doctor assigned successfully');
                              await fetchBedData();
                              setDetailsOpen(false);
                            } catch (error) {
                              toast.error('Failed to assign doctor');
                            }
                          }}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>No doctor assigned</em>
                          </MenuItem>
                          {doctors.map((doctor) => (
                            <MenuItem key={doctor._id} value={doctor._id}>
                              Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {selectedBed.patient.assignedDoctor && (
                        <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: 'block' }}>
                          Currently: Dr. {selectedBed.patient.assignedDoctor.firstName} {selectedBed.patient.assignedDoctor.lastName}
                        </Typography>
                      )}
                    </Grid>
                  </>
                )}
                {selectedBed.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {selectedBed.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedBed?.status === 'Available' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setAssignDialogOpen(true);
              }}
              disabled={availablePatients.length === 0}
            >
              Assign Patient
            </Button>
          )}
          {selectedBed?.status === 'Occupied' && (
            <Button 
              variant="contained" 
              color="error"
              onClick={() => handleDischarge(selectedBed._id)}
              disabled={loading}
            >
              Discharge Patient
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Assign Patient Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Patient to Bed {selectedBed?.bedNumber}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                label="Select Patient"
              >
                {availablePatients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName} - {patient.patientId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {availablePatients.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No patients available for bed assignment. All patients are already assigned to beds.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAssignDialogOpen(false);
            setSelectedPatientId('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAssignBed}
            disabled={!selectedPatientId || loading}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Bed Dialog */}
      <Dialog open={addBedDialogOpen} onClose={() => setAddBedDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Bed
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Bed Number"
              placeholder="e.g., ICU-107, GEN-209, ER-305"
              value={newBed.bedNumber}
              onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })}
              fullWidth
              required
              helperText="Enter a unique bed number"
            />
            
            <FormControl fullWidth required>
              <InputLabel>Ward</InputLabel>
              <Select
                value={newBed.ward}
                onChange={(e) => setNewBed({ ...newBed, ward: e.target.value })}
                label="Ward"
              >
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Pediatric">Pediatric</MenuItem>
                <MenuItem value="Maternity">Maternity</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={newBed.status}
                onChange={(e) => setNewBed({ ...newBed, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notes (Optional)"
              placeholder="Any additional information about this bed"
              value={newBed.notes}
              onChange={(e) => setNewBed({ ...newBed, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddBedDialogOpen(false);
            setNewBed({
              bedNumber: '',
              ward: 'General',
              status: 'Available',
              notes: ''
            });
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddBed}
            disabled={!newBed.bedNumber.trim() || loading}
          >
            Add Bed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nurse Assignment Dialog */}
      <Dialog open={nurseDialogOpen} onClose={() => setNurseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Assign Patients to {selectedNurse?.firstName} {selectedNurse?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Only patients with assigned beds in the <strong>{selectedNurse?.ward}</strong> ward are shown.
            </Alert>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select patients to assign to this nurse. Click on patients to toggle selection.
            </Typography>
            
            {(() => {
              const patientsWithBeds = getPatientsWithBeds();
              const wardPatients = patientsWithBeds.filter(p => p.ward === selectedNurse?.ward);
              
              if (wardPatients.length === 0) {
                return (
                  <Alert severity="warning">
                    No patients with beds found in the {selectedNurse?.ward} ward.
                  </Alert>
                );
              }
              
              return (
                <Grid container spacing={2}>
                  {wardPatients.map((patient) => {
                    const isSelected = selectedPatientIds.includes(patient._id);
                    const patientName = `${patient.firstName} ${patient.lastName}`;
                    
                    return (
                      <Grid item xs={12} sm={6} key={patient._id}>
                        <Card
                          onClick={() => handlePatientToggle(patient._id)}
                          sx={{
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #dc2626' : '1px solid #e5e7eb',
                            backgroundColor: isSelected ? 'rgba(220, 38, 38, 0.05)' : 'white',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 2,
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  backgroundColor: isSelected ? '#dc2626' : '#6b7280',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {patient.firstName[0]}{patient.lastName[0]}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {patientName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {patient.patientId} • {patient.gender}
                                </Typography>
                                <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 600 }}>
                                  🛏️ Bed: {patient.bedNumber}
                                </Typography>
                              </Box>
                              {isSelected && (
                                <Chip 
                                  label="Selected" 
                                  size="small" 
                                  color="error"
                                  sx={{ fontWeight: 600 }}
                                />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                  })}
                </Grid>
              );
            })()}
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f9fafb', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPatientIds.length} patient(s) selected from {selectedNurse?.ward} ward
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNurseDialogOpen(false);
            setSelectedNurse(null);
            setSelectedPatientIds([]);
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAssignPatientsToNurse}
            disabled={loading}
          >
            Update Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Nurse Dialog */}
      <Dialog open={addNurseDialogOpen} onClose={() => setAddNurseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add New Nurse
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  value={newNurse.firstName}
                  onChange={(e) => setNewNurse({ ...newNurse, firstName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  value={newNurse.lastName}
                  onChange={(e) => setNewNurse({ ...newNurse, lastName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={newNurse.email}
                  onChange={(e) => setNewNurse({ ...newNurse, email: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={newNurse.phone}
                  onChange={(e) => setNewNurse({ ...newNurse, phone: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Ward</InputLabel>
                  <Select
                    value={newNurse.ward}
                    onChange={(e) => setNewNurse({ ...newNurse, ward: e.target.value })}
                    label="Ward"
                  >
                    <MenuItem value="ICU">ICU</MenuItem>
                    <MenuItem value="General">General</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Pediatric">Pediatric</MenuItem>
                    <MenuItem value="Maternity">Maternity</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={newNurse.shift}
                    onChange={(e) => setNewNurse({ ...newNurse, shift: e.target.value })}
                    label="Shift"
                  >
                    <MenuItem value="Morning">Morning</MenuItem>
                    <MenuItem value="Evening">Evening</MenuItem>
                    <MenuItem value="Night">Night</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newNurse.status}
                    onChange={(e) => setNewNurse({ ...newNurse, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="On Duty">On Duty</MenuItem>
                    <MenuItem value="On Break">On Break</MenuItem>
                    <MenuItem value="Off Duty">Off Duty</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Specialization"
                  value={newNurse.specialization}
                  onChange={(e) => setNewNurse({ ...newNurse, specialization: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={newNurse.experience}
                  onChange={(e) => setNewNurse({ ...newNurse, experience: parseInt(e.target.value) || 0 })}
                  fullWidth
                  inputProps={{ min: 0, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Working Hours"
                  type="number"
                  value={newNurse.workingHours}
                  onChange={(e) => setNewNurse({ ...newNurse, workingHours: parseInt(e.target.value) || 8 })}
                  fullWidth
                  inputProps={{ min: 1, max: 24 }}
                  helperText="Hours per shift"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Max Patient Load"
                  type="number"
                  value={newNurse.maxPatientLoad}
                  onChange={(e) => setNewNurse({ ...newNurse, maxPatientLoad: parseInt(e.target.value) || 5 })}
                  fullWidth
                  inputProps={{ min: 1, max: 20 }}
                  helperText="Max patients"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddNurseDialogOpen(false);
            setNewNurse({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              ward: 'General',
              shift: 'Morning',
              status: 'Off Duty',
              specialization: '',
              experience: 0,
              workingHours: 8,
              maxPatientLoad: 5
            });
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddNurse}
            disabled={!newNurse.firstName.trim() || !newNurse.lastName.trim() || !newNurse.email.trim() || !newNurse.phone.trim() || loading}
          >
            Add Nurse
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog open={addDoctorDialogOpen} onClose={() => setAddDoctorDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Doctor
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  value={newDoctor.firstName}
                  onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  value={newDoctor.lastName}
                  onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Specialization"
                  value={newDoctor.specialization}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                  fullWidth
                  required
                  placeholder="e.g., Cardiology, Pediatrics, Orthopedics"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={newDoctor.experience}
                  onChange={(e) => setNewDoctor({ ...newDoctor, experience: parseInt(e.target.value) || 0 })}
                  fullWidth
                  inputProps={{ min: 0, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Consultation Fee ($)"
                  type="number"
                  value={newDoctor.consultationFee}
                  onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: parseInt(e.target.value) || 100 })}
                  fullWidth
                  inputProps={{ min: 0, max: 1000 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDoctorDialogOpen(false);
            setNewDoctor({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              specialization: '',
              experience: 0,
              consultationFee: 100
            });
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddDoctor}
            disabled={!newDoctor.firstName.trim() || !newDoctor.lastName.trim() || !newDoctor.email.trim() || !newDoctor.phone.trim() || !newDoctor.specialization.trim() || loading}
          >
            Add Doctor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BedManagementWidget;
