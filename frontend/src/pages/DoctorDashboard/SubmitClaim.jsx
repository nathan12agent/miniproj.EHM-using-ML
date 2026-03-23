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
import { fraudPrecheck } from '../../services/insuranceService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const DIAGNOSES = [
  { code: 'D001', name: 'Hypertension' },
  { code: 'D002', name: 'Migraine' },
  { code: 'D003', name: 'Fracture' },
  { code: 'D004', name: 'Appendicitis' },
  { code: 'D005', name: 'Chest Pain' },
  { code: 'D006', name: 'Fever and Cough' },
  { code: 'D007', name: 'Diabetes Type 2' },
  { code: 'D008', name: 'Arthritis' },
  { code: 'D009', name: 'Kidney Stone' },
  { code: 'D010', name: 'Dengue' },
  { code: 'D011', name: 'Pneumonia' },
  { code: 'D012', name: 'Heart Attack' },
  { code: 'D013', name: 'Bypass Surgery' },
  { code: 'D014', name: 'Typhoid' },
  { code: 'D015', name: 'Cancer' },
];

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
  if (score === null || score === undefined) return null;
  if (score < 0.4) {
    return <Chip icon={<CheckIcon />} label={`Low risk (${(score * 100).toFixed(0)}%) — safe to submit`} color="success" />;
  }
  if (score <= 0.75) {
    return <Chip icon={<WarnIcon />} label={`Medium risk (${(score * 100).toFixed(0)}%) — will go to admin review`} color="warning" />;
  }
  return <Chip icon={<ErrorIcon />} label={`High fraud risk (${(score * 100).toFixed(0)}%) — submission blocked`} color="error" />;
}

