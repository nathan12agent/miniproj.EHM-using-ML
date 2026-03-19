import React, { useEffect } from 'react';
import {
  Box, Typography, Paper, Divider, Button, Grid, Chip, CircularProgress
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchReceipt } from '../../store/slices/paymentSlice';

const PaymentReceipt = () => {
  const dispatch = useDispatch();
  const { paymentId } = useParams();
  const { receipt, loading } = useSelector(s => s.payment);

  useEffect(() => {
    if (paymentId) dispatch(fetchReceipt(paymentId));
  }, [dispatch, paymentId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  if (!receipt) return <Typography>Receipt not found</Typography>;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }} id="receipt-print">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary">Payment Receipt</Typography>
            <Typography variant="body2" color="text.secondary">Hospital Management System</Typography>
          </Box>
          <Chip
            label={receipt.status}
            color={receipt.status === 'completed' ? 'success' : 'default'}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Receipt Number</Typography>
            <Typography fontWeight={600}>{receipt.receiptNumber || '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Payment ID</Typography>
            <Typography fontWeight={600}>{receipt.paymentId}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Patient</Typography>
            <Typography fontWeight={600}>{receipt.patientId?.name || '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Payment Method</Typography>
            <Typography fontWeight={600}>{receipt.paymentMethod}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Date</Typography>
            <Typography fontWeight={600}>{new Date(receipt.createdAt).toLocaleString()}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1}>
          <Grid item xs={8}><Typography>Bill Amount</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography>₹{receipt.billAmount?.toLocaleString()}</Typography></Grid>
          <Grid item xs={8}><Typography color="success.main">Insurance Covered</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography color="success.main">- ₹{receipt.insuranceCovered?.toLocaleString()}</Typography></Grid>
          <Grid item xs={8}><Typography>Patient Liability</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography>₹{receipt.patientLiability?.toLocaleString()}</Typography></Grid>
          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          <Grid item xs={8}><Typography fontWeight={700} variant="h6">Amount Paid</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography fontWeight={700} variant="h6" color="primary">₹{receipt.amountPaid?.toLocaleString()}</Typography></Grid>
        </Grid>

        {receipt.razorpayPaymentId && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Razorpay Payment ID</Typography>
            <Typography variant="body2" fontFamily="monospace">{receipt.razorpayPaymentId}</Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Print Receipt
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentReceipt;
