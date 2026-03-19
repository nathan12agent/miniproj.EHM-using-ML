import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button, CircularProgress, Alert,
  Tabs, Tab, Divider, LinearProgress, Tooltip, Snackbar, TextField
} from '@mui/material';
import {
  HealthAndSafety as InsuranceIcon, CheckCircle, Cancel, HourglassEmpty, Flag
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClaims, reviewClaim } from '../../store/slices/insuranceSlice';

const STATUS_TABS = ['all', 'pending', 'flagged', 'approved', 'rejected'];

const fraudColor = (score) => {
  if (score < 0) return '#9ca3af';
  if (score < 0.4) return '#16a34a';
  if (score <= 0.75) return '#d97706';
  return '#dc2626';
};

const statusChip = (status) => {
  const map = { approved: 'success', rejected: 'error', flagged: 'warning', pending: 'default' };
  return <Chip label={status} color={map[status] || 'default'} size="small" />;
};

function FraudBar({ score }) {
  if (score < 0) return <Typography variant="caption" color="text.secondary">N/A</Typography>;
  const pct = Math.round(score * 100);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="caption">Fraud Score</Typography>
        <Typography variant="caption" fontWeight={700} color={fraudColor(score)}>{pct}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8, borderRadius: 4,
          bgcolor: '#e5e7eb',
          '& .MuiLinearProgress-bar': { bgcolor: fraudColor(score) }
        }}
      />
    </Box>
  );
}

export default function InsuranceDashboard() {
  const dispatch = useDispatch();
  const { claims, totalClaims, loading, error } = useSelector(s => s.insurance);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const status = STATUS_TABS[tab] === 'all' ? undefined : STATUS_TABS[tab];
    dispatch(fetchClaims(status ? { status } : {}));
  }, [dispatch, tab]);

  const handleReview = async (status, rejectionReason = '') => {
    if (!selected) return;
    setReviewing(true);
    const result = await dispatch(reviewClaim({
      claimId: selected.claimId,
      data: { status, rejectionReason }
    }));
    setReviewing(false);
    if (result.meta.requestStatus === 'fulfilled') {
      const msg = status === 'rejected'
        ? `Claim ${selected.claimId} rejected — bill reverted to full amount unpaid`
        : `Claim ${selected.claimId} approved`;
      setSnackbar({ open: true, msg, severity: status === 'approved' ? 'success' : 'warning' });
      setSelected(null);
      const s = STATUS_TABS[tab] === 'all' ? undefined : STATUS_TABS[tab];
      dispatch(fetchClaims(s ? { status: s } : {}));
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <InsuranceIcon sx={{ color: '#dc2626', fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>Insurance Claims</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setSelected(null); }} sx={{ mb: 2 }}>
        {STATUS_TABS.map(s => <Tab key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} />)}
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {/* Left — Claims list */}
        <Grid item xs={12} md={selected ? 6 : 12}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#dc2626' }} /></Box>
          ) : claims.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No claims found</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {claims.map(claim => {
                const patient = claim.patientId;
                const doctor = claim.doctorId;
                return (
                  <Paper
                    key={claim._id}
                    sx={{
                      p: 2, cursor: 'pointer', border: selected?._id === claim._id ? '2px solid #dc2626' : '1px solid #e5e7eb',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => setSelected(claim)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography fontWeight={600}>{patient?.firstName} {patient?.lastName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Dr. {doctor?.firstName} {doctor?.lastName} · {claim.diagnosisName}
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                          <Typography variant="caption">Bill: ₹{claim.claimAmount?.toLocaleString()}</Typography>
                          <Typography variant="caption" color="teal">Insurance: ₹{claim.approvedAmount?.toLocaleString()}</Typography>
                          <Typography variant="caption" fontWeight={700}>Patient pays: ₹{claim.patientLiability?.toLocaleString()}</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                        {statusChip(claim.status)}
                        <Chip
                          label={claim.fraudScore < 0 ? 'N/A' : `${(claim.fraudScore * 100).toFixed(0)}%`}
                          size="small"
                          sx={{ bgcolor: fraudColor(claim.fraudScore), color: 'white', fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                    {['pending', 'flagged'].includes(claim.status) && (
                      <Box mt={1}>
                        <Button size="small" variant="outlined" sx={{ color: '#dc2626', borderColor: '#dc2626' }}
                          onClick={e => { e.stopPropagation(); setSelected(claim); }}>
                          Review
                        </Button>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* Right — Review panel */}
        {selected && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>Review — {selected.claimId}</Typography>
                <Button size="small" onClick={() => setSelected(null)}>Close</Button>
              </Box>

              <FraudBar score={selected.fraudScore} />

              {selected.fraudReasons?.length > 0 && (
                <Box sx={{ mt: 1.5, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Fraud Indicators</Typography>
                  {selected.fraudReasons.map((r, i) => (
                    <Typography key={i} variant="caption" color="warning.main" display="block">⚠ {r}</Typography>
                  ))}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={1}>
                {[
                  ['Patient', `${selected.patientId?.firstName} ${selected.patientId?.lastName}`],
                  ['Doctor', `${selected.doctorId?.firstName} ${selected.doctorId?.lastName}`],
                  ['Diagnosis', selected.diagnosisName],
                  ['Treatment', selected.treatmentCode],
                  ['Bill Amount', `₹${selected.claimAmount?.toLocaleString()}`],
                  ['Insurance Covers', `₹${selected.approvedAmount?.toLocaleString()}`],
                  ['Patient Pays', `₹${selected.patientLiability?.toLocaleString()}`],
                  ['Status', selected.status],
                ].map(([label, val]) => (
                  <React.Fragment key={label}>
                    <Grid item xs={5}><Typography variant="caption" color="text.secondary">{label}</Typography></Grid>
                    <Grid item xs={7}><Typography variant="body2" fontWeight={500}>{val}</Typography></Grid>
                  </React.Fragment>
                ))}
              </Grid>

              {['pending', 'flagged'].includes(selected.status) && (
                <Box mt={3}>
                  {showRejectInput ? (
                    <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ff9800', mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} color="error" gutterBottom>
                        Confirm Rejection
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        This will revert the bill to full amount unpaid.
                      </Typography>
                      <TextField
                        fullWidth size="small" multiline rows={2}
                        label="Rejection reason (optional)"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        sx={{ mb: 1.5 }}
                      />
                      <Box display="flex" gap={1}>
                        <Button size="small" onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>
                          Back
                        </Button>
                        <Button
                          size="small" variant="contained" color="error"
                          onClick={() => { setShowRejectInput(false); handleReview('rejected', rejectReason); setRejectReason(''); }}
                          disabled={reviewing}
                        >
                          Confirm Rejection
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box display="flex" gap={2}>
                      <Button
                        variant="outlined" color="error"
                        onClick={() => setShowRejectInput(true)}
                        disabled={reviewing}
                        startIcon={<Cancel />}
                      >
                        Reject
                      </Button>
                      <Tooltip title={selected.fraudScore > 0.75 ? 'High risk — cannot auto-approve' : ''}>
                        <span>
                          <Button
                            variant="contained" color="success"
                            onClick={() => handleReview('approved')}
                            disabled={reviewing || selected.fraudScore > 0.75}
                            startIcon={reviewing ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                          >
                            Approve
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
