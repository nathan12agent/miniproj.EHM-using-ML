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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Psychology as MLIcon,
  AccountCircle as LoginIcon,
  Security as SecurityIcon,
  LocalHospital as DoctorIcon,
  Assessment as PredictionIcon,
} from '@mui/icons-material';

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [createLoginOpen, setCreateLoginOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    licenseNumber: '',
    department: '',
    status: 'Active',
  });
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: '',
    role: 'doctor',
    mlAccess: true,
  });

  useEffect(() => {
    // Mock data for doctors
    setDoctors([
      {
        id: 1,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@hospital.com',
        phone: '+1-555-0101',
        specialization: 'Cardiology',
        experience: 12,
        licenseNumber: 'MD12345',
        department: 'Cardiology',
        status: 'Active',
        hasLogin: true,
        mlAccess: true,
        lastLogin: '2024-01-20 09:30',
      },
      {
        id: 2,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@hospital.com',
        phone: '+1-555-0102',
        specialization: 'Neurology',
        experience: 8,
        licenseNumber: 'MD12346',
        department: 'Neurology',
        status: 'Active',
        hasLogin: false,
        mlAccess: false,
        lastLogin: null,
      },
      {
        id: 3,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@hospital.com',
        phone: '+1-555-0103',
        specialization: 'Pediatrics',
        experience: 15,
        licenseNumber: 'MD12347',
        department: 'Pediatrics',
        status: 'Active',
        hasLogin: true,
        mlAccess: true,
        lastLogin: '2024-01-19 14:22',
      },
      {
        id: 4,
        firstName: 'David',
        lastName: 'Thompson',
        email: 'david.thompson@hospital.com',
        phone: '+1-555-0104',
        specialization: 'Emergency Medicine',
        experience: 6,
        licenseNumber: 'MD12348',
        department: 'Emergency',
        status: 'On Leave',
        hasLogin: true,
        mlAccess: false,
        lastLogin: '2024-01-15 08:45',
      },
    ]);
  }, []);

  const handleAddDoctor = () => {
    const doctorWithId = {
      ...newDoctor,
      id: doctors.length + 1,
      hasLogin: false,
      mlAccess: false,
      lastLogin: null,
    };
    setDoctors([...doctors, doctorWithId]);
    setNewDoctor({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: '',
      experience: '',
      licenseNumber: '',
      department: '',
      status: 'Active',
    });
    setAddDoctorOpen(false);
  };

  const handleCreateLogin = () => {
    if (selectedDoctor) {
      const updatedDoctors = doctors.map(doctor =>
        doctor.id === selectedDoctor.id
          ? {
              ...doctor,
              hasLogin: true,
              mlAccess: loginCredentials.mlAccess,
              username: loginCredentials.username,
            }
          : doctor
      );
      setDoctors(updatedDoctors);
      setCreateLoginOpen(false);
      setLoginCredentials({
        username: '',
        password: '',
        role: 'doctor',
        mlAccess: true,
      });
    }
  };

  const handleToggleMLAccess = (doctorId) => {
    const updatedDoctors = doctors.map(doctor =>
      doctor.id === doctorId
        ? { ...doctor, mlAccess: !doctor.mlAccess }
        : doctor
    );
    setDoctors(updatedDoctors);
  };

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'On Leave':
        return 'warning';
      case 'Inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
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
              Doctor Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage medical staff, create logins, and configure ML access
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDoctorOpen(true)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}
          >
            Add New Doctor
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#dc2626',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <DoctorIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {doctors.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Doctors
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#059669',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <LoginIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {doctors.filter(d => d.hasLogin).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                With Login Access
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#0891b2',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <MLIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {doctors.filter(d => d.mlAccess).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ML Access Enabled
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <PredictionIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {doctors.filter(d => d.status === 'Active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Doctors
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search doctors by name, specialization, or email..."
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

      {/* Tabs for different views */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ px: 3 }}
          >
            <Tab label="All Doctors" />
            <Tab label="Login Management" />
            <Tab label="ML Access Control" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Experience</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Login</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ML Access</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              backgroundColor: '#dc2626',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {doctor.firstName[0]}{doctor.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Dr. {doctor.firstName} {doctor.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doctor.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{doctor.specialization}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{doctor.phone}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          License: {doctor.licenseNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{doctor.experience} years</TableCell>
                      <TableCell>
                        <Chip
                          label={doctor.status}
                          color={getStatusColor(doctor.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doctor.hasLogin ? 'Enabled' : 'Disabled'}
                          color={doctor.hasLogin ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doctor.mlAccess ? 'Enabled' : 'Disabled'}
                          color={doctor.mlAccess ? 'info' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!doctor.hasLogin && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setLoginCredentials({
                                  ...loginCredentials,
                                  username: `${doctor.firstName.toLowerCase()}.${doctor.lastName.toLowerCase()}`,
                                });
                                setCreateLoginOpen(true);
                              }}
                            >
                              <LoginIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleToggleMLAccess(doctor.id)}
                          >
                            <MLIcon />
                          </IconButton>
                          <IconButton size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Doctor Login Management
              </Typography>
              <Grid container spacing={3}>
                {doctors.map((doctor) => (
                  <Grid item xs={12} md={6} key={doctor.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ backgroundColor: '#dc2626' }}>
                            {doctor.firstName[0]}{doctor.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doctor.specialization}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">Login Access:</Typography>
                          <Chip
                            label={doctor.hasLogin ? 'Enabled' : 'Disabled'}
                            color={doctor.hasLogin ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        
                        {doctor.hasLogin && (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2">Username:</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {doctor.username || `${doctor.firstName.toLowerCase()}.${doctor.lastName.toLowerCase()}`}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2">Last Login:</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {doctor.lastLogin || 'Never'}
                              </Typography>
                            </Box>
                          </>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!doctor.hasLogin ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<LoginIcon />}
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setLoginCredentials({
                                  ...loginCredentials,
                                  username: `${doctor.firstName.toLowerCase()}.${doctor.lastName.toLowerCase()}`,
                                });
                                setCreateLoginOpen(true);
                              }}
                            >
                              Create Login
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<SecurityIcon />}
                            >
                              Reset Password
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Machine Learning Access Control
              </Typography>
              <Grid container spacing={3}>
                {doctors.filter(d => d.hasLogin).map((doctor) => (
                  <Grid item xs={12} md={6} key={doctor.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ backgroundColor: '#0891b2' }}>
                            <MLIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doctor.specialization}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={doctor.mlAccess}
                              onChange={() => handleToggleMLAccess(doctor.id)}
                              color="primary"
                            />
                          }
                          label="ML Prediction Access"
                        />
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {doctor.mlAccess 
                            ? 'Doctor can access AI-powered disease prediction tools'
                            : 'Doctor cannot access ML prediction features'
                          }
                        </Typography>
                        
                        {doctor.mlAccess && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f9ff', borderRadius: 1 }}>
                            <Typography variant="caption" color="primary">
                              ✓ Disease Prediction Access
                            </Typography>
                            <br />
                            <Typography variant="caption" color="primary">
                              ✓ Symptom Analysis Tools
                            </Typography>
                            <br />
                            <Typography variant="caption" color="primary">
                              ✓ Risk Assessment Features
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Card>

      {/* Add Doctor Dialog */}
      <Dialog open={addDoctorOpen} onClose={() => setAddDoctorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Doctor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newDoctor.firstName}
                onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newDoctor.lastName}
                onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={newDoctor.specialization}
                  label="Specialization"
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                >
                  <MenuItem value="Cardiology">Cardiology</MenuItem>
                  <MenuItem value="Neurology">Neurology</MenuItem>
                  <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                  <MenuItem value="Emergency Medicine">Emergency Medicine</MenuItem>
                  <MenuItem value="Internal Medicine">Internal Medicine</MenuItem>
                  <MenuItem value="Surgery">Surgery</MenuItem>
                  <MenuItem value="Radiology">Radiology</MenuItem>
                  <MenuItem value="Psychiatry">Psychiatry</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Experience (years)"
                type="number"
                value={newDoctor.experience}
                onChange={(e) => setNewDoctor({ ...newDoctor, experience: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Number"
                value={newDoctor.licenseNumber}
                onChange={(e) => setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newDoctor.department}
                  label="Department"
                  onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                >
                  <MenuItem value="Cardiology">Cardiology</MenuItem>
                  <MenuItem value="Neurology">Neurology</MenuItem>
                  <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                  <MenuItem value="Internal Medicine">Internal Medicine</MenuItem>
                  <MenuItem value="Surgery">Surgery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDoctorOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddDoctor} 
            variant="contained"
            disabled={!newDoctor.firstName || !newDoctor.lastName || !newDoctor.email}
          >
            Add Doctor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Login Dialog */}
      <Dialog open={createLoginOpen} onClose={() => setCreateLoginOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Login for Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={loginCredentials.username}
              onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginCredentials.password}
              onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={loginCredentials.role}
                label="Role"
                onChange={(e) => setLoginCredentials({ ...loginCredentials, role: e.target.value })}
              >
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="senior_doctor">Senior Doctor</MenuItem>
                <MenuItem value="department_head">Department Head</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={loginCredentials.mlAccess}
                  onChange={(e) => setLoginCredentials({ ...loginCredentials, mlAccess: e.target.checked })}
                />
              }
              label="Enable ML Prediction Access"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ML access allows the doctor to use AI-powered disease prediction and diagnostic tools.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateLoginOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateLogin} 
            variant="contained"
            disabled={!loginCredentials.username || !loginCredentials.password}
          >
            Create Login
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default Doctors;