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
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  LocalHospital as SpecializationIcon,
  Work as ExperienceIcon,
  AttachMoney as FeeIcon,
  School as EducationIcon,
} from '@mui/icons-material';

const DoctorDetailDialog = ({ open, onClose, doctor }) => {
  if (!doctor) return null;

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'primary.main' }}>
        {icon}
      </Box>
      <Box>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            >
              {doctor.firstName?.[0]}{doctor.lastName?.[0]}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Dr. {doctor.firstName} {doctor.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Doctor ID: {doctor.doctorId}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={doctor.status} 
            color={doctor.status === 'Active' ? 'success' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PersonIcon />}
                    label="Full Name"
                    value={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<CakeIcon />}
                    label="Date of Birth"
                    value={doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : 'N/A'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PersonIcon />}
                    label="Age"
                    value={`${calculateAge(doctor.dateOfBirth)} years`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PersonIcon />}
                    label="Gender"
                    value={doctor.gender}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Professional Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'primary.lighter' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Professional Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<SpecializationIcon />}
                    label="Specialization"
                    value={doctor.specialization}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<ExperienceIcon />}
                    label="Experience"
                    value={`${doctor.experience} years`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<FeeIcon />}
                    label="Consultation Fee"
                    value={`$${doctor.consultationFee}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<SpecializationIcon />}
                    label="Medical License"
                    value={doctor.medicalLicenseNumber}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PhoneIcon />}
                    label="Phone"
                    value={doctor.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<EmailIcon />}
                    label="Email"
                    value={doctor.email}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Qualifications */}
          {doctor.qualifications && doctor.qualifications.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  <EducationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Education & Qualifications
                </Typography>
                {doctor.qualifications.map((qual, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {qual.degree}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {qual.institution} • {qual.year} • {qual.country}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}

          {/* Schedule */}
          {doctor.schedule && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Weekly Schedule
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(doctor.schedule).map(([day, schedule]) => (
                    <Grid item xs={12} sm={6} key={day}>
                      <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {day}
                        </Typography>
                        <Typography variant="caption" color={schedule.isAvailable ? 'success.main' : 'error.main'}>
                          {schedule.isAvailable 
                            ? `${schedule.startTime} - ${schedule.endTime}`
                            : 'Not Available'
                          }
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Performance Metrics */}
          {doctor.metrics && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {doctor.metrics.totalPatients || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Patients
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {doctor.metrics.averageConsultationTime || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg. Time (min)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {doctor.metrics.patientSatisfactionScore || 0}/5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Satisfaction
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {((doctor.metrics.successRate || 0) * 100).toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Success Rate
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
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
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Join Date
                  </Typography>
                  <Typography variant="body2">
                    {doctor.joinDate ? new Date(doctor.joinDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleString() : 'N/A'}
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

export default DoctorDetailDialog;
