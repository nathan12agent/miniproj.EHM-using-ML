const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const InsurancePolicy = require('../models/InsurancePolicy');
const Claim = require('../models/Claim');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

// ── Shared validation helper ────────────────────────────────────────────────
async function validatePolicy(policyNumber, diagnosisCode, billAmount, diagnosisName) {
  const policy = await InsurancePolicy.findOne({ policyNumber });
  if (!policy) return { isValid: false, reason: 'Policy not found', status: 404 };
  if (policy.status !== 'active') {
    return { isValid: false, reason: `Policy is not active (status: ${policy.status})`, policy };
  }
  if (new Date() > policy.expiryDate) {
    policy.status = 'expired';
    await policy.save();
    return { isValid: false, reason: `Policy expired on ${policy.expiryDate.toDateString()}`, policy };
  }

  // Fuzzy diagnosis matching — match by code OR name, case-insensitive
  if (policy.coveredDiagnoses.length > 0 && (diagnosisCode || diagnosisName)) {
    const codeInput = (diagnosisCode || '').toLowerCase().trim();
    const nameInput = (diagnosisName || '').toLowerCase().trim();
    const isCovered = policy.coveredDiagnoses.some(covered => {
      const c = covered.toLowerCase();
      return (
        c === codeInput ||
        c === nameInput ||
        (nameInput && c.includes(nameInput)) ||
        (nameInput && nameInput.includes(c)) ||
        (codeInput && c.includes(codeInput))
      );
    });
    if (!isCovered) {
      return {
        isValid: false,
        reason: `Diagnosis "${diagnosisName || diagnosisCode}" is not covered by this policy. Covered conditions: ${policy.coveredDiagnoses.join(', ')}`,
        coveredDiagnoses: policy.coveredDiagnoses,
        policy
      };
    }
  }

  const available = policy.coverageAmount - policy.usedAmount;
  if (billAmount && (policy.usedAmount + billAmount) > policy.coverageAmount) {
    return { isValid: false, reason: 'Coverage limit exceeded', remaining: available, policy };
  }
  const approvedAmount = billAmount ? Math.min(billAmount, available) : available;
  const patientLiability = billAmount ? billAmount - approvedAmount : 0;
  return {
    isValid: true,
    policy,
    coverageAmount: policy.coverageAmount,
    usedAmount: policy.usedAmount,
    availableCoverage: available,
    approvedAmount,
    patientLiability
  };
}

