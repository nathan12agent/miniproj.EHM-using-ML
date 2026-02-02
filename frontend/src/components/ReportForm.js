import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { reportsAPI, patientsAPI, doctorsAPI } from '../services/api';

const ReportForm = ({ open, onClose, onSuccess, report = null }) => {
  const isEdit = !!report;
  
  const [formData, setFormData] = useState({
    patient: report?.patient?._id || '',
    doctor: report?.doctor?._id || '',
    reportType: report?.reportType || '',
    title: report?.title || '',
    description: report?.description || '',
    findings: report?.findings || '',
    diagnosis: report?.diagnosis || '',
    recommendations: report?.recommendations || '',
    status: report?.status || 'Pending',
    reportDate: report?.reportDate?.split('T')[0] || new Date().toISOString().split('T')[0],
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    'Lab Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Blood Test', 'Other'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        patientsAPI.getAll({ limit: 1000 }),
        doctorsAPI.getAll({ limit: 1000 })
      ]);
      setPatients(patientsRes.data.patients || []);
      setDoctors(doctorsRes.data.doctors || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await reportsAPI.update(report._id, formData);
      } else {
        await reportsAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.response?.data?.message || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Report' : 'Create New Report'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.patientId})`}
                value={patients.find(p => p._id === formData.patient) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, patient: newValue?._id || '' }));
                }}
                renderInput={(params) => (
                  <TextField {...params} required label="Patient" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={doctors}
                getOptionLabel={(option) => `Dr. ${option.firstName} ${option.lastName}`}
                value={doctors.find(d => d._id === formData.doctor) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, doctor: newValue?._id || '' }));
                }}
                renderInput={(params) => (
                  <TextField {...params} required label="Doctor" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Report Type"
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
              >
                {reportTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Report Date"
                name="reportDate"
                value={formData.reportDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Report Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Findings"
                name="findings"
                value={formData.findings}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recommendations"
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Reviewed">Reviewed</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {isEdit ? 'Update' : 'Create'} Report
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReportForm;
