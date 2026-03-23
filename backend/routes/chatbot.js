const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatbotService = require('../services/chatbotService');
const AdminRequest = require('../models/AdminRequest');
const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');

// Name extraction patterns — tries to pull a person's name from natural language
const NAME_PATTERNS = [
  /is\s+(?:dr\.?\s+|nurse\s+)?([a-z]+)\s+(?:available|free|on\s+duty|working|there)/i,
  /(?:dr\.?\s+|nurse\s+)([a-z]+)\s+(?:available|free|on\s+duty|working)/i,
  /check\s+(?:if\s+)?(?:dr\.?\s+|nurse\s+)?([a-z]+)/i,
  /find\s+(?:dr\.?\s+|nurse\s+)?([a-z]+)/i,
  /([a-z]{3,})\s+(?:available|free|on\s+duty|working)\??$/i,
];

const STOP_WORDS = new Set([
  'any', 'the', 'all', 'now', 'bed', 'icu', 'ward', 'room', 'next',
  'free', 'who', 'what', 'when', 'how', 'many', 'some', 'nurse',
  'doctor', 'staff', 'duty', 'shift', 'available', 'working'
]);

function extractName(msg) {
  for (const pattern of NAME_PATTERNS) {
    const match = msg.match(pattern);
    if (match && match[1] && match[1].length > 2 && !STOP_WORDS.has(match[1].toLowerCase())) {
      return match[1];
    }
  }
  return null;
}

