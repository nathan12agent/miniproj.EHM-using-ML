/**
 * Auto-Assignment Service
 * Intelligently assigns doctors, beds, and nurses to patients
 */

const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');

class AutoAssignmentService {
  /**
   * Auto-assign doctor based on patient condition and department
   */
  static async assignDoctor(patientData) {
    try {
      const { diagnosis, department, severity } = patientData;
      
      // Priority 1: Find doctors in the specific department
      let doctors = await Doctor.find({
        $or: [
          { department: department },
          { specialization: { $regex: department, $options: 'i' } }
        ]
      }).sort({ patientsAttended: 1 }); // Prefer doctors with fewer patients
      
      // Priority 2: If critical, prefer experienced doctors
      if (severity === 'Critical' && doctors.length > 0) {
        doctors = doctors.filter(d => d.experience >= 10);
      }
      
      // Priority 3: Check availability
      const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      const availableDoctors = doctors.filter(d => d.availability[today]?.available);
      
      if (availableDoctors.length > 0) {
        // Return doctor with highest rating and lowest patient load
        const sortedDoctors = availableDoctors.sort((a, b) => {
          const scoreA = parseFloat(a.rating) - (a.patientsAttended / 100);
          const scoreB = parseFloat(b.rating) - (b.patientsAttended / 100);
          return scoreB - scoreA;
        });
        
        return sortedDoctors[0];
      }
      
      // Fallback: Return any doctor from the department
      return doctors.length > 0 ? doctors[0] : null;
    } catch (error) {
      console.error('Error assigning doctor:', error);
      return null;
    }
  }

  /**
   * Auto-assign bed based on patient needs and availability
   */
  static async assignBed(patientData) {
    try {
      const { department, severity, needsICU } = patientData;
      
      let query = { status: 'Available' };
      
      // Priority 1: ICU beds for critical patients
      if (needsICU || severity === 'Critical') {
        query.department = 'ICU';
        query.type = 'ICU';
      } else {
        // Priority 2: Department-specific beds
        query.$or = [
          { department: department },
          { department: 'General Ward' }
        ];
      }
      
      const availableBeds = await Bed.find(query).sort({ lastCleaned: -1 }); // Prefer recently cleaned beds
      
      if (availableBeds.length > 0) {
        return availableBeds[0];
      }
      
      // Fallback: Any available bed
      const anyBed = await Bed.findOne({ status: 'Available' });
      return anyBed;
    } catch (error) {
      console.error('Error assigning bed:', error);
      return null;
    }
  }

  /**
   * Auto-assign nurse based on department and workload
   */
  static async assignNurse(bedData) {
    try {
      if (!bedData) return null;
      
      const { department } = bedData;
      
      // Find nurses in the same department who are on duty
      const nurses = await Nurse.find({
        department: department,
        currentStatus: 'On-Duty'
      }).populate('assignedBeds');
      
      if (nurses.length === 0) {
        // Fallback: Any on-duty nurse
        const anyNurse = await Nurse.findOne({ currentStatus: 'On-Duty' });
        return anyNurse;
      }
      
      // Sort by workload (number of assigned beds)
      const sortedNurses = nurses.sort((a, b) => {
        return (a.assignedBeds?.length || 0) - (b.assignedBeds?.length || 0);
      });
      
      // Return nurse with least workload (max 5 patients per nurse)
      const selectedNurse = sortedNurses[0];
      if (selectedNurse.assignedBeds?.length < 5) {
        return selectedNurse;
      }
      
      return null; // All nurses at capacity
    } catch (error) {
      console.error('Error assigning nurse:', error);
      return null;
    }
  }

