const CONDITION_SPECIALTY_MAP = {
  // Minor
  'Cold/Flu': { specialty: 'General Medicine', fallbacks: ['Pediatrics', 'ENT'], severity: 'Minor' },
  'Minor Cut/Wound': { specialty: 'General Medicine', fallbacks: ['Dermatology', 'Emergency Medicine'], severity: 'Minor' },
  'Skin Rash': { specialty: 'Dermatology', fallbacks: ['General Medicine', 'Pediatrics'], severity: 'Minor' },
  'Eye Infection': { specialty: 'Ophthalmology', fallbacks: ['General Medicine', 'Pediatrics'], severity: 'Minor' },
  'Hearing Loss': { specialty: 'ENT', fallbacks: ['General Medicine'], severity: 'Minor' },
  // Moderate
  'Fever': { specialty: 'General Medicine', fallbacks: ['Pediatrics', 'Emergency Medicine'], severity: 'Moderate' },
  'Stomach Pain': { specialty: 'Gastroenterology', fallbacks: ['General Medicine', 'Pediatrics'], severity: 'Moderate' },
  'Acid Reflux': { specialty: 'Gastroenterology', fallbacks: ['General Medicine'], severity: 'Moderate' },
  'Migraine': { specialty: 'Neurology', fallbacks: ['General Medicine', 'Psychiatry'], severity: 'Moderate' },
  'Fracture': { specialty: 'Orthopedics', fallbacks: ['Emergency Medicine', 'Surgery', 'General Medicine'], severity: 'Moderate' },
  'Arthritis': { specialty: 'Orthopedics', fallbacks: ['General Medicine'], severity: 'Moderate' },
  'Asthma': { specialty: 'Pulmonology', fallbacks: ['Emergency Medicine', 'General Medicine', 'Pediatrics'], severity: 'Moderate' },
  'Kidney Stones': { specialty: 'Nephrology', fallbacks: ['Urology', 'General Medicine', 'Emergency Medicine'], severity: 'Moderate' },
  // Severe/Critical
  'Heart Attack': { specialty: 'Cardiology', fallbacks: ['Emergency Medicine', 'Surgery'], severity: 'Critical' },
  'Chest Pain': { specialty: 'Cardiology', fallbacks: ['Emergency Medicine', 'Pulmonology', 'General Medicine'], severity: 'Severe' },
  'Stroke': { specialty: 'Neurology', fallbacks: ['Emergency Medicine', 'Cardiology'], severity: 'Critical' },
  'Seizures': { specialty: 'Neurology', fallbacks: ['Emergency Medicine', 'General Medicine', 'Pediatrics'], severity: 'Severe' },
  'Cancer': { specialty: 'Oncology', fallbacks: ['Surgery', 'Radiology', 'General Medicine'], severity: 'Severe' },
  'Severe Trauma': { specialty: 'Emergency Medicine', fallbacks: ['Surgery', 'Neurology', 'Orthopedics', 'General Medicine'], severity: 'Critical' },
  'Burns': { specialty: 'Emergency Medicine', fallbacks: ['Dermatology', 'Surgery', 'General Medicine'], severity: 'Severe' },
  'Spinal Injury': { specialty: 'Orthopedics', fallbacks: ['Neurology', 'Surgery', 'Emergency Medicine'], severity: 'Critical' },
  'Pneumonia': { specialty: 'Pulmonology', fallbacks: ['Emergency Medicine', 'General Medicine', 'Pediatrics'], severity: 'Severe' },
  'Other': { specialty: 'General Medicine', fallbacks: ['Emergency Medicine'], severity: 'Minor' }
};

module.exports = { CONDITION_SPECIALTY_MAP };
