import React, { useState } from 'react';
import {
  Box, Typography, Paper, Divider, Alert, CircularProgress, Grid
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder, verifyPayment } from '../../store/slices/paymentSlice';
import RazorpayCheckout from '../../components/Payment/RazorpayCheckout';

const PaymentPortal = ({ billId, billAmount = 0, insuranceCovered = 0, patientId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder, loading, error } = useSelector(s => s.payment);
  const { user } = useSelector(s => s.auth);
  const [orderCreated, setOrderCreated] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const patientLiability = billAmount - insuranceCovered;

  const handleCreateOrder = async () => {
    const result = await dispatch(createOrder({
      billId, billAmount, insuranceCovered,
      patientId: patientId || user?._id
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      setOrderCreated(true);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    const result = await dispatch(verifyPayment({
      ...paymentData,
      razorpayOrderId: currentOrder.orderId
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      const paymentId = result.payload?.payment?.paymentId;
      navigate(`/payment/receipt/${paymentId}`);
    }
  };

  const handlePaymentFailure = (msg) => {
    setPaymentError(msg);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Payment Summary</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={8}><Typography>Bill Amount</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography>₹{billAmount.toLocaleString()}</Typography></Grid>
          <Grid item xs={8}><Typography color="success.main">Insurance Covered</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography color="success.main">- ₹{insuranceCovered.toLocaleString()}</Typography></Grid>
          <Grid item xs={12}><Divider /></Grid>
          <Grid item xs={8}><Typography fontWeight={700} variant="h6">You Pay</Typography></Grid>
          <Grid item xs={4} textAlign="right"><Typography fontWeight={700} variant="h6">₹{patientLiability.toLocaleString()}</Typography></Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><CircularProgress /></Box>}

        {!orderCreated ? (
          <Box
            component="button"
            onClick={handleCreateOrder}
            disabled={loading || patientLiability <= 0}
            sx={{
              width: '100%', py: 1.5, bgcolor: 'primary.main', color: 'white',
              border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
              '&:disabled': { bgcolor: 'grey.400', cursor: 'not-allowed' }
            }}
          >
            Proceed to Pay
          </Box>
        ) : (
          <RazorpayCheckout
            orderId={currentOrder?.orderId}
            keyId={currentOrder?.keyId}
            amount={currentOrder?.amount}
            patientName={user?.name}
            patientEmail={user?.email}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        )}
      </Paper>
    </Box>
  );
};

export default PaymentPortal;
