import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, Chip,
  CircularProgress, Divider, MenuItem, Autocomplete
} from '@mui/material';
import {
  CheckCircle as CheckIcon, Warning as WarnIcon, Error as ErrorIcon,
  LocalHospital as ClaimIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { validatePolicy, submitClaim } from '../../store/slices/insuranceSlice';
import { patientsAPI } from '../../services/api';
import { fraudPrecheck, getBenchmarks } from '../../services/insuranceService';

const TREATMENT_OPTIONS = [
  { code: 'T001', name: 'Medication' },
  { code: 'T002', name: 'Surgery' },
  { code: 'T003', name: 'Physiotherapy' },
  { code: 'T004', name: 'Consultation' },
  { code: 'T005', name: 'Chemotherapy' },
  { code: 'T006', name: 'Radiology' },
  { code: 'T007', name: 'Lab Tests' },
];

function FraudBadge({ score }) {
  if (score === null) return null;
  if (score < 0.4) return <Chip icon={<CheckIcon />} label={`Low risk (${(score * 100).toFixed(0)}%)`} color="success" />;
  if (score <= 0.75) return <Chip icon={<WarnIcon />} label={`Moderate risk (${(score * 100).toFixed(0)}%) — will be reviewed`} color="warning" />;
  return <Chip icon={<ErrorIcon />} label={`High fraud risk (${(score * 100).toFixed(0)}%) — blocked`} color="error" />;
}

export default function SubmitClaim() {
  const dispatch = useDispatch();
  const { validationResult, lastSubmittedClaim, loading, error } = useSelector(s => s.insurance);
  const { user } = useSelector(s => s.auth);

  const [patients, setPatients] = useState([]);
  const [benchmarks, setBenchmarks] = useState({});
  const [form, setForm] = useState({
    patientId: '', policyNumber: '', diagnosisCode: '', diagnosisName: '',
    treatmentCode: 'T001', billAmount: ''
  });
  const [fraud, setFraud] = useState({ score: null, reasons: [], loading: false });
  const [stage, setStage] = useState(1); // 1=details, 2=fraud, 3=submitted

  useEffect(() => {
    patientsAPI.getAll({ limit: 500 }).then(r => setPatients(r.data.patients || [])).catch(() => {});
    getBenchmarks().then(r => setBenchmarks(r.data || {})).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCheckPolicy = () => {
    if (!form.policyNumber || !form.billAmount) return;
    dispatch(validatePolicy({
      policyNumber: form.policyNumber,
      patientId: form.patientId,
      diagnosisCode: form.diagnosisCode,
      billAmount: Number(form.billAmount)
    }));
  };

  const handleFraudCheck = async () => {
    setFraud({ score: null, reasons: [], loading: true });
    try {
      const res = await fraudPrecheck({
        claimAmount: Number(form.billAmount),
        diagnosisCode: form.diagnosisName,
        patientId: form.patientId,
        policyNumber: form.policyNumber
      });
      setFraud({ score: res.data.fraudScore, reasons: res.data.reasons || [], loading: false });
      setStage(2);
    } catch {
      setFraud({ score: 0, reasons: [], loading: false });
      setStage(2);
    }
  };

  const handleSubmit = () => {
    dispatch(submitClaim({
      patientId: form.patientId,
      policyNumber: form.policyNumber,
      doctorId: user?._id,
      diagnosisCode: form.diagnosisCode,
      diagnosisName: form.diagnosisName,
      treatmentCode: form.treatmentCode,
      billAmount: Number(form.billAmount)
    })).then(action => {
      if (action.meta.requestStatus === 'fulfilled') setStage(3);
    });
  };

  const benchmarkKey = form.diagnosisName;
  const benchmark = benchmarks[benchmarkKey];

  // Stage 3 — success
  if (stage === 3 && lastSubmittedClaim) {
    const { claim, isFlagged } = lastSubmittedClaim;
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ClaimIcon sx={{ color: '#dc2626' }} />
          <Typography variant="h6" fontWeight={700}>Claim Submitted</Typography>
        </Box>
        <Alert severity={isFlagged ? 'warning' : 'success'} sx={{ mb: 2 }}>
          {isFlagged
            ? `Claim ${claim.claimId} submitted but flagged for admin review (fraud score: ${(claim.fraudScore * 100).toFixed(0)}%)`
            : `Claim ${claim.claimId} submitted successfully — status: ${claim.status}`}
        </Alert>
        <Grid container spacing={1}>
          {[
            ['Claim ID', claim.claimId],
            ['Bill Amount', `₹${claim.claimAmount?.toLocaleString()}`],
            ['Insurance Covers', `₹${claim.approvedAmount?.toLocaleString()}`],
            ['Patient Pays', `₹${claim.patientLiability?.toLocaleString()}`],
            ['Status', claim.status],
          ].map(([label, val]) => (
            <React.Fragment key={label}>
              <Grid item xs={5}><Typography variant="body2" color="text.secondary">{label}</Typography></Grid>
              <Grid item xs={7}><Typography variant="body2" fontWeight={600}>{val}</Typography></Grid>
            </React.Fragment>
          ))}
        </Grid>
        <Button sx={{ mt: 3 }} variant="outlined" onClick={() => { setStage(1); setFraud({ score: null, reasons: [], loading: false }); }}>
          Submit Another Claim
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <ClaimIcon sx={{ color: '#dc2626' }} />
        <Typography variant="h6" fontWeight={700}>Submit Insurance Claim</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stage 1 — Claim Details */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            options={patients}
            getOptionLabel={p => `${p.firstName} ${p.lastName} (${p.patientId})`}
            onChange={(_, v) => setForm(f => ({ ...f, patientId: v?._id || '' }))}
            renderInput={params => <TextField {...params} label="Patient" required />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth name="policyNumber" label="Policy Number" value={form.policyNumber} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth name="billAmount" label="Bill Amount (₹)" type="number" value={form.billAmount} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth name="diagnosisCode" label="Diagnosis Code (e.g. D001)" value={form.diagnosisCode} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth name="diagnosisName" label="Diagnosis Name" value={form.diagnosisName} onChange={handleChange} required
            helperText={benchmark ? `Typical cost: ₹${benchmark.toLocaleString()}` : ''} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select name="treatmentCode" label="Treatment" value={form.treatmentCode} onChange={handleChange}>
            {TREATMENT_OPTIONS.map(t => <MenuItem key={t.code} value={t.code}>{t.code} — {t.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button variant="outlined" onClick={handleCheckPolicy} disabled={loading || !form.policyNumber || !form.billAmount}>
            {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null} Check Policy
          </Button>
        </Grid>
      </Grid>

      {/* Validation result */}
      {validationResult && (
        <Box sx={{ mt: 2, p: 2, bgcolor: validationResult.isValid ? '#f0fdf4' : '#fef2f2', borderRadius: 2 }}>
          {validationResult.isValid ? (
            <>
              <Alert severity="success" sx={{ mb: 1 }}>Policy valid</Alert>
              <Grid container spacing={1}>
                {[
                  ['Coverage Available', `₹${validationResult.availableCoverage?.toLocaleString()}`],
                  ['Insurance Covers', `₹${validationResult.approvedAmount?.toLocaleString()}`],
                  ['Patient Pays', `₹${validationResult.patientLiability?.toLocaleString()}`],
                ].map(([label, val]) => (
                  <React.Fragment key={label}>
                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">{label}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" fontWeight={700}>{val}</Typography></Grid>
                  </React.Fragment>
                ))}
              </Grid>
            </>
          ) : (
            <Alert severity="error">{validationResult.reason}</Alert>
          )}
        </Box>
      )}

      {/* Stage 2 — Fraud Check */}
      {validationResult?.isValid && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Fraud Pre-Check</Typography>
          <Button variant="outlined" color="warning" onClick={handleFraudCheck} disabled={fraud.loading}>
            {fraud.loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null} Run Fraud Check
          </Button>

          {fraud.score !== null && (
            <Box sx={{ mt: 2 }}>
              <FraudBadge score={fraud.score} />
              {fraud.reasons.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {fraud.reasons.map((r, i) => (
                    <Typography key={i} variant="caption" color="warning.main" display="block">⚠ {r}</Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* Stage 2 — Submit */}
      {validationResult?.isValid && fraud.score !== null && (
        <>
          <Divider sx={{ my: 3 }} />
          <Button
            variant="contained"
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
            onClick={handleSubmit}
            disabled={loading || fraud.score > 0.75}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ClaimIcon />}
          >
            Submit Claim
          </Button>
          {fraud.score > 0.75 && (
            <Typography variant="caption" color="error" sx={{ ml: 2 }}>High fraud risk — submission blocked</Typography>
          )}
        </>
      )}
    </Paper>
  );
}
