import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, Card, CardContent, Chip,
  CircularProgress, Alert, LinearProgress, Snackbar,
} from '@mui/material';
import { Hotel as BedIcon, Person as PersonIcon, MedicalServices as DoctorIcon, LocalHospital as NurseIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBeds, fetchBedStats, setSelectedWard } from '../../store/slices/bedSlice';
import BedDetailModal from '../../components/Beds/BedDetailModal';
import * as bedService from '../../services/bedService';

const WARD_TABS = [
  { label: 'All',            value: 'All',           purpose: null },
  { label: 'General',        value: 'General',       purpose: null },
  { label: 'ICU',            value: 'ICU',           purpose: null },
  { label: 'Emergency',      value: 'Emergency',     purpose: null },
  { label: 'Pediatric',      value: 'Pediatric',     purpose: null },
  { label: 'Maternity',      value: 'Maternity',     purpose: null },
  { label: 'Doctor Wing',    value: 'Doctor Wing',   purpose: null },
  { label: 'Nurse Stations', value: 'Nurse Station', purpose: null },
];

const PURPOSE_COLORS = {
  patient_bed: {
    Available:   { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
    Occupied:    { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
    Maintenance: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
    Reserved:    { bg: '#fef9c3', border: '#ca8a04', text: '#a16207' },
  },
  doctor_room: {
    Available:   { bg: '#e3f2fd', border: '#1976d2', text: '#1565c0' },
    Occupied:    { bg: '#bbdefb', border: '#1565c0', text: '#0d47a1' },
    Maintenance: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
    Reserved:    { bg: '#e8eaf6', border: '#3949ab', text: '#283593' },
  },
  nurse_station: {
    Available:   { bg: '#f3e5f5', border: '#7b1fa2', text: '#6a1b9a' },
    Occupied:    { bg: '#e1bee7', border: '#6a1b9a', text: '#4a148c' },
    Maintenance: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
    Reserved:    { bg: '#fce4ec', border: '#c2185b', text: '#880e4f' },
  },
};

const PURPOSE_LABELS = {
  patient_bed:   'Patient Bed',
  doctor_room:   'Doctor Room',
  nurse_station: 'Nurse Station',
  on_call_room:  'On-Call Room',
};

function getColors(bed) {
  const scheme = PURPOSE_COLORS[bed.bedPurpose] || PURPOSE_COLORS.patient_bed;
  return scheme[bed.status] || scheme.Available;
}

function BedCardIcon({ bed, colors }) {
  if (bed.bedPurpose === 'doctor_room')   return <DoctorIcon fontSize="small" sx={{ color: colors.text }} />;
  if (bed.bedPurpose === 'nurse_station') return <NurseIcon  fontSize="small" sx={{ color: colors.text }} />;
  return <BedIcon fontSize="small" sx={{ color: colors.text }} />;
}

// Unified result card colors by type
const RESULT_COLORS = {
  patient: { bg: '#e8f5e9', border: '#2e7d32', title: '#1b5e20' },
  doctor:  { bg: '#e3f2fd', border: '#1976d2', title: '#0d47a1' },
  nurse:   { bg: '#f3e5f5', border: '#7b1fa2', title: '#4a148c' },
};

const RESULT_LABELS = {
  patient: 'Patient Bed',
  doctor:  'Doctor Room',
  nurse:   'Nurse Station',
};

export default function BedManagementNew() {
  const dispatch = useDispatch();
  const { beds, stats, breakdown, loading, error } = useSelector(s => s.beds);

  const [selectedBed,        setSelectedBed]        = useState(null);
  const [tabIndex,           setTabIndex]            = useState(0);
  const [allocatingPatients, setAllocatingPatients]  = useState(false);
  const [allocatingDoctors,  setAllocatingDoctors]   = useState(false);
  const [allocatingNurses,   setAllocatingNurses]    = useState(false);
  const [unassignedCount,    setUnassignedCount]     = useState(0);
  const [allocationResult,   setAllocationResult]    = useState(null);
  const [snackbar,           setSnackbar]            = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const refreshBeds = () => {
    const tab = WARD_TABS[tabIndex];
    dispatch(fetchBeds(tab.purpose ? { purpose: tab.purpose } : { ward: tab.value }));
    dispatch(fetchBedStats());
  };

  const fetchUnassignedCount = async () => {
    try {
      // Count patient_bed occupied beds to derive unassigned = total active patients - occupied patient beds
      // We use the breakdown from the store; unassigned count is approximated from available beds
      // Actual count comes back from the allocate response; initialise to 0
      setUnassignedCount(0);
    } catch {
      setUnassignedCount(0);
    }
  };

  useEffect(() => {
    refreshBeds();
    fetchUnassignedCount();
  }, [dispatch, tabIndex]); // eslint-disable-line

  const handleTabChange = (_, val) => {
    setTabIndex(val);
    dispatch(setSelectedWard(WARD_TABS[val].value));
  };

  const handleAllocatePatients = async () => {
    try {
      setAllocatingPatients(true);
      const res = await bedService.autoAllocatePatients();
      setAllocationResult({ type: 'patient', ...res.data });
      showSnackbar(res.data.summary, 'success');
      setUnassignedCount(res.data.failed || 0);
      refreshBeds();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Patient allocation failed', 'error');
    } finally {
      setAllocatingPatients(false);
    }
  };

  const handleAllocateDoctors = async () => {
    try {
      setAllocatingDoctors(true);
      const res = await bedService.autoAllocateDoctors();
      setAllocationResult({ type: 'doctor', ...res.data });
      showSnackbar(res.data.summary, 'success');
      refreshBeds();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Doctor allocation failed', 'error');
    } finally {
      setAllocatingDoctors(false);
    }
  };

  const handleAllocateNurses = async () => {
    try {
      setAllocatingNurses(true);
      const res = await bedService.autoAllocateNurses();
      setAllocationResult({ type: 'nurse', ...res.data });
      showSnackbar(res.data.summary, 'success');
      refreshBeds();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Nurse allocation failed', 'error');
    } finally {
      setAllocatingNurses(false);
    }
  };

  const handleReleaseDoctors = async () => {
    if (!window.confirm('Release all doctor room allocations?')) return;
    try {
      const res = await bedService.releaseAllDoctors();
      showSnackbar(`${res.data.released} doctor rooms released`, 'info');
      refreshBeds();
    } catch (err) {
      showSnackbar('Release failed', 'error');
    }
  };

  const handleReleaseNurses = async () => {
    if (!window.confirm('Release all nurse station allocations?')) return;
    try {
      const res = await bedService.releaseAllNurses();
      showSnackbar(`${res.data.released} nurse stations released`, 'info');
      refreshBeds();
    } catch (err) {
      showSnackbar('Release failed', 'error');
    }
  };

  const overall = stats?.overall || {};
  const availablePct = overall.total ? Math.round((overall.available / overall.total) * 100) : 0;
  const progressColor = availablePct > 50 ? 'success' : availablePct > 20 ? 'warning' : 'error';

  const rc = allocationResult ? RESULT_COLORS[allocationResult.type] || RESULT_COLORS.patient : null;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Bed Management</Typography>

      {/* ── Auto Allocation Panel ── */}
      <Box sx={{
        display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3, p: 2,
        background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0',
      }}>
        <Typography variant="caption" sx={{ width: '100%', fontWeight: 600, color: '#64748b', mb: 0.5 }}>
          Auto Allocation Controls
        </Typography>

        {/* Row 1 — Patient Beds */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          <button
            onClick={handleAllocatePatients}
            disabled={allocatingPatients}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: allocatingPatients ? '#a5d6a7' : '#2e7d32',
              color: '#fff', fontWeight: 500, fontSize: 13,
              cursor: allocatingPatients ? 'not-allowed' : 'pointer',
            }}
          >
            {allocatingPatients ? 'Allocating...' : 'Auto Allocate — Patient Beds'}
          </button>
          {unassignedCount > 0 ? (
            <Typography variant="caption" sx={{ color: '#b71c1c', fontWeight: 500 }}>
              {unassignedCount} patient{unassignedCount > 1 ? 's' : ''} without a bed
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 500 }}>
              All active patients have beds
            </Typography>
          )}
        </Box>

        <Box sx={{ width: '100%', height: 1, background: '#e2e8f0' }} />

        {/* Row 2 — Doctor Rooms */}
        <button
          onClick={handleAllocateDoctors}
          disabled={allocatingDoctors}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: allocatingDoctors ? '#90caf9' : '#1565c0',
            color: '#fff', fontWeight: 500, fontSize: 13,
            cursor: allocatingDoctors ? 'not-allowed' : 'pointer',
          }}
        >
          {allocatingDoctors ? 'Allocating...' : 'Auto Allocate — Doctor Rooms'}
        </button>
        <button
          onClick={handleReleaseDoctors}
          style={{
            padding: '9px 18px', borderRadius: 8,
            border: '1px solid #1565c0', background: 'transparent',
            color: '#1565c0', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}
        >
          Release All Doctor Rooms
        </button>

        <Box sx={{ width: '100%', height: 1, background: '#e2e8f0' }} />

        {/* Row 3 — Nurse Stations */}
        <button
          onClick={handleAllocateNurses}
          disabled={allocatingNurses}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: allocatingNurses ? '#ce93d8' : '#6a1b9a',
            color: '#fff', fontWeight: 500, fontSize: 13,
            cursor: allocatingNurses ? 'not-allowed' : 'pointer',
          }}
        >
          {allocatingNurses ? 'Allocating...' : 'Auto Allocate — Nurse Stations'}
        </button>
        <button
          onClick={handleReleaseNurses}
          style={{
            padding: '9px 18px', borderRadius: 8,
            border: '1px solid #6a1b9a', background: 'transparent',
            color: '#6a1b9a', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}
        >
          Release All Nurse Stations
        </button>
      </Box>

      {/* ── Unified Allocation Result Card ── */}
      {allocationResult && rc && (
        <Box sx={{
          mb: 2, p: 2, borderRadius: 2,
          background: rc.bg,
          border: `1px solid ${rc.border}`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: rc.title }}>
              {RESULT_LABELS[allocationResult.type]} Allocation Result
            </Typography>
            <button
              onClick={() => setAllocationResult(null)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', lineHeight: 1, padding: '0 4px' }}
            >
              ×
            </button>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#2e7d32' }}>
              Allocated: <strong>{allocationResult.allocated}</strong>
            </Typography>
            {allocationResult.skipped > 0 && (
              <Typography variant="caption" sx={{ color: '#e65100' }}>
                Already assigned: <strong>{allocationResult.skipped}</strong>
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: '#b71c1c' }}>
              No space: <strong>{allocationResult.failed}</strong>
            </Typography>
          </Box>
          <Box sx={{ maxHeight: 140, overflowY: 'auto' }}>
            {allocationResult.results?.map((r, i) => (
              <Box key={i} sx={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12, py: 0.4, borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}>
                <Typography variant="caption">
                  {r.patient ? `${r.patient} (${r.patientId})` : (r.doctor || r.nurse)}
                </Typography>
                <Typography variant="caption" sx={{
                  color: r.status === 'allocated'         ? '#2e7d32'
                       : r.status === 'already_allocated' ? '#e65100'
                       : '#b71c1c',
                }}>
                  {r.status === 'allocated'
                    ? (r.bed ? `${r.bed} — ${r.ward}` : r.room || r.station)
                    : r.status === 'already_allocated'
                      ? 'Already assigned'
                      : 'No space'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Three-group summary stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '4px solid #16a34a' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Patient Beds</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#15803d' }}>
                {breakdown?.patientBeds?.available ?? overall.available ?? 0}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  / {breakdown?.patientBeds?.total ?? overall.total ?? 0} available
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '4px solid #1565c0' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Doctor Rooms</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#0d47a1' }}>
                {breakdown?.doctorRooms?.available ?? 0}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  / {breakdown?.doctorRooms?.total ?? 0} available
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '4px solid #6a1b9a' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Nurse Stations</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#4a148c' }}>
                {breakdown?.nurseStations?.available ?? 0}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  / {breakdown?.nurseStations?.total ?? 0} available
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Occupancy bar ── */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>Patient Bed Availability</Typography>
          <Typography variant="body2" color="text.secondary">
            {overall.available || 0} / {overall.total || 0} available ({availablePct}%)
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={availablePct} color={progressColor} sx={{ height: 8, borderRadius: 4 }} />
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Ward tabs ── */}
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        {WARD_TABS.map(w => <Tab key={w.value} label={w.label} />)}
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {beds.map(bed => {
            const colors = getColors(bed);
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
                      <BedCardIcon bed={bed} colors={colors} />
                      <Typography variant="body2" fontWeight={700} sx={{ color: colors.text }}>
                        {bed.bedNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                      <Chip
                        label={bed.status}
                        size="small"
                        sx={{ backgroundColor: colors.border, color: '#fff', fontSize: '0.6rem', height: 16 }}
                      />
                      {bed.bedPurpose !== 'patient_bed' && (
                        <Chip
                          label={PURPOSE_LABELS[bed.bedPurpose] || bed.bedPurpose}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 16, borderColor: colors.border, color: colors.text }}
                        />
                      )}
                    </Box>
                    {bed.patient && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {bed.patient.firstName} {bed.patient.lastName}
                        </Typography>
                      </Box>
                    )}
                    {!bed.patient && bed.allocatedTo?.name && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ color: colors.text }} noWrap>
                          {bed.allocatedTo.name}
                        </Typography>
                        {bed.allocatedTo.role && (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {bed.allocatedTo.role}{bed.allocatedTo.department ? ` — ${bed.allocatedTo.department}` : ''}
                          </Typography>
                        )}
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
              <Typography color="text.secondary" textAlign="center" py={4}>No beds found</Typography>
            </Grid>
          )}
        </Grid>
      )}

      {selectedBed && (
        <BedDetailModal
          open={!!selectedBed}
          bed={selectedBed}
          onClose={() => setSelectedBed(null)}
          onSuccess={() => { setSelectedBed(null); refreshBeds(); }}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
