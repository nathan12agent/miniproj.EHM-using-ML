import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, CircularProgress,
  Divider, Chip, InputAdornment, Snackbar
} from '@mui/material';
import {
  Search as SearchIcon, Payment as PaymentIcon, Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActiveClaim } from '../../store/slices/insuranceSlice';
import { createOrder, verifyPayment } from '../../store/slices/paymentSlice';
import RazorpayCheckout from '../../components/Payment/RazorpayCheckout';
import { patientsAPI } from '../../services/api';

export default function PaymentPortal() {
  const dispatch = useDispatch();
  const { activeClaim, loading: insLoading } = useSelector(s => s.insurance);
  const { currentOrder, loading: payLoading, error: payError } = useSelector(s => s.payment);
  const { user } = useSelector(s => s.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const res = await patientsAPI.getAll({ search: searchTerm, limit: 10 });
      setPatients(res.data.patients || []);
    } catch {
      setPatients([]);
    }
    setSearching(false);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setOrderCreated(false);
    setReceipt(null);
    dispatch(fetchActiveClaim(patient._id));
  };

  const handleCollectPayment = async () => {
    if (!activeClaim) return;
    const result = await dispatch(createOrder({
      patientId: selectedPatient._id,
      claimId: activeClaim._id
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      setOrderCreated(true);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    const result = await dispatch(verifyPayment({
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayPaymentId: paymentData.razorpayPaymentId,
      razorpaySignature: paymentData.razorpaySignature,
      paymentDbId: currentOrder?.paymentDbId
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      setReceipt(result.payload.payment);
      setOrderCreated(false);
      setSnackbar({ open: true, msg: `Payment successful! Receipt: ${result.payload.receiptNumber}`, severity: 'success' });
    }
  };

  const handlePaymentFailure = (msg) => {
    setSnackbar({ open: true, msg: msg || 'Payment failed', severity: 'error' });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <PaymentIcon sx={{ color: '#dc2626', fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>Payment Portal</Typography>
      </Box>

      {/* Patient Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Search Patient</Typography>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            placeholder="Search by name or patient ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <Button variant="contained" sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, minWidth: 100 }}
            onClick={handleSearch} disabled={searching}>
            {searching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
          </Button>
        </Box>

        {patients.length > 0 && (
          <Box sx={{ mt: 1, border: '1px solid #e5e7eb', borderRadius: 1 }}>
            {patients.map(p => (
              <Box key={p._id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#fef2f2' } }}
                onClick={() => handleSelectPatient(p)}>
                <Typography variant="body2" fontWeight={600}>{p.firstName} {p.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{p.patientId} · {p.phone}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Bill Breakdown */}
      {selectedPatient && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Bill Breakdown — {selectedPatient.firstName} {selectedPatient.lastName}
          </Typography>

          {insLoading ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
          ) : activeClaim ? (
            <>
              <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
                  <Typography>Total Bill</Typography>
                  <Typography fontWeight={600}>₹{activeClaim.claimAmount?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', bgcolor: '#f0fdfa' }}>
                  <Typography color="teal">Insurance Covered</Typography>
                  <Typography color="teal" fontWeight={600}>₹{activeClaim.approvedAmount?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#fef2f2' }}>
                  <Typography fontWeight={700} variant="h6">Patient Owes</Typography>
                  <Typography fontWeight={700} variant="h6" color="#dc2626">₹{activeClaim.patientLiability?.toLocaleString()}</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                <Chip label={`Claim: ${activeClaim.claimId}`} size="small" />
                <Chip label={activeClaim.diagnosisName} size="small" variant="outlined" />
                <Chip label={`Policy: ${activeClaim.policyId?.policyNumber || '—'}`} size="small" variant="outlined" />
              </Box>

              {!orderCreated && !receipt && (
                <Button
                  variant="contained"
                  sx={{ mt: 2, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                  onClick={handleCollectPayment}
                  disabled={payLoading || activeClaim.patientLiability <= 0}
                  startIcon={payLoading ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
                >
                  Collect Payment — ₹{activeClaim.patientLiability?.toLocaleString()}
                </Button>
              )}

              {payError && <Alert severity="error" sx={{ mt: 2 }}>{payError}</Alert>}

              {orderCreated && currentOrder && (
                <Box sx={{ mt: 2 }}>
                  <RazorpayCheckout
                    orderId={currentOrder.orderId}
                    keyId={currentOrder.keyId}
                    amount={Math.round(currentOrder.amount * 100)}
                    patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                </Box>
              )}
            </>
          ) : (
            <Alert severity="info">No approved insurance claim found for this patient. Submit and approve a claim first.</Alert>
          )}
        </Paper>
      )}

      {/* Receipt */}
      {receipt && (
        <Paper sx={{ p: 3 }} id="receipt-print">
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <ReceiptIcon sx={{ color: '#dc2626' }} />
            <Typography variant="h6" fontWeight={700}>Payment Receipt</Typography>
            <Chip label="Paid" color="success" size="small" sx={{ ml: 'auto' }} />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1}>
            {[
              ['Receipt Number', receipt.receiptNumber],
              ['Patient', `${selectedPatient?.firstName} ${selectedPatient?.lastName}`],
              ['Total Bill', `₹${receipt.billAmount?.toLocaleString()}`],
              ['Insurance Covered', `₹${receipt.insuranceCovered?.toLocaleString()}`],
              ['Amount Paid', `₹${receipt.amountPaid?.toLocaleString()}`],
              ['Razorpay ID', receipt.razorpayPaymentId],
              ['Date', new Date(receipt.createdAt).toLocaleString()],
            ].map(([label, val]) => (
              <React.Fragment key={label}>
                <Grid item xs={5}><Typography variant="body2" color="text.secondary">{label}</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" fontWeight={600}>{val}</Typography></Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => window.print()}>Download Receipt</Button>
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
