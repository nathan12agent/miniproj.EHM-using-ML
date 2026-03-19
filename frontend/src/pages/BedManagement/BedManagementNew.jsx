import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, Card, CardContent, Chip,
  CircularProgress, Alert, LinearProgress,
} from '@mui/material';
import { Hotel as BedIcon, Person as PersonIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBeds, fetchBedStats, setSelectedWard } from '../../store/slices/bedSlice';
import BedDetailModal from '../../components/Beds/BedDetailModal';

const WARDS = ['All', 'General', 'ICU', 'Emergency', 'Pediatric', 'Maternity'];

const STATUS_COLORS = {
  Available: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  Occupied: { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
  Maintenance: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
  Reserved: { bg: '#fef9c3', border: '#ca8a04', text: '#a16207' },
};

export default function BedManagementNew() {
  const dispatch = useDispatch();
  const { beds, stats, selectedWard, loading, error } = useSelector(s => s.beds);
  const [selectedBed, setSelectedBed] = useState(null);

  useEffect(() => {
    dispatch(fetchBeds({ ward: selectedWard }));
    dispatch(fetchBedStats());
  }, [dispatch, selectedWard]);

  const handleWardChange = (_, val) => dispatch(setSelectedWard(WARDS[val]));
  const wardIndex = WARDS.indexOf(selectedWard);

  const overall = stats?.overall || {};
  const availablePct = overall.total ? Math.round((overall.available / overall.total) * 100) : 0;
  const progressColor = availablePct > 50 ? 'success' : availablePct > 20 ? 'warning' : 'error';

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Bed Management</Typography>

      {/* Summary stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Beds', value: overall.total || 0, color: '#0891b2' },
          { label: 'Available', value: overall.available || 0, color: '#059669' },
          { label: 'Occupied', value: overall.occupied || 0, color: '#dc2626' },
          { label: 'Maintenance', value: overall.maintenance || 0, color: '#9ca3af' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Occupancy bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>Bed Availability</Typography>
          <Typography variant="body2" color="text.secondary">
            {overall.available || 0} / {overall.total || 0} available ({availablePct}%)
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={availablePct} color={progressColor} sx={{ height: 8, borderRadius: 4 }} />
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Ward tabs */}
      <Tabs value={wardIndex === -1 ? 0 : wardIndex} onChange={handleWardChange} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        {WARDS.map(w => <Tab key={w} label={w} />)}
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {beds.map(bed => {
            const colors = STATUS_COLORS[bed.status] || STATUS_COLORS.Available;
            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={bed._id}>
                <Card
                  onClick={() => setSelectedBed(bed)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'scale(1.03)' },
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <BedIcon fontSize="small" sx={{ color: colors.text }} />
                      <Typography variant="body2" fontWeight={700} sx={{ color: colors.text }}>
                        {bed.bedNumber}
                      </Typography>
                    </Box>
                    <Chip label={bed.status} size="small" sx={{ backgroundColor: colors.border, color: '#fff', fontSize: '0.65rem', height: 18 }} />
                    {bed.patient && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {bed.patient.firstName} {bed.patient.lastName}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {bed.ward}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {beds.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" textAlign="center" py={4}>No beds found for this ward</Typography>
            </Grid>
          )}
        </Grid>
      )}

      {selectedBed && (
        <BedDetailModal
          open={!!selectedBed}
          bed={selectedBed}
          onClose={() => setSelectedBed(null)}
          onSuccess={() => {
            setSelectedBed(null);
            dispatch(fetchBeds({ ward: selectedWard }));
            dispatch(fetchBedStats());
          }}
        />
      )}
    </Box>
  );
}
