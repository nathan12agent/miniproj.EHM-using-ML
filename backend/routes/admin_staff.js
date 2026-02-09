const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const auth = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

/**
 * @route   GET /api/admin/staff
 * @desc    Get all staff with optional filters
 * @access  Admin only
 */
router.get('/', async (req, res) => {
  try {
    const { role, department, status, search } = req.query;
    
    let query = {};
    
    if (role && role !== 'all') query.role = role;
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.currentStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/staff/stats
 * @desc    Get dashboard KPIs
 * @access  Admin only
 */
router.get('/stats', async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const onDuty = await Staff.countDocuments({ currentStatus: 'On-Duty' });
    
    // Calculate average absenteeism risk
    const staffWithRisk = await Staff.find({ 
      'absenteeismRisk.probability': { $exists: true } 
    });
    const avgAbsenteeismRisk = staffWithRisk.length > 0
      ? staffWithRisk.reduce((sum, s) => sum + (s.absenteeismRisk?.probability || 0), 0) / staffWithRisk.length
      : 0;
    
    // Count high burnout risk staff
    const highBurnoutCount = await Staff.countDocuments({ 
      'burnoutRisk.level': 'High' 
    });
    
    // Check for shortage alerts (mock logic - can be enhanced)
    const shortageAlert = 0; // TODO: Implement actual shortage detection
    
    res.json({
      success: true,
      totalStaff,
      onDuty,
      shortageAlert,
      avgAbsenteeismRisk: parseFloat(avgAbsenteeismRisk.toFixed(2)),
      highBurnoutCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/staff/:id
 * @desc    Get single staff member by ID
 * @access  Admin only
 */
router.get('/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/staff
 * @desc    Create new staff member
 * @access  Admin only
 */
router.post('/', async (req, res) => {
  try {
    const {
      staffId, name, role, department, email, phone,
      experienceYears, specialization, shiftPreference,
      distanceFromHospital, performanceRating
    } = req.body;
    
    // Check if staff ID already exists
    const existingStaff = await Staff.findOne({ staffId });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID already exists'
      });
    }
    
    const newStaff = new Staff({
      staffId,
      name,
      role,
      department,
      email,
      phone,
      experienceYears,
      specialization,
      shiftPreference,
      distanceFromHospital,
      performanceRating,
      currentStatus: 'Off-Duty'
    });
    
    await newStaff.save();
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: newStaff
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/staff/:id
 * @desc    Update staff member
 * @access  Admin only
 */
router.put('/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/staff/:id
 * @desc    Delete staff member
 * @access  Admin only
 */
router.delete('/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member',
      error: error.message
    });
  }
});

module.exports = router;
