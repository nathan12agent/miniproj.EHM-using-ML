const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AdminRequest = require('../models/AdminRequest');

// GET /api/admin/requests
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    const requests = await AdminRequest.find(query).sort({ createdAt: -1 });
    const pendingCount = await AdminRequest.countDocuments({ status: 'pending' });
    res.json({ requests, pendingCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
  }
});

// PATCH /api/admin/requests/:requestId
router.patch('/:requestId', auth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === 'resolved') update.resolvedAt = new Date();

    const request = await AdminRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      { $set: update },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
});

module.exports = router;