export default function SubmitClaim() {
  const dispatch = useDispatch();
  const { validationResult, lastSubmittedClaim, loading, error } = useSelector(s => s.insurance);
  const { user, token } = useSelector(s => s.auth);

  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: '', policyNumber: '', diagnosisCode: '', diagnosisName: '',
    treatmentCode: 'T001', billAmount: ''
  });
  const [policyInfo, setPolicyInfo] = useState(null);
  const [fraud, setFraud] = useState({ score: null, reasons: [], loading: false, checked: false });
  const [stage, setStage] = useState(1);

  useEffect(() => {
    patientsAPI.getAll({ limit: 500 }).then(r => setPatients(r.data.patients || [])).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handlePatientChange = async (patient) => {
    const patientId = patient?._id || '';
    setForm(f => ({ ...f, patientId, policyNumber: '' }));
    setPolicyInfo(null);
    setFraud({ score: null, reasons: [], loading: false, checked: false });
    if (!patientId) return;
    try {
      const res = await axios.get(`${API_URL}/insurance/patient/${patientId}/policy`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.policy) {
        setForm(f => ({ ...f, patientId, policyNumber: res.data.policy.policyNumber }));
        setPolicyInfo(res.data.policy);
      }
    } catch {
      // no active policy found — user can type manually
    }
  };

  const handleDiagnosisChange = (e) => {
    const selected = DIAGNOSES.find(d => d.code === e.target.value);
    if (selected) {
      setForm(f => ({ ...f, diagnosisCode: selected.code, diagnosisName: selected.name }));
    }
  };

  const handleCheckPolicy = () => {
    if (!form.policyNumber || !form.billAmount) return;
    dispatch(validatePolicy({
      policyNumber: form.policyNumber,
      patientId: form.patientId,
      diagnosisCode: form.diagnosisCode,
      diagnosisName: form.diagnosisName,
      billAmount: Number(form.billAmount)
    }));
    setFraud({ score: null, reasons: [], loading: false, checked: false });
  };

  const handleFraudCheck = async () => {
    setFraud({ score: null, reasons: [], loading: true, checked: false });
    try {
      const res = await fraudPrecheck({
        claimAmount: Number(form.billAmount),
        diagnosisCode: form.diagnosisName,
        patientId: form.patientId,
        policyNumber: form.policyNumber
      });
      setFraud({ score: res.data.fraudScore, reasons: res.data.reasons || [], loading: false, checked: true });
    } catch {
      setFraud({ score: 0, reasons: [], loading: false, checked: true });
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

  const resetForm = () => {
    setStage(1);
    setFraud({ score: null, reasons: [], loading: false, checked: false });
    setPolicyInfo(null);
    setForm({ patientId: '', policyNumber: '', diagnosisCode: '', diagnosisName: '', treatmentCode: 'T001', billAmount: '' });
  };

  const isHighRisk = fraud.score !== null && fraud.score > 0.75;

  // Stage 3 — success screen
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
            : `Claim ${claim.claimId} submitted successfully`}
        </Alert>
        <Grid container spacing={1}>
          {[
            ['Claim ID', claim.claimId],
            ['Bill Amount', `₹${claim.claimAmount?.toLocaleString('en-IN')}`],
            ['Insurance Covers', `₹${claim.approvedAmount?.toLocaleString('en-IN')}`],
            ['Patient Pays', `₹${claim.patientLiability?.toLocaleString('en-IN')}`],
            ['Status', claim.status],
          ].map(([label, val]) => (
            <React.Fragment key={label}>
              <Grid item xs={5}><Typography variant="body2" color="text.secondary">{label}</Typography></Grid>
              <Grid item xs={7}><Typography variant="body2" fontWeight={600}>{val}</Typography></Grid>
            </React.Fragment>
          ))}
        </Grid>
        <Button sx={{ mt: 3 }} variant="outlined" onClick={resetForm}>
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Row 1: Patient full width */}
        <Autocomplete
          options={patients}
          getOptionLabel={p => `${p.firstName} ${p.lastName} (${p.patientId})`}
          onChange={(_, v) => handlePatientChange(v)}
          renderInput={params => <TextField {...params} label="Patient" required />}
        />

        {/* Row 2: Policy number + Bill amount */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            name="policyNumber"
            label="Policy Number"
            value={form.policyNumber}
            onChange={handleChange}
            required
            helperText={policyInfo ? 'Auto-filled from patient record' : 'Select a patient or enter manually'}
          />
          <TextField
            name="billAmount"
            label="Bill Amount (₹)"
            type="number"
            value={form.billAmount}
            onChange={handleChange}
            required
          />
        </Box>

        {/* Policy info card — shown when auto-filled */}
        {policyInfo && (
          <Box sx={{
            background: '#e3f2fd', border: '1px solid #1976d2',
            borderRadius: 2, p: '10px 14px', fontSize: 13, lineHeight: 1.8
          }}>
            <strong>{policyInfo.providerName}</strong> — {policyInfo.policyNumber}<br />
            Coverage: ₹{policyInfo.coverageAmount?.toLocaleString('en-IN')} &nbsp;|&nbsp;
            Used: ₹{policyInfo.usedAmount?.toLocaleString('en-IN')} &nbsp;|&nbsp;
            Available: ₹{(policyInfo.coverageAmount - policyInfo.usedAmount)?.toLocaleString('en-IN')} &nbsp;|&nbsp;
            Status: <span style={{ color: policyInfo.status === 'active' ? 'green' : 'red', fontWeight: 600 }}>
              {policyInfo.status?.toUpperCase()}
            </span>
          </Box>
        )}

        {/* Row 3: Diagnosis dropdown */}
        <TextField
          select
          label="Diagnosis"
          value={form.diagnosisCode}
          onChange={handleDiagnosisChange}
          required
          helperText={form.diagnosisCode ? `Code: ${form.diagnosisCode} — Name: ${form.diagnosisName}` : 'Select a diagnosis'}
        >
          <MenuItem value=""><em>Select Diagnosis</em></MenuItem>
          {DIAGNOSES.map(d => (
            <MenuItem key={d.code} value={d.code}>{d.code} — {d.name}</MenuItem>
          ))}
        </TextField>

        {/* Row 4: Treatment */}
        <TextField
          select
          name="treatmentCode"
          label="Treatment"
          value={form.treatmentCode}
          onChange={handleChange}
        >
          {TREATMENT_OPTIONS.map(t => (
            <MenuItem key={t.code} value={t.code}>{t.code} — {t.name}</MenuItem>
          ))}
        </TextField>

        {/* Check Policy button */}
        <Button
          variant="outlined"
          onClick={handleCheckPolicy}
          disabled={loading || !form.policyNumber || !form.billAmount}
        >
          {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          Check Policy
        </Button>

        {/* Validation result card */}
        {validationResult && (
          validationResult.isValid ? (
            <Box sx={{ background: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: 2, p: '12px 16px' }}>
              <Typography sx={{ fontWeight: 600, color: '#1b5e20', mb: 1 }}>Policy Valid</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: 13 }}>
                <div>Total Bill: <strong>₹{Number(form.billAmount).toLocaleString('en-IN')}</strong></div>
                <div>Insurance covers: <strong style={{ color: '#1976d2' }}>₹{validationResult.approvedAmount?.toLocaleString('en-IN')}</strong></div>
                <div>Patient pays: <strong style={{ color: '#e65100' }}>₹{validationResult.patientLiability?.toLocaleString('en-IN')}</strong></div>
                <div>Available coverage: <strong>₹{validationResult.availableCoverage?.toLocaleString('en-IN')}</strong></div>
              </Box>
            </Box>
          ) : (
            <Box sx={{ background: '#fff3e0', border: '1px solid #e65100', borderRadius: 2, p: '12px 16px' }}>
              <Typography sx={{ fontWeight: 600, color: '#e65100', mb: 0.5 }}>Policy Check Failed</Typography>
              <Typography sx={{ fontSize: 13, color: '#bf360c' }}>{validationResult.reason}</Typography>
              {validationResult.coveredDiagnoses && (
                <Typography sx={{ fontSize: 12, color: '#795548', mt: 0.75 }}>
                  Covered conditions: {validationResult.coveredDiagnoses.join(' • ')}
                </Typography>
              )}
            </Box>
          )
        )}

        {/* Fraud pre-check — shown after valid policy */}
        {validationResult?.isValid && (
          <>
            <Divider />
            <Typography variant="subtitle2" fontWeight={600}>Fraud Pre-Check</Typography>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleFraudCheck}
              disabled={fraud.loading}
              sx={{ alignSelf: 'flex-start' }}
            >
              {fraud.loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              Run Fraud Check
            </Button>

            {fraud.checked && (
              <Box>
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

        {/* Submit button — shown after valid + fraud checked */}
        {validationResult?.isValid && fraud.checked && (
          <>
            <Divider />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                onClick={handleSubmit}
                disabled={loading || isHighRisk}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ClaimIcon />}
              >
                Submit Claim
              </Button>
              {isHighRisk && (
                <Typography variant="caption" color="error">High fraud risk — submission blocked</Typography>
              )}
            </Box>
          </>
        )}

      </Box>
    </Paper>
  );
}
