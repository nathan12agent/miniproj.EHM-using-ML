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
  LocalHospital as DoctorIcon,
  Description as DescriptionIcon,
  Science as FindingsIcon,
  MedicalServices as DiagnosisIcon,
  Recommend as RecommendIcon,
  CalendarToday as CalendarIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

const ReportDetailDialog = ({ open, onClose, report }) => {
  if (!report) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Reviewed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const InfoSection = ({ icon, title, content }) => (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        {icon}
        <Box component="span" sx={{ ml: 1 }}>{title}</Box>
      </Typography>
      <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
        {content || 'N/A'}
      </Typography>
    </Paper>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {report.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Report ID: {report.reportId} • {report.reportType}
            </Typography>
          </Box>
          <Chip 
            label={report.status} 
            color={getStatusColor(report.status)}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Patient and Doctor Information */}
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
                  {report.patient?.firstName?.[0]}{report.patient?.lastName?.[0]}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {report.patient?.firstName} {report.patient?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {report.patient?.patientId}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

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
                  {report.doctor?.firstName?.[0]}{report.doctor?.lastName?.[0]}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Dr. {report.doctor?.firstName} {report.doctor?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {report.doctor?.specialization}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Report Details */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'primary.lighter' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Report Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Report Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {report.reportType}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Report Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {report.reportDate ? new Date(report.reportDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Description */}
          {report.description && (
            <Grid item xs={12}>
              <InfoSection
                icon={<DescriptionIcon />}
                title="Description"
                content={report.description}
              />
            </Grid>
          )}

          {/* Findings */}
          {report.findings && (
            <Grid item xs={12}>
              <InfoSection
                icon={<FindingsIcon />}
                title="Findings"
                content={report.findings}
              />
            </Grid>
          )}

          {/* Diagnosis */}
          {report.diagnosis && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'warning.lighter' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <DiagnosisIcon sx={{ mr: 1 }} />
                  Diagnosis
                </Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                  {report.diagnosis}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'success.lighter' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <RecommendIcon sx={{ mr: 1 }} />
                  Recommendations
                </Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                  {report.recommendations}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Test Results */}
          {report.testResults && report.testResults.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Test Results
                </Typography>
                {report.testResults.map((test, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {test.testName}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Value
                        </Typography>
                        <Typography variant="body2">
                          {test.value} {test.unit}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Chip 
                          label={test.status} 
                          size="small"
                          color={test.status === 'Normal' ? 'success' : test.status === 'Critical' ? 'error' : 'warning'}
                        />
                      </Grid>
                      {test.normalRange && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Normal Range: {test.normalRange}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                ))}
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
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2">
                    <Chip 
                      label={report.status} 
                      color={getStatusColor(report.status)}
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
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />}>
          Print Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDetailDialog;
