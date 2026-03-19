const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const InsurancePolicy = require('../models/InsurancePolicy');
const Claim = require('../models/Claim');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Role guard middleware
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// GET /api/insurance/policy/:patientId
router.get('/policy/:patientId', auth, async (req, res) => {
  try {
    const policy = await InsurancePolicy.findOne({ patientId: req.params.patientId })
      .sort({ createdAt: -1 });
    if (!policy) return res.status(404).json({ message: 'No insurance policy found' });

    // Auto-expire if past expiry date
    if (policy.status === 'active' && new Date() > policy.expiryDate) {
      policy.status = 'expired';
      await policy.save();
    }
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/policies — list all policies (admin)
router.get('/policies', auth, requireRole('admin'), async (req, res) => {
  try {
    const policies = await InsurancePolicy.find().populate('patientId', 'name patientId').sort({ createdAt: -1 });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/insurance/policy — create policy (admin)
router.post('/policy', auth, requireRole('admin'), async (req, res) => {
  try {
    const policy = new InsurancePolicy(req.body);
    await policy.save();
    res.status(201).json(policy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/insurance/claim/submit
router.post('/claim/submit', auth, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { patientId, policyId, diagnosisCode, diagnosisName, treatmentCode, claimAmount, doctorId } = req.body;

    if (!patientId || !policyId || !diagnosisCode || !diagnosisName || !treatmentCode || !claimAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate policy
    const policy = await InsurancePolicy.findById(policyId);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    if (policy.status !== 'active') return res.status(400).json({ message: 'Policy is not active' });
    if (new Date() > policy.expiryDate) {
      policy.status = 'expired';
      await policy.save();
      return res.status(400).json({ message: 'Policy has expired' });
    }
    if (policy.usedAmount + claimAmount > policy.coverageAmount) {
      return res.status(400).json({ message: 'Claim amount exceeds remaining coverage' });
    }

    // Build ML features
    const now = new Date();
    const policyAgeDays = Math.floor((now - policy.startDate) / (1000 * 60 * 60 * 24));
    const coverageUsedPct = policy.usedAmount / policy.coverageAmount;

    // Count recent claims
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const recentClaims = await Claim.find({ patientId, claimDate: { $gte: ninetyDaysAgo } });
    const claimsLast90Days = recentClaims.length;

    // Days since last claim
    const lastClaim = await Claim.findOne({ patientId }).sort({ claimDate: -1 });
    const daysSinceLastClaim = lastClaim
      ? Math.floor((now - lastClaim.claimDate) / (1000 * 60 * 60 * 24))
      : 999;

    // Duplicate check
    const duplicate = await Claim.findOne({ patientId, diagnosisCode, treatmentCode, claimDate: { $gte: ninetyDaysAgo } });
    const isDuplicate = duplicate ? 1 : 0;

    // Patient age
    const patient = await Patient.findById(patientId);
    const patientAge = patient?.dateOfBirth
      ? Math.floor((now - new Date(patient.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))
      : 35;

    // Benchmark ratio
    const BENCHMARKS = { D001: 5000, D002: 8000, D003: 12000, D004: 3000, D005: 15000, D006: 6000, D007: 9000, D008: 4000, D009: 20000, D010: 7000 };
    const benchmark = BENCHMARKS[diagnosisCode] || 6000;
    const amountVsBenchmark = claimAmount / benchmark;

    const RISK_SCORES = { D001: 0.2, D002: 0.3, D003: 0.5, D004: 0.1, D005: 0.7, D006: 0.2, D007: 0.4, D008: 0.1, D009: 0.8, D010: 0.3 };
    const diagnosisRiskScore = RISK_SCORES[diagnosisCode] || 0.3;

    const mlFeatures = {
      claimAmount, amountVsBenchmark, claimsLast90Days, daysSinceLastClaim,
      isDuplicate, policyAgeDays, patientAge, coverageUsedPct, diagnosisRiskScore
    };

    // Call ML service
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
      patientId,
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

    res.status(201).json({ claim, fraudScore, fraudReasons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/insurance/claims — admin paginated list
router.get('/claims', auth, requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      Claim.find()
        .populate('patientId', 'name patientId')
        .populate('doctorId', 'name specialization')
        .populate('policyId', 'policyId providerName coverageType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments()
    ]);

    res.json({ claims, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/insurance/claims/:claimId/review
router.patch('/claims/:claimId/review', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status, approvedAmount } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    if (!['pending', 'flagged'].includes(claim.status)) {
      return res.status(400).json({ message: 'Claim cannot be reviewed in current status' });
    }

    claim.status = status;
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();

    if (status === 'approved') {
      claim.approvedAmount = approvedAmount || claim.claimAmount;
      // Increment policy usedAmount
      await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
        $inc: { usedAmount: claim.approvedAmount }
      });
    }

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/insurance/seed
router.post('/seed', auth, requireRole('admin'), async (req, res) => {
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
        coveredDiagnoses: ['D001', 'D002', 'D003']
      });
      await p.save();
      policies.push(p);
    }

    const statuses = ['pending', 'approved', 'rejected', 'flagged'];
    const claims = [];
    for (let i = 0; i < Math.min(4, policies.length); i++) {
      const c = new Claim({
        patientId: policies[i].patientId,
        policyId: policies[i]._id,
        doctorId: doctors[i % doctors.length]?._id || patients[0]._id,
        diagnosisCode: `D00${i + 1}`,
        diagnosisName: ['Hypertension', 'Diabetes', 'Fracture', 'Appendicitis'][i],
        treatmentCode: `T00${i + 1}`,
        claimAmount: [5000, 8000, 12000, 20000][i],
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

module.exports = router;
