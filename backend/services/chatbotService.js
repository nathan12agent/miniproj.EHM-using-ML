const Nurse = require('../models/Nurse');
const Bed = require('../models/Bed');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const chatbotService = {
  async getNurseAvailability() {
    const nurses = await Nurse.find({}, 'firstName lastName status shift ward assignedPatients maxPatientLoad');
    const onDuty = nurses.filter(n => n.status === 'On Duty');
    const onBreak = nurses.filter(n => n.status === 'On Break');
    const offDuty = nurses.filter(n => n.status === 'Off Duty');
    return {
      total: nurses.length,
      onDuty: onDuty.length,
      onBreak: onBreak.length,
      offDuty: offDuty.length,
      available: onDuty.filter(n => n.assignedPatients.length < n.maxPatientLoad).length
    };
  },

  async getNursesOnDuty(shift) {
    const query = { status: 'On Duty' };
    if (shift) query.shift = shift;
    const nurses = await Nurse.find(query, 'firstName lastName shift ward assignedPatients maxPatientLoad specialization');
    return nurses.map(n => ({
      name: `${n.firstName} ${n.lastName}`,
      shift: n.shift,
      ward: n.ward,
      patients: n.assignedPatients.length,
      maxPatients: n.maxPatientLoad,
      available: n.assignedPatients.length < n.maxPatientLoad,
      specialization: n.specialization
    }));
  },

  async getBedAvailability(ward) {
    const query = {};
    if (ward) query.ward = ward;
    const beds = await Bed.find(query, 'bedNumber ward status');
    const available = beds.filter(b => b.status === 'Available');
    const occupied = beds.filter(b => b.status === 'Occupied');
    const maintenance = beds.filter(b => b.status === 'Maintenance');
    const reserved = beds.filter(b => b.status === 'Reserved');
    return {
      total: beds.length,
      available: available.length,
      occupied: occupied.length,
      maintenance: maintenance.length,
      reserved: reserved.length,
      availableBeds: available.slice(0, 5).map(b => ({ number: b.bedNumber, ward: b.ward }))
    };
  },

  async getBedByNumber(bedNumber) {
    const bed = await Bed.findOne({ bedNumber }).populate('patient', 'firstName lastName patientId');
    if (!bed) return null;
    return {
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      status: bed.status,
      patient: bed.patient ? `${bed.patient.firstName} ${bed.patient.lastName} (${bed.patient.patientId})` : null,
      assignedDate: bed.assignedDate
    };
  },

  async getDoctorAvailability(specialization) {
    const query = { status: 'Active' };
    if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
    const doctors = await Doctor.find(query, 'firstName lastName specialization status metrics');
    return doctors.map(d => ({
      name: `Dr. ${d.firstName} ${d.lastName}`,
      specialization: d.specialization,
      totalPatients: d.metrics?.totalPatients || 0,
      satisfactionScore: d.metrics?.patientSatisfactionScore || 'N/A'
    }));
  },

  async getPatientInfo(query) {
    const patients = await Patient.find({
      $or: [
        { patientId: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ],
      status: 'Active'
    }, 'firstName lastName patientId status assignedDoctor').populate('assignedDoctor', 'firstName lastName specialization').limit(5);
    return patients.map(p => ({
      name: `${p.firstName} ${p.lastName}`,
      patientId: p.patientId,
      status: p.status,
      assignedDoctor: p.assignedDoctor ? `Dr. ${p.assignedDoctor.firstName} ${p.assignedDoctor.lastName} (${p.assignedDoctor.specialization})` : 'Unassigned'
    }));
  },

  async getAdmittedPatientCount() {
    const count = await Patient.countDocuments({ status: 'Active' });
    return count;
  },

  async getHospitalSummary() {
    const [bedStats, nurseStats, patientCount, doctorCount] = await Promise.all([
      this.getBedAvailability(),
      this.getNurseAvailability(),
      this.getAdmittedPatientCount(),
      Doctor.countDocuments({ status: 'Active' })
    ]);
    return { bedStats, nurseStats, patientCount, doctorCount };
  },

  // Search any staff (nurses + doctors) by partial first or last name
  async findAnyStaffByName(name) {
    const nameRegex = { $regex: name, $options: 'i' };
    // Strip "Dr." prefix if present for doctor search
    const strippedName = name.replace(/^dr\.?\s*/i, '').trim();
    const strippedRegex = { $regex: strippedName, $options: 'i' };

    const [nurses, doctors] = await Promise.all([
      Nurse.find({
        $or: [{ firstName: nameRegex }, { lastName: nameRegex }]
      }, 'firstName lastName status shift ward assignedPatients maxPatientLoad'),
      Doctor.find({
        status: 'Active',
        $or: [
          { firstName: nameRegex },
          { lastName: nameRegex },
          { firstName: strippedRegex },
          { lastName: strippedRegex }
        ]
      }, 'firstName lastName specialization status')
    ]);

    const results = [];

    nurses.forEach(n => {
      const onDuty = n.status === 'On Duty';
      const onBreak = n.status === 'On Break';
      let statusText;
      if (onDuty) {
        statusText = `on duty now (${n.shift} shift) in ${n.ward} ward`;
      } else if (onBreak) {
        statusText = `currently on break (${n.shift} shift), ward: ${n.ward}`;
      } else {
        statusText = `not on duty right now — their shift is ${n.shift}`;
      }
      results.push({
        type: 'nurse',
        name: `${n.firstName} ${n.lastName}`,
        role: 'Nurse',
        ward: n.ward,
        shift: n.shift,
        available: onDuty,
        statusText
      });
    });

    doctors.forEach(d => {
      results.push({
        type: 'doctor',
        name: `Dr. ${d.firstName} ${d.lastName}`,
        role: 'Doctor',
        specialization: d.specialization,
        available: d.status === 'Active',
        statusText: `active in ${d.specialization}`
      });
    });

    return results;
  }
};

module.exports = chatbotService;
