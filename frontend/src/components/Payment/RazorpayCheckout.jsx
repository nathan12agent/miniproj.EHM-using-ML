import React, { useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RazorpayCheckout = ({ orderId, keyId, amount, patientName, patientEmail, onSuccess, onFailure, disabled }) => {
  useEffect(() => { loadRazorpayScript(); }, []);

  const handlePay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.('Failed to load Razorpay SDK');
      return;
    }

    const options = {
      key: keyId,
      amount,
      currency: 'INR',
      name: 'Hospital Management System',
      description: 'Medical Bill Payment',
      order_id: orderId,
      prefill: {
        name: patientName || '',
        email: patientEmail || ''
      },
      theme: { color: '#dc2626' },
      handler: (response) => {
        onSuccess?.({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      modal: {
        ondismiss: () => onFailure?.('Payment cancelled by user')
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      onFailure?.(response.error?.description || 'Payment failed');
    });
    rzp.open();
  };

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      onClick={handlePay}
      disabled={disabled || !orderId}
      fullWidth
    >
      Pay Now
    </Button>
  );
};

export default RazorpayCheckout;
