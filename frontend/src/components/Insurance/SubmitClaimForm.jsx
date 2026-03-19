import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Chip, Alert, CircularProgress,
  Paper, Grid
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { submitClaim } from '../../store/slices/insuranceSlice';
import { fraudPrecheck } from '../../services/insuranceService';

const BENCHMARKS = { D001: 5000, D002: 8000, D003: 12000, D004: 3000, D005: 15000, D006: 6000, D007: 9000, D008: 4000, D009: 20000, D010: 7000 };
const RISK_SCORES = { D001: 0.2, D002: 0.3, D003: 0.5, D004: 0.1, D005: 0.7, D006: 0.2, D007: 0.4, D008: 0.1, D009: 0.8, D010: 0.3 };

const SubmitClaimForm = () => {
  const dispatch = useDispatch();
  const { loading, error, lastSubmittedClaim } = useSelector(s => s.insurance);
  const [form, setForm] = useState({
    patientId: '', policyId: '', diagnosisCode: '', diagnosisName: '',
    treatmentCode: '', claimAmount: ''
  });
  const [precheck, setPrecheck] = useState(null);
  const [precheckLoading, setPrecheckLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const runPrecheck = async () => {
    if (!form.claimAmount || !form.diagnosisCode) return;
    setPrecheckLoading(true);
    try {
      const benchmark = BENCHMARKS[form.diagnosisCode] || 6000;
      const res = await fraudPrecheck({
        claimAmount: Number(form.claimAmount),
        amountVsBenchmark: Number(form.claimAmount) / benchmark,
        claimsLast90Days: 0,
        daysSinceLastClaim: 999,
        isDuplicate: 0,
        policyAgeDays: 365,
        patientAge: 35,
        coverageUsedPct: 0,
        diagnosisRiskScore: RISK_SCORES[form.diagnosisCode] || 0.3
      });
      setPrecheck(res.data);
    } catch {
      setPrecheck(null);
    }
    setPrecheckLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitClaim({ ...form, claimAmount: Number(form.claimAmount) }));
  };

  const isHighRisk = precheck?.fraudScore > 0.75;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Submit Insurance Claim</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {lastSubmittedClaim && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Claim {lastSubmittedClaim.claim?.claimId} submitted — Fraud Score: {(lastSubmittedClaim.fraudScore * 100).toFixed(0)}%
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField name="patientId" label="Patient ID" fullWidth required value={form.patientId} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="policyId" label="Policy ID (MongoDB _id)" fullWidth required value={form.policyId} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="diagnosisCode" label="Diagnosis Code (e.g. D001)" fullWidth required value={form.diagnosisCode} onChange={handleChange} onBlur={runPrecheck} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="diagnosisName" label="Diagnosis Name" fullWidth required value={form.diagnosisName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="treatmentCode" label="Treatment Code" fullWidth required value={form.treatmentCode} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="claimAmount" label="Claim Amount (₹)" type="number" fullWidth required
              value={form.claimAmount} onChange={handleChange} onBlur={runPrecheck}
            />
          </Grid>
        </Grid>

        {precheckLoading && <Box sx={{ mt: 2 }}><CircularProgress size={20} /> <Typography variant="caption" sx={{ ml: 1 }}>Checking fraud risk...</Typography></Box>}

        {precheck && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Live Fraud Score:</Typography>
            <Chip
              label={`${(precheck.fraudScore * 100).toFixed(0)}%`}
              color={precheck.fraudScore < 0.5 ? 'success' : precheck.fraudScore < 0.75 ? 'warning' : 'error'}
              size="small"
            />
            {isHighRisk && <Typography variant="caption" color="error">High risk — submission blocked</Typography>}
          </Box>
        )}

        {precheck?.fraudReasons?.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {precheck.fraudReasons.map((r, i) => (
              <Typography key={i} variant="caption" color="warning.main" display="block">⚠ {r}</Typography>
            ))}
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3 }}
          disabled={loading || isHighRisk}
          fullWidth
        >
          {loading ? <CircularProgress size={20} /> : 'Submit Claim'}
        </Button>
      </Box>
    </Paper>
  );
};

export default SubmitClaimForm;
