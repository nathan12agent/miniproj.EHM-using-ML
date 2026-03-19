const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Claim = require('../models/Claim');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.warn('razorpay package not installed');
}

function getRazorpayInstance() {
  if (!Razorpay) throw new Error('razorpay package not installed. Run: npm install razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function generateReceiptNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${dateStr}-${rand}`;
}

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { billId } = req.body;
    if (!billId) return res.status(400).json({ message: 'billId is required' });

    const bill = await Bill.findById(billId).populate('patient', 'firstName lastName patientId');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.paymentStatus === 'Paid') return res.status(400).json({ message: 'Bill already paid' });

    // Check for approved insurance claim
    let insuranceCovered = 0;
    let claimId = null;
    if (bill.insuranceClaimId) {
      const claim = await Claim.findById(bill.insuranceClaimId);
      if (claim && claim.status === 'approved') {
        insuranceCovered = claim.approvedAmount || 0;
        claimId = claim._id;
      }
    }

    const billAmount = bill.totalAmount || 0;
    const amountDue = Math.max(0, billAmount - insuranceCovered);

    // === PAYMENT DEBUG ===
    console.log('=== PAYMENT DEBUG ===');
    console.log('bill.totalAmount:', bill.totalAmount);
    console.log('insuranceCovered:', insuranceCovered);
    console.log('amountDue (rupees):', amountDue);
    console.log('amountDue * 100 (paise):', Math.round(amountDue * 100));
    console.log('====================');

    // Guard: Razorpay test mode max is ₹5,00,000 = 5,00,00,000 paise
    const amountInPaise = Math.round(amountDue * 100);
    if (amountInPaise > 50000000) {
      return res.status(400).json({
        message: `Payment amount ₹${amountDue.toLocaleString('en-IN')} exceeds Razorpay test limit of ₹5,00,000. Please use a bill with a smaller amount.`
      });
    }
    if (amountInPaise < 100) {
      return res.status(400).json({ message: 'Payment amount too small. Minimum is ₹1.' });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `bill_${bill.billId}`,
      notes: {
        billId: bill._id.toString(),
        patientId: bill.patient._id.toString(),
      }
    });

    // Save pending payment record
    const payment = new Payment({
      patientId: bill.patient._id,
      billId: bill._id,
      claimId,
      billAmount,
      insuranceCovered,
      patientLiability: amountDue,
      amountDue,
      amountPaid: 0,
      razorpayOrderId: order.id,
      status: 'pending',
    });
    await payment.save();

    res.json({
      orderId: order.id,
      amount: amountDue,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      billId: bill._id,
      billDisplayId: bill.billId,
      patientName: `${bill.patient.firstName} ${bill.patient.lastName}`,
      insuranceCovered,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment details' });
    }

    // Verify HMAC-SHA256 signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    // Find the pending payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    const receiptNumber = generateReceiptNumber();
    const now = new Date();

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'success';
    payment.amountPaid = payment.amountDue;
    payment.receiptNumber = receiptNumber;
    payment.paidAt = now;
    await payment.save();

    // Update bill
    const bill = await Bill.findById(payment.billId);
    if (bill) {
      bill.paymentStatus = 'Paid';
      bill.paidAmount = payment.amountDue;
      await bill.save();
    }

    res.json({
      success: true,
      receiptNumber,
      payment,
      bill,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/receipt/:billId
router.get('/receipt/:billId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ billId: req.params.billId, status: 'success' })
      .populate('patientId', 'firstName lastName patientId phone')
      .populate('billId')
      .populate('claimId', 'claimId diagnosisName approvedAmount patientLiability claimAmount');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('patientId', 'firstName lastName patientId')
      .populate('claimId', 'claimId diagnosisName');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