// POST /api/insurance/validate
router.post('/validate', auth, async (req, res) => {
  try {
    const { policyNumber, patientId, diagnosisCode, diagnosisName, billAmount } = req.body;
    if (!policyNumber) return res.status(400).json({ message: 'policyNumber is required' });
    const result = await validatePolicy(policyNumber, diagnosisCode, billAmount, diagnosisName);
    if (result.status === 404) return res.status(404).json({ isValid: false, reason: result.reason });
    const { policy, ...rest } = result;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/insurance/claim/submit
router.post('/claim/submit', auth, async (req, res) => {
  try {
    const { patientId, policyNumber, doctorId, diagnosisCode, diagnosisName, treatmentCode, billAmount } = req.body;
    if (!patientId || !policyNumber || !diagnosisCode || !diagnosisName || !treatmentCode || !billAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const validation = await validatePolicy(policyNumber, diagnosisCode, billAmount, diagnosisName);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.reason, remaining: validation.remaining });
    }
    const { policy, approvedAmount, patientLiability } = validation;

    let fraudScore = 0;
    let fraudReasons = [];
    let isFlagged = false;
    try {
      const mlRes = await axios.post(`${ML_SERVICE_URL}/insurance/fraud_detect`, {
        claimAmount: billAmount,
        diagnosisCode: diagnosisName,
        patientId: String(patientId),
        policyNumber
      }, { timeout: 5000 });
      fraudScore = mlRes.data.fraudScore || 0;
      fraudReasons = mlRes.data.reasons || [];
      isFlagged = mlRes.data.isFraud || false;
    } catch (mlErr) {
      console.warn('ML service unreachable, proceeding without fraud score');
    }

    const status = isFlagged ? 'flagged' : 'pending';

    const claim = new Claim({
      patientId,
      policyId: policy._id,
      doctorId: doctorId || req.user._id,
      diagnosisCode,
      diagnosisName,
      treatmentCode,
      claimAmount: billAmount,
      approvedAmount,
      patientLiability,
      fraudScore,
      fraudReasons,
      status
    });
    await claim.save();

    res.status(201).json({ claim, fraudScore, isFlagged });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/insurance/claim/:claimId/review 
router.patch('/claim/:claimId/review', auth, requireRole('Administrator'), async (req, res) => {
  try {
    const { status, adminNote, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    if (!['pending', 'flagged'].includes(claim.status)) {
      return res.status(400).json({ message: 'Claim cannot be reviewed in current status' });
    }

    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    if (adminNote) claim.adminNote = adminNote;

    if (status === 'approved') {
      claim.status = 'approved';
      await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
        $inc: { usedAmount: claim.approvedAmount }
      });
    } else {
      claim.status = 'rejected';
      claim.approvedAmount = 0;
      claim.rejectionReason = rejectionReason || 'Claim rejected by admin';

      const bill = await Bill.findOne({ insuranceClaimId: claim._id });
      if (bill) {
        if (bill.paymentStatus === 'Paid') {
          await Payment.findOneAndUpdate(
            { billId: bill._id, status: 'success' },
            { status: 'refunded', refundReason: 'Insurance claim rejected', refundedAt: new Date() }
          );
        }
        bill.paymentStatus = 'Pending';
        bill.paidAmount = 0;
        bill.insuranceClaimId = undefined;
        await bill.save();

        if (bill.insuranceCovered > 0) {
          await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
            $inc: { usedAmount: -bill.insuranceCovered }
          });
        }
      }
    }

    await claim.save();
    res.json({
      success: true,
      claim,
      message: status === 'rejected'
        ? 'Claim rejected. Bill reverted to full amount unpaid.'
        : 'Claim approved. Insurance deducted from bill.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/claims
router.get('/claims', auth, requireRole('Administrator'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('patientId', 'firstName lastName patientId')
        .populate('doctorId', 'firstName lastName specialization')
        .populate('policyId', 'policyId policyNumber providerName coverageType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(filter)
    ]);

    res.json({ claims, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/patient/:patientId/active-claim
router.get('/patient/:patientId/active-claim', auth, async (req, res) => {
  try {
    const claim = await Claim.findOne({
      patientId: req.params.patientId,
      status: 'approved'
    })
      .populate('policyId', 'providerName policyNumber')
      .sort({ reviewedAt: -1 });
    if (!claim) return res.status(404).json({ message: 'No approved claim found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/patient/:patientId/policy — auto-fill for claim form
router.get('/patient/:patientId/policy', auth, async (req, res) => {
  try {
    const policy = await InsurancePolicy.findOne({
      patientId: req.params.patientId,
      status: 'active'
    }).sort({ createdAt: -1 });
    if (!policy) return res.json({ policy: null });
    if (new Date() > policy.expiryDate) {
      policy.status = 'expired';
      await policy.save();
      return res.json({ policy: null });
    }
    res.json({ policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/policy/:patientId — legacy route
router.get('/policy/:patientId', auth, async (req, res) => {
  try {
    const policy = await InsurancePolicy.findOne({ patientId: req.params.patientId })
      .sort({ createdAt: -1 });
    if (!policy) return res.status(404).json({ message: 'No insurance policy found' });
    if (policy.status === 'active' && new Date() > policy.expiryDate) {
      policy.status = 'expired';
      await policy.save();
    }
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/policies
router.get('/policies', auth, requireRole('Administrator'), async (req, res) => {
  try {
    const policies = await InsurancePolicy.find()
      .populate('patientId', 'firstName lastName patientId')
      .sort({ createdAt: -1 });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/insurance/policy
router.post('/policy', auth, requireRole('Administrator'), async (req, res) => {
  try {
    const policy = new InsurancePolicy(req.body);
    await policy.save();
    res.status(201).json(policy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/insurance/seed
router.post('/seed', auth, requireRole('Administrator'), async (req, res) => {
  try {
    const patients = await Patient.find().limit(4);
    const doctors = await Doctor.find().limit(2);
    if (patients.length === 0) return res.status(400).json({ message: 'No patients found. Seed patients first.' });

    const coverageTypes = ['Basic', 'Standard', 'Premium', 'Comprehensive'];
    const policies = [];
    for (let i = 0; i < Math.min(4, patients.length); i++) {
      const p = new InsurancePolicy({
        patientId: patients[i]._id,
        providerName: ['Star Health', 'HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz'][i],
        policyNumber: `POL-2024-${String(i + 1).padStart(4, '0')}`,
        coverageType: coverageTypes[i],
        coverageAmount: [100000, 300000, 500000, 1000000][i],
        startDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-12-31'),
        coveredDiagnoses: ['D001', 'D002', 'D003', 'Hypertension', 'Diabetes Type 2', 'Fracture - Left Tibia']
      });
      await p.save();
      policies.push(p);
    }

    const statuses = ['pending', 'approved', 'rejected', 'flagged'];
    const claims = [];
    for (let i = 0; i < Math.min(4, policies.length); i++) {
      const billAmt = [5000, 8000, 12000, 20000][i];
      const approvedAmt = statuses[i] === 'approved' ? billAmt : 0;
      const c = new Claim({
        patientId: policies[i].patientId,
        policyId: policies[i]._id,
        doctorId: doctors[i % doctors.length]?._id || patients[0]._id,
        diagnosisCode: `D00${i + 1}`,
        diagnosisName: ['Hypertension', 'Diabetes Type 2', 'Fracture - Left Tibia', 'Appendicitis'][i],
        treatmentCode: `T00${i + 1}`,
        claimAmount: billAmt,
        approvedAmount: approvedAmt,
        patientLiability: billAmt - approvedAmt,
        status: statuses[i],
        fraudScore: [0.1, 0.3, 0.6, 0.85][i],
        fraudReasons: i === 3 ? ['Claim amount significantly exceeds diagnosis benchmark'] : []
      });
      await c.save();
      claims.push(c);
    }

    res.json({ message: 'Seeded successfully', policies: policies.length, claims: claims.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Alias: /claims/:claimId/review
router.patch('/claims/:claimId/review', auth, requireRole('Administrator'), async (req, res) => {
  try {
    const { status, adminNote, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    if (!['pending', 'flagged'].includes(claim.status)) {
      return res.status(400).json({ message: 'Claim cannot be reviewed in current status' });
    }

    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    if (adminNote) claim.adminNote = adminNote;

    if (status === 'approved') {
      claim.status = 'approved';
      await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
        $inc: { usedAmount: claim.approvedAmount }
      });
    } else {
      claim.status = 'rejected';
      claim.approvedAmount = 0;
      claim.rejectionReason = rejectionReason || 'Claim rejected by admin';

      const bill = await Bill.findOne({ insuranceClaimId: claim._id });
      if (bill) {
        if (bill.paymentStatus === 'Paid') {
          await Payment.findOneAndUpdate(
            { billId: bill._id, status: 'success' },
            { status: 'refunded', refundReason: 'Insurance claim rejected', refundedAt: new Date() }
          );
        }
        bill.paymentStatus = 'Pending';
        bill.paidAmount = 0;
        bill.insuranceClaimId = undefined;
        await bill.save();

        if (bill.insuranceCovered > 0) {
          await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
            $inc: { usedAmount: -bill.insuranceCovered }
          });
        }
      }
    }

    await claim.save();
    res.json({
      success: true,
      claim,
      message: status === 'rejected'
        ? 'Claim rejected. Bill reverted to full amount unpaid.'
        : 'Claim approved. Insurance deducted from bill.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
