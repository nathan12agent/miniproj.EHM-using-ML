import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Avatar, CircularProgress, Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { nursesAPI } from '../../services/api';

function NursePatients() {
  const { user } = useSelector((state) => state.auth);
  const nurseId = user?.nurseProfile?.id;
  const [nurse, setNurse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNurse = useCallback(async () => {
    if (!nurseId) return;
    setLoading(true);
    try {
      const res = await nursesAPI.getById(nurseId);
      setNurse(res.data);
    } catch (err) { setError('Failed to load patients'); }
    finally { setLoading(false); }
  }, [nurseId]);

  useEffect(() => { fetchNurse(); }, [fetchNurse]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

  const patients = nurse?.assignedPatients || [];
  const recentVitals = nurse?.vitalsLog?.slice(-20).reverse() || [];

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
          My Patients
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {patients.length} patient(s) assigned to you • {nurse?.ward} Ward
        </Typography>
      </Box>

      {patients.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No patients currently assigned</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Patients will appear here once assigned by the admin or auto-assignment system.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {patients.map((p) => (
            <Grid item xs={12} md={6} lg={4} key={p._id || p.patientId}>
              <Card sx={{ borderLeft: '4px solid #059669' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ backgroundColor: '#059669' }}>
                      {p.firstName?.[0]}{p.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {p.firstName} {p.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {p.patientId || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  {p.dateOfBirth && (
                    <Chip label={`DOB: ${new Date(p.dateOfBirth).toLocaleDateString()}`} size="small" sx={{ mr: 1 }} />
                  )}
                  {p.gender && <Chip label={p.gender} size="small" variant="outlined" />}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recent Vitals Log */}
      {recentVitals.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>📊 Recent Vitals Logged</Typography>
          <Grid container spacing={2}>
            {recentVitals.slice(0, 6).map((v, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Patient: {v.patientId || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(v.recordedAt).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {v.temperature && <Chip label={`🌡️ ${v.temperature}°F`} size="small" />}
                    {v.heartRate && <Chip label={`❤️ ${v.heartRate} bpm`} size="small" />}
                    {v.bloodPressureSystolic && <Chip label={`🩸 ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`} size="small" />}
                    {v.oxygenSaturation && <Chip label={`O₂ ${v.oxygenSaturation}%`} size="small" />}
                  </Box>
                  {v.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{v.notes}</Typography>}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default NursePatients;