// POST /api/chatbot/query
router.post('/query', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Check chatAccess
    const doctorRecord = await Doctor.findOne({ userId: req.user._id });
    if (doctorRecord && !doctorRecord.chatAccess) {
      return res.status(403).json({ message: 'Chat access not enabled. Please contact admin to enable it.' });
    }

    const lower = message.toLowerCase().trim();
    let response = '';
    let data = null;

    // ── STEP A: try to extract a person name first ──
    const extractedName = extractName(lower);

    if (extractedName) {
      // ── STEP B: search all staff by name ──
      const results = await chatbotService.findAnyStaffByName(extractedName);
      data = { results };

      if (results.length === 0) {
        // Fetch a couple of real names to suggest
        const [sampleNurse, sampleDoctor] = await Promise.all([
          Nurse.findOne({}, 'firstName').lean(),
          Doctor.findOne({ status: 'Active' }, 'firstName').lean()
        ]);
        const nurseExample = sampleNurse?.firstName || 'Anita';
        const doctorExample = sampleDoctor?.firstName || 'Sarah';
        response = `I couldn't find any staff member named "${extractedName}". Please check the spelling or try their full name.\n\nExamples you can try:\n• "Is ${nurseExample} available?"\n• "Is Dr. ${doctorExample} free?"`;
      } else if (results.length === 1) {
        const r = results[0];
        response = `${r.role} ${r.name} is ${r.statusText}.`;
      } else {
        response = `I found ${results.length} staff members matching "${extractedName}":\n`;
        results.forEach(r => {
          response += `• ${r.role} ${r.name} — ${r.statusText}\n`;
        });
      }

    // ── STEP C: keyword-based fallback ──
    } else if (lower.includes('nurse') && (lower.includes('available') || lower.includes('duty') || lower.includes('on duty'))) {
      data = await chatbotService.getNurseAvailability();
      response = `Currently ${data.onDuty} nurses are on duty, ${data.onBreak} on break, and ${data.offDuty} off duty. ${data.available} nurses are available for new patient assignments.`;

    } else if (lower.includes('nurse') && (lower.includes('morning') || lower.includes('evening') || lower.includes('night'))) {
      const shift = lower.includes('morning') ? 'Morning' : lower.includes('evening') ? 'Evening' : 'Night';
      data = await chatbotService.getNursesOnDuty(shift);
      response = data.length > 0
        ? `${shift} shift nurses on duty: ${data.map(n => `${n.name} (${n.ward}, ${n.patients}/${n.maxPatients} patients)`).join(', ')}`
        : `No nurses currently on duty for the ${shift} shift.`;

    } else if (lower.includes('bed') && (lower.includes('available') || lower.includes('free') || lower.includes('empty'))) {
      const wardMatch = lower.match(/\b(icu|general|emergency|pediatric|maternity)\b/i);
      const ward = wardMatch ? wardMatch[1].charAt(0).toUpperCase() + wardMatch[1].slice(1).toLowerCase() : null;
      const wardFormatted = ward === 'Icu' ? 'ICU' : ward;
      data = await chatbotService.getBedAvailability(wardFormatted);
      response = `Bed availability${wardFormatted ? ` in ${wardFormatted}` : ''}: ${data.available} available, ${data.occupied} occupied, ${data.maintenance} under maintenance.`;
      if (data.availableBeds.length > 0) {
        response += ` Available beds: ${data.availableBeds.map(b => `${b.number} (${b.ward})`).join(', ')}.`;
      }

    } else if (lower.includes('bed') && lower.match(/\b[a-z]-?\d+\b/i)) {
      const bedMatch = lower.match(/\b([a-z]-?\d+)\b/i);
      if (bedMatch) {
        data = await chatbotService.getBedByNumber(bedMatch[1].toUpperCase());
        response = data
          ? `Bed ${data.bedNumber} (${data.ward}): ${data.status}${data.patient ? `, assigned to ${data.patient}` : ''}.`
          : `Bed ${bedMatch[1].toUpperCase()} not found.`;
      }

    } else if (lower.includes('doctor') && (lower.includes('available') || lower.includes('active'))) {
      const specMatch = lower.match(/\b(cardio|neuro|ortho|pediatr|gynec|dermat|psychiatr|general|surgery|oncol|endocrin|gastro|pulmon|nephro|ophthal|ent|urol|emergency|anesthes|radiol)\w*/i);
      data = await chatbotService.getDoctorAvailability(specMatch ? specMatch[0] : null);
      response = data.length > 0
        ? `Active doctors${specMatch ? ` (${specMatch[0]})` : ''}: ${data.map(d => `${d.name} - ${d.specialization}`).join(', ')}.`
        : 'No active doctors found for that specialization.';

    } else if (lower.includes('patient') && (lower.includes('count') || lower.includes('total') || lower.includes('how many'))) {
      data = await chatbotService.getAdmittedPatientCount();
      response = `There are currently ${data} active patients in the hospital.`;

    } else if (lower.includes('patient') && lower.length > 15) {
      const words = message.split(' ').filter(w => w.length > 2);
      const searchTerm = words[words.length - 1];
      data = await chatbotService.getPatientInfo(searchTerm);
      response = data.length > 0
        ? `Found patients: ${data.map(p => `${p.name} (${p.patientId}) - Doctor: ${p.assignedDoctor}`).join('; ')}.`
        : `No active patients found matching "${searchTerm}".`;

    } else if (lower.includes('summary') || lower.includes('overview') || lower.includes('hospital status')) {
      data = await chatbotService.getHospitalSummary();
      const { bedStats, nurseStats, patientCount, doctorCount } = data;
      response = `Hospital Summary: ${patientCount} active patients, ${doctorCount} active doctors, ${nurseStats.onDuty} nurses on duty, ${bedStats.available}/${bedStats.total} beds available.`;

    } else {
      // Smart fallback with real name examples
      const [sampleNurse, sampleDoctor] = await Promise.all([
        Nurse.findOne({}, 'firstName').lean(),
        Doctor.findOne({ status: 'Active' }, 'firstName').lean()
      ]);
      const nurseExample = sampleNurse?.firstName || 'Anita';
      const doctorExample = sampleDoctor?.firstName || 'Sarah';
      response = `I didn't understand that. Here are some things you can ask:\n• "Is ${nurseExample} available?" — check any staff by name\n• "Beds available"\n• "Nurses on duty now"\n• "Available doctors"\n• "Hospital summary"\n• "Contact admin: I need more medication in Ward A"`;
    }

    res.json({ response, data });
  } catch (err) {
    console.error('Chatbot query error:', err);
    res.status(500).json({ message: 'Failed to process query', error: err.message });
  }
});

// POST /api/chatbot/contact-admin
router.post('/contact-admin', auth, async (req, res) => {
  try {
    const { message, type, priority } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (doctor && !doctor.chatAccess) {
      return res.status(403).json({ message: 'Chat access not enabled. Please contact admin to enable it.' });
    }
    const doctorName = doctor
      ? `Dr. ${doctor.firstName} ${doctor.lastName}`
      : req.user.name || req.user.email;

    const AdminRequest = require('../models/AdminRequest');
    const request = new AdminRequest({
      fromDoctorId: doctor?._id || req.user._id,
      fromDoctorName: doctorName,
      type: type || 'general',
      message,
      priority: priority || 'medium'
    });

    await request.save();
    res.status(201).json({ message: 'Request sent to admin successfully', requestId: request.requestId });
  } catch (err) {
    console.error('Contact admin error:', err);
    res.status(500).json({ message: 'Failed to send request', error: err.message });
  }
});

// GET /api/chatbot/my-requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const AdminRequest = require('../models/AdminRequest');
    const requests = await AdminRequest.find({ fromDoctorId: doctor?._id || req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
  }
});

module.exports = router;