  /**
   * Complete auto-assignment for a patient
   */
  static async autoAssignAll(patientData) {
    try {
      console.log('🔄 Starting auto-assignment for patient:', patientData.name);
      
      const assignments = {
        doctor: null,
        bed: null,
        nurse: null,
        success: false,
        message: ''
      };
      
      // Step 1: Assign Doctor
      const doctor = await this.assignDoctor(patientData);
      if (doctor) {
        assignments.doctor = doctor._id;
        console.log(`✅ Assigned doctor: ${doctor.name}`);
      } else {
        assignments.message += 'No available doctor found. ';
        console.log('⚠️  No doctor available');
      }
      
      // Step 2: Assign Bed
      const bed = await this.assignBed(patientData);
      if (bed) {
        assignments.bed = bed._id;
        console.log(`✅ Assigned bed: ${bed.bedNumber}`);
        
        // Step 3: Assign Nurse (based on bed department)
        const nurse = await this.assignNurse(bed);
        if (nurse) {
          assignments.nurse = nurse._id;
          console.log(`✅ Assigned nurse: ${nurse.name}`);
          
          // Update nurse's assigned beds
          nurse.assignedBeds.push(bed._id);
          await nurse.save();
        } else {
          assignments.message += 'No available nurse found. ';
          console.log('⚠️  No nurse available');
        }
        
        // Update bed status
        bed.status = 'Occupied';
        bed.assignedPatient = patientData._id || null;
        bed.assignedNurse = assignments.nurse;
        await bed.save();
      } else {
        assignments.message += 'No available bed found. ';
        console.log('⚠️  No bed available');
      }
      
      // Update doctor's patient count
      if (doctor) {
        doctor.patientsAttended += 1;
        await doctor.save();
      }
      
      assignments.success = !!(assignments.doctor && assignments.bed);
      if (assignments.success) {
        assignments.message = 'Auto-assignment completed successfully';
      }
      
      return assignments;
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return {
        doctor: null,
        bed: null,
        nurse: null,
        success: false,
        message: `Auto-assignment failed: ${error.message}`
      };
    }
  }

  /**
   * Release assignments when patient is discharged
   */
  static async releaseAssignments(patientId) {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) return;
      
      // Release bed
      if (patient.assignedBed) {
        const bed = await Bed.findById(patient.assignedBed);
        if (bed) {
          bed.status = 'Available';
          bed.assignedPatient = null;
          bed.assignedNurse = null;
          bed.lastCleaned = new Date();
          await bed.save();
        }
      }
      
      // Remove patient from nurse's assigned beds
      if (patient.assignedNurse) {
        const nurse = await Nurse.findById(patient.assignedNurse);
        if (nurse) {
          nurse.assignedBeds = nurse.assignedBeds.filter(
            bedId => bedId.toString() !== patient.assignedBed.toString()
          );
          await nurse.save();
        }
      }
      
      console.log(`✅ Released assignments for patient: ${patient.name}`);
    } catch (error) {
      console.error('Error releasing assignments:', error);
    }
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStats() {
    try {
      const totalBeds = await Bed.countDocuments();
      const occupiedBeds = await Bed.countDocuments({ status: 'Occupied' });
      const availableBeds = totalBeds - occupiedBeds;
      
      const totalNurses = await Nurse.countDocuments();
      const onDutyNurses = await Nurse.countDocuments({ currentStatus: 'On-Duty' });
      
      const totalDoctors = await Doctor.countDocuments();
      
      const patientsWithDoctor = await Patient.countDocuments({ assignedDoctor: { $ne: null } });
      const patientsWithBed = await Patient.countDocuments({ assignedBed: { $ne: null } });
      const patientsWithNurse = await Patient.countDocuments({ assignedNurse: { $ne: null } });
      const totalPatients = await Patient.countDocuments();
      
      return {
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: availableBeds,
          occupancyRate: ((occupiedBeds / totalBeds) * 100).toFixed(1)
        },
        nurses: {
          total: totalNurses,
          onDuty: onDutyNurses,
          offDuty: totalNurses - onDutyNurses
        },
        doctors: {
          total: totalDoctors
        },
        patients: {
          total: totalPatients,
          withDoctor: patientsWithDoctor,
          withBed: patientsWithBed,
          withNurse: patientsWithNurse,
          fullyAssigned: await Patient.countDocuments({
            assignedDoctor: { $ne: null },
            assignedBed: { $ne: null },
            assignedNurse: { $ne: null }
          })
        }
      };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return null;
    }
  }
}

module.exports = AutoAssignmentService;
