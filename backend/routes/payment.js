const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { billId, billAmount, insuranceCovered, patientId, claimId } = req.body;

    if (!billAmount || billAmount <= 0 || !Number.isInteger(Number(billAmount))) {
      return res.status(400).json({ message: 'Invalid amount. Must be a positive integer (in paise).' });
    }

    const patientLiability = billAmount - (insuranceCovered || 0);
    const amountInPaise = Math.round(patientLiability * 100); // Convert to paise

    if (amountInPaise <= 0) {
      return res.status(400).json({ message: 'Patient liability must be greater than 0' });
    }

    // Create payment record first to get paymentId
    const payment = new Payment({
      patientId: patientId || req.user._id,
      billId,
      claimId,
      billAmount,
      insuranceCovered: insuranceCovered || 0,
      status: 'pending'
    });
    await payment.save();

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: payment.paymentId,
      notes: { paymentId: payment.paymentId }
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    res.json({
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      paymentId: payment.paymentId,
      receipt: payment.paymentId
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    // Check for duplicate completed payment
    const existing = await Payment.findOne({ razorpayOrderId, status: 'completed' });
    if (existing) {
      return res.status(409).json({ message: 'Payment already completed', payment: existing });
    }

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Verify HMAC-SHA256 signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpaySignature, 'hex')
    );

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Generate receipt number
    const receiptCount = await Payment.countDocuments({ status: 'completed' });
    const receiptNumber = `RCP${String(receiptCount + 1).padStart(6, '0')}`;

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'completed';
    payment.amountPaid = payment.patientLiability;
    payment.paymentMethod = paymentMethod || 'UPI';
    payment.receiptNumber = receiptNumber;
    await payment.save();

    // Update linked bill
    if (payment.billId) {
      await Bill.findByIdAndUpdate(payment.billId, { paymentStatus: 'Paid', paidAmount: payment.amountPaid });
    }

    res.json({ message: 'Payment verified successfully', payment });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('billId', 'billId totalAmount')
      .populate('claimId', 'claimId diagnosisName');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/receipt/:paymentId
router.get('/receipt/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId })
      .populate('patientId', 'name patientId')
      .populate('billId', 'billId totalAmount items')
      .populate('claimId', 'claimId diagnosisName approvedAmount');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
