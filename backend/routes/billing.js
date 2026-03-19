const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');
const InsurancePolicy = require('../models/InsurancePolicy');
const Claim = require('../models/Claim');
const axios = require('axios');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Get all bills
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.paymentStatus = status;
    if (patientId) query.patient = patientId;

    const bills = await Bill.find(query)
      .populate('patient', 'firstName lastName patientId')
      .populate('appointment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      bills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient')
      .populate('appointment');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new bill
router.post('/', auth, [
  body('patient').notEmpty(),
  body('items').isArray(),
  body('subtotal').isNumeric(),
  body('totalAmount').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const billData = { ...req.body, createdBy: req.user.id };
    if (billData.paymentMethod === '') delete billData.paymentMethod;
    const bill = new Bill(billData);

    await bill.save();

    const populatedBill = await Bill.findById(bill._id)
      .populate('patient', 'firstName lastName patientId');

    res.status(201).json({
      message: 'Bill created successfully',
      bill: populatedBill
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bill
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.paymentMethod === '') delete updateData.paymentMethod;
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('patient', 'firstName lastName patientId');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({
      message: 'Bill updated successfully',
      bill
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bill
router.delete('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/billing/:id/pay — record payment, auto-submit insurance claim if method is Insurance
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { paidAmount, paymentMethod, insuranceData } = req.body;
    // insuranceData: { policyId, diagnosisCode, diagnosisName, treatmentCode, doctorId }

    const bill = await Bill.findById(req.params.id).populate('patient');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.paidAmount = paidAmount;
    bill.paymentMethod = paymentMethod;

    if (paidAmount >= bill.totalAmount) {
      bill.paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      bill.paymentStatus = 'Partially Paid';
    }

    let claimResult = null;

    if (paymentMethod === 'Insurance' && insuranceData) {
      const { policyId, diagnosisCode, diagnosisName, treatmentCode, doctorId } = insuranceData;

      // Validate policy
      const policy = await InsurancePolicy.findById(policyId);
      if (!policy) return res.status(404).json({ message: 'Insurance policy not found' });
      if (policy.status !== 'active') return res.status(400).json({ message: 'Policy is not active' });

      const claimAmount = bill.totalAmount;

      // Build ML features
      const now = new Date();
      const policyAgeDays = Math.floor((now - policy.startDate) / (1000 * 60 * 60 * 24));
      const coverageUsedPct = policy.usedAmount / policy.coverageAmount;
      const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
      const recentClaims = await Claim.find({ patientId: bill.patient._id, claimDate: { $gte: ninetyDaysAgo } });
      const claimsLast90Days = recentClaims.length;
      const lastClaim = await Claim.findOne({ patientId: bill.patient._id }).sort({ claimDate: -1 });
      const daysSinceLastClaim = lastClaim ? Math.floor((now - lastClaim.claimDate) / (1000 * 60 * 60 * 24)) : 999;
      const duplicate = await Claim.findOne({ patientId: bill.patient._id, diagnosisCode, treatmentCode, claimDate: { $gte: ninetyDaysAgo } });
      const isDuplicate = duplicate ? 1 : 0;
      const patientAge = bill.patient?.dateOfBirth
        ? Math.floor((now - new Date(bill.patient.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))
        : 35;
      const BENCHMARKS = { D001: 5000, D002: 8000, D003: 12000, D004: 3000, D005: 15000, D006: 6000, D007: 9000, D008: 4000, D009: 20000, D010: 7000 };
      const benchmark = BENCHMARKS[diagnosisCode] || 6000;
      const amountVsBenchmark = claimAmount / benchmark;
      const RISK_SCORES = { D001: 0.2, D002: 0.3, D003: 0.5, D004: 0.1, D005: 0.7, D006: 0.2, D007: 0.4, D008: 0.1, D009: 0.8, D010: 0.3 };
      const diagnosisRiskScore = RISK_SCORES[diagnosisCode] || 0.3;

      const mlFeatures = { claimAmount, amountVsBenchmark, claimsLast90Days, daysSinceLastClaim, isDuplicate, policyAgeDays, patientAge, coverageUsedPct, diagnosisRiskScore };

      let fraudScore = -1;
      let fraudReasons = [];
      try {
        const mlRes = await axios.post(`${ML_SERVICE_URL}/insurance/fraud_detect`, mlFeatures, { timeout: 5000 });
        fraudScore = mlRes.data.fraudScore;
        fraudReasons = mlRes.data.fraudReasons || [];
      } catch (mlErr) {
        console.warn('ML service unreachable, proceeding without fraud score');
      }

      const status = fraudScore > 0.75 ? 'flagged' : 'pending';

      const claim = new Claim({
        patientId: bill.patient._id,
        policyId: policy._id,
        doctorId: doctorId || req.user._id,
        diagnosisCode,
        diagnosisName,
        treatmentCode,
        claimAmount,
        fraudScore,
        fraudReasons,
        status
      });
      await claim.save();

      bill.insuranceClaimId = claim._id;
      claimResult = { claimId: claim.claimId, status: claim.status, fraudScore };
    }

    await bill.save();

    res.json({ message: 'Payment recorded', bill, claim: claimResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
