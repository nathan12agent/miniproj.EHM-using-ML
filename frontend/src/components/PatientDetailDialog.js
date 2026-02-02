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
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  LocalHospital as BloodIcon,
  Home as HomeIcon,
  ContactEmergency as EmergencyIcon,
} from '@mui/icons-material';

const PatientDetailDialog = ({ open, onClose, patient }) => {
  if (!patient) return null;

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
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {patient.firstName} {patient.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patient ID: {patient.patientId}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={patient.status} 
            color={patient.status === 'Active' ? 'success' : 'default'}
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
                    value={`${patient.firstName} ${patient.lastName}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<CakeIcon />}
                    label="Date of Birth"
                    value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PersonIcon />}
                    label="Age"
                    value={`${calculateAge(patient.dateOfBirth)} years`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PersonIcon />}
                    label="Gender"
                    value={patient.gender}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<BloodIcon />}
                    label="Blood Group"
                    value={patient.bloodGroup}
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
                    value={patient.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<EmailIcon />}
                    label="Email"
                    value={patient.email}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Address */}
          {patient.address && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Address
                </Typography>
                <InfoRow
                  icon={<HomeIcon />}
                  label="Full Address"
                  value={
                    patient.address.street || patient.address.city ? (
                      <>
                        {patient.address.street && <>{patient.address.street}<br /></>}
                        {patient.address.city && patient.address.state && (
                          <>{patient.address.city}, {patient.address.state} {patient.address.zipCode}<br /></>
                        )}
                        {patient.address.country}
                      </>
                    ) : 'N/A'
                  }
                />
              </Paper>
            </Grid>
          )}

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      icon={<EmergencyIcon />}
                      label="Contact Name"
                      value={patient.emergencyContact.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      icon={<PersonIcon />}
                      label="Relationship"
                      value={patient.emergencyContact.relationship}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      icon={<PhoneIcon />}
                      label="Emergency Phone"
                      value={patient.emergencyContact.phone}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Medical History */}
          {patient.medicalHistory && patient.medicalHistory.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Medical History
                </Typography>
                <Box>
                  {patient.medicalHistory.map((item, index) => (
                    <Chip 
                      key={index} 
                      label={item} 
                      sx={{ mr: 1, mb: 1 }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'error.lighter' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'error.main' }}>
                  ⚠️ Allergies
                </Typography>
                <Box>
                  {patient.allergies.map((allergy, index) => (
                    <Chip 
                      key={index} 
                      label={allergy} 
                      color="error"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Current Medications */}
          {patient.currentMedications && patient.currentMedications.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Current Medications
                </Typography>
                <Box>
                  {patient.currentMedications.map((med, index) => (
                    <Chip 
                      key={index} 
                      label={med} 
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Additional Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Record Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : 'N/A'}
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

export default PatientDetailDialog;
