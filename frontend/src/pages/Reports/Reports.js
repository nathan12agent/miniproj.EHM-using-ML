import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';

function Reports() {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const reportTypes = [
    { value: 'patient-summary', label: 'Patient Summary' },
    { value: 'appointment-report', label: 'Appointment Report' },
    { value: 'financial-report', label: 'Financial Report' },
    { value: 'inventory-report', label: 'Inventory Report' },
    { value: 'doctor-performance', label: 'Doctor Performance' },
  ];

  const handleGenerateReport = () => {
    // Handle report generation
    console.log('Generating report:', reportType, dateRange);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Report
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="End Date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleGenerateReport}
                  disabled={!reportType}
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Reports
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={() => {/* Handle quick report */}}
                >
                  Today's Appointments
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={() => {/* Handle quick report */}}
                >
                  Weekly Revenue
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={() => {/* Handle quick report */}}
                >
                  Monthly Patient Count
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={() => {/* Handle quick report */}}
                >
                  Low Stock Items
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              <Typography variant="body2" color="textSecondary">
                No recent reports available. Generate a report to see it here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reports;