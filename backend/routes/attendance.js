const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

// Clock In
router.post('/clock-in', auth, [
  body('staffModel').isIn(['User', 'Doctor']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      staff: req.user.id,
      date: { $gte: today }
    });

    if (existingAttendance && existingAttendance.clockIn.time) {
      return res.status(400).json({ 
        message: 'Already clocked in today',
        attendance: existingAttendance
      });
    }

    const attendance = new Attendance({
      staff: req.user.id,
      staffModel: req.body.staffModel || 'User',
      date: new Date(),
      clockIn: {
        time: new Date(),
        location: req.body.location,
        device: req.headers['user-agent'],
        ipAddress: req.ip
      },
      shift: req.body.shift || 'General'
    });

    await attendance.save();

    res.status(201).json({
      message: 'Clocked in successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clock Out
router.post('/clock-out', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      staff: req.user.id,
      date: { $gte: today },
      'clockOut.time': { $exists: false }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No active clock-in found for today' });
    }

    attendance.clockOut = {
      time: new Date(),
      location: req.body.location,
      device: req.headers['user-agent'],
      ipAddress: req.ip
    };

    await attendance.save();

    res.json({
      message: 'Clocked out successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Break
router.post('/break/start', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      staff: req.user.id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    attendance.breaks.push({
      breakStart: new Date(),
      reason: req.body.reason
    });

    await attendance.save();

    res.json({
      message: 'Break started',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End Break
router.post('/break/end', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      staff: req.user.id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (!lastBreak || lastBreak.breakEnd) {
      return res.status(400).json({ message: 'No active break found' });
    }

    lastBreak.breakEnd = new Date();
    const diffMs = lastBreak.breakEnd - lastBreak.breakStart;
    lastBreak.duration = Math.floor(diffMs / 60000); // minutes

    await attendance.save();

    res.json({
      message: 'Break ended',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Today's Attendance
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      staff: req.user.id,
      date: { $gte: today }
    }).populate('staff', 'name email');

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Attendance Records (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, staffId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (staffId) query.staff = staffId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendances = await Attendance.find(query)
      .populate('staff', 'name email')
      .sort({ date: -1, 'clockIn.time': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendances,
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

// Get Attendance by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('staff', 'name email')
      .populate('approvedBy', 'name');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Attendance Summary
router.get('/summary/:staffId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Attendance.getAttendanceSummary(
      req.params.staffId,
      start,
      end
    );

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Attendance (Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        approvedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('staff', 'name email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Attendance (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Attendance Statistics (Admin)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    const totalStaff = await Attendance.distinct('staff', {
      date: { $gte: start, $lte: end }
    });

    res.json({
      stats,
      totalStaff: totalStaff.length,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
