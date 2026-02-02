const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');

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

    const bill = new Bill({
      ...req.body,
      createdBy: req.user.id
    });

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
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
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

module.exports = router;
