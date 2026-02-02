const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/ml/predict/risk:
 *   post:
 *     summary: Predict patient risk scores
 *     tags: [ML]
 */
router.post('/predict/risk', auth, async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    const response = await axios.post(`${mlServiceUrl}/predict/risk`, req.body, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('ML service error:', error.message);
    res.status(503).json({ 
      message: 'ML service unavailable',
      error: error.message 
    });
  }
});

module.exports = router;
