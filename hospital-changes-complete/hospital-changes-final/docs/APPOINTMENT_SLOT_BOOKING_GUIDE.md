# Doctor Schedule-Based Appointment Booking System

## Overview

This system implements a comprehensive slot-based appointment booking mechanism that ensures:
- Doctors have predefined working hours and schedules
- Patients can only book appointments within valid time slots
- No double-booking or scheduling conflicts
- Support for different slot durations (15, 30, 45, 60 minutes)
- Break times and day-specific schedules

## Features

### 1. Doctor Schedule Management

Each doctor has a weekly schedule with the following properties:

- **Working Days**: Monday through Sunday
- **Working Hours**: Start time and end time for each day
- **Slot Duration**: 15, 30, 45, or 60 minutes (can vary by day)
- **Break Times**: Optional breaks during the day (e.g., lunch)
- **Availability Status**: Each day can be marked as available or unavailable

### 2. Time Slot Generation

The system automatically generates valid time slots based on:
- Doctor's working hours
- Configured slot duration
- Break times (excluded from available slots)
- Day of the week

### 3. Booking Validation

When booking an appointment, the system validates:
- ✅ Time is within doctor's working hours
- ✅ Time aligns with slot intervals
- ✅ Slot is not already booked
- ✅ Date is not in the past
- ✅ Doctor is active and available

### 4. Conflict Prevention

The system prevents:
- ❌ Double-booking the same time slot
- ❌ Booking outside working hours
- ❌ Booking on unavailable days
- ❌ Booking during break times
- ❌ Booking with misaligned times

## Database Schema

### Doctor Model Enhancement

```javascript
{
  schedule: {
    monday: {
      isAvailable: Boolean,
      startTime: String,      // Format: "HH:MM" (24-hour)
      endTime: String,        // Format: "HH:MM"
      slotDuration: Number,   // 15, 30, 45, or 60 minutes
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    // ... same for tuesday through sunday
  },
  defaultSlotDuration: Number  // Default: 30 minutes
}
```

### Example Doctor Schedule

```javascript
{
  firstName: "John",
  lastName: "Smith",
  specialization: "Ophthalmology",
  defaultSlotDuration: 30,
  schedule: {
    monday: {
      isAvailable: true,
      startTime: "17:00",  // 5:00 PM
      endTime: "19:00",    // 7:00 PM
      slotDuration: 30,
      breakTimes: []
    },
    tuesday: {
      isAvailable: true,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      breakTimes: [
        { startTime: "12:00", endTime: "13:00" }  // Lunch break
      ]
    },
    wednesday: {
      isAvailable: true,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 15,  // 15-minute slots
      breakTimes: []
    },
    thursday: {
      isAvailable: false  // Day off
    },
    friday: {
      isAvailable: true,
      startTime: "14:00",
      endTime: "18:00",
      slotDuration: 45,
      breakTimes: []
    },
    saturday: {
      isAvailable: false
    },
    sunday: {
      isAvailable: false
    }
  }
}
```

## API Endpoints

### 1. Get Available Slots

**Endpoint**: `GET /api/doctors/:id/available-slots`

**Query Parameters**:
- `date` (required): Date in YYYY-MM-DD format

**Example Request**:
```bash
GET /api/doctors/507f1f77bcf86cd799439011/available-slots?date=2024-01-15
```

**Example Response**:
```json
{
  "doctorId": "507f1f77bcf86cd799439011",
  "doctorName": "Dr. John Smith",
  "date": "2024-01-15",
  "dayOfWeek": "Monday",
  "isAvailable": true,
  "workingHours": {
    "startTime": "17:00",
    "endTime": "19:00",
    "slotDuration": 30
  },
  "totalSlots": 4,
  "availableSlots": [
    {
      "startTime": "17:00",
      "endTime": "17:30",
      "duration": 30
    },
    {
      "startTime": "17:30",
      "endTime": "18:00",
      "duration": 30
    },
    {
      "startTime": "18:00",
      "endTime": "18:30",
      "duration": 30
    },
    {
      "startTime": "18:30",
      "endTime": "19:00",
      "duration": 30
    }
  ]
}
```

**Error Responses**:

```json
// Missing date parameter
{
  "message": "Date parameter is required (format: YYYY-MM-DD)"
}

// Invalid date format
{
  "message": "Invalid date format. Use YYYY-MM-DD"
}

// Date in the past
{
  "message": "Cannot book appointments in the past"
}

// Doctor not found
{
  "message": "Doctor not found"
}

// Doctor not available
{
  "message": "Doctor is not currently available for appointments"
}
```

### 2. Create Appointment (Enhanced with Validation)

**Endpoint**: `POST /api/appointments`

**Request Body**:
```json
{
  "patient": "507f1f77bcf86cd799439012",
  "doctor": "507f1f77bcf86cd799439011",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "17:00",
  "reason": "Eye checkup",
  "notes": "Patient complains of blurry vision"
}
```

**Validation Rules**:
1. `appointmentTime` must be in HH:MM format (24-hour)
2. Time must be within doctor's working hours
3. Time must align with slot intervals
4. Slot must not be already booked
5. Date must not be in the past
6. Doctor must be active

**Success Response**:
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "_id": "507f1f77bcf86cd799439013",
    "patient": {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "Jane",
      "lastName": "Doe",
      "patientId": "P12345"
    },
    "doctor": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Smith",
      "specialization": "Ophthalmology"
    },
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "appointmentTime": "17:00",
    "reason": "Eye checkup",
    "status": "Scheduled"
  }
}
```

**Error Responses**:

```json
// Invalid time slot
{
  "message": "Invalid time slot. Please choose from available slots.",
  "hint": "Use GET /api/doctors/507f1f77bcf86cd799439011/available-slots?date=2024-01-15 to see available slots"
}

// Slot already booked
{
  "message": "This time slot is already booked. Please choose another slot.",
  "hint": "Use GET /api/doctors/507f1f77bcf86cd799439011/available-slots?date=2024-01-15 to see available slots"
}

// Invalid time format
{
  "errors": [
    {
      "msg": "Invalid time format. Use HH:MM",
      "param": "appointmentTime"
    }
  ]
}
```

### 3. Update Appointment (Enhanced with Validation)

**Endpoint**: `PUT /api/appointments/:id`

**Request Body**:
```json
{
  "appointmentTime": "18:00",
  "reason": "Updated reason"
}
```

**Validation**: Same as create appointment

**Note**: When updating doctor, date, or time, the system re-validates the slot availability.

## Frontend Integration

### Step 1: Fetch Available Slots

```javascript
// When user selects a doctor and date
const fetchAvailableSlots = async (doctorId, date) => {
  try {
    const response = await axios.get(
      `/api/doctors/${doctorId}/available-slots?date=${date}`
    );
    
    return response.data.availableSlots;
  } catch (error) {
    console.error('Error fetching slots:', error);
    return [];
  }
};
```

### Step 2: Display Slots as Buttons

```javascript
function AppointmentBooking() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots(selectedDoctor, selectedDate)
        .then(slots => setAvailableSlots(slots));
    }
  }, [selectedDoctor, selectedDate]);

  return (
    <div>
      {/* Doctor selection */}
      <DoctorSelect onChange={setSelectedDoctor} />
      
      {/* Date selection */}
      <DatePicker onChange={setSelectedDate} />
      
      {/* Slot selection */}
      {availableSlots.length > 0 ? (
        <div className="slots-grid">
          {availableSlots.map(slot => (
            <button
              key={slot.startTime}
              onClick={() => setSelectedSlot(slot)}
              className={selectedSlot?.startTime === slot.startTime ? 'selected' : ''}
            >
              {slot.startTime} - {slot.endTime}
            </button>
          ))}
        </div>
      ) : (
        <p>No available slots for this date</p>
      )}
      
      {/* Book button */}
      <button
        disabled={!selectedSlot}
        onClick={() => bookAppointment(selectedDoctor, selectedDate, selectedSlot.startTime)}
      >
        Book Appointment
      </button>
    </div>
  );
}
```

### Step 3: Book Appointment

```javascript
const bookAppointment = async (doctorId, date, time) => {
  try {
    const response = await axios.post('/api/appointments', {
      doctor: doctorId,
      patient: currentPatient.id,
      appointmentDate: date,
      appointmentTime: time,
      reason: appointmentReason
    });
    
    alert('Appointment booked successfully!');
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      alert('This slot is no longer available. Please choose another slot.');
    } else if (error.response?.status === 400) {
      alert(error.response.data.message);
    } else {
      alert('Error booking appointment');
    }
  }
};
```

## Testing

### Run Test Script

```bash
cd backend
node scripts/test-appointment-slots.js
```

This script will:
1. Create a test doctor with a schedule
2. Generate time slots for different days
3. Create a test patient
4. Test slot validation
5. Book appointments
6. Check available slots after booking
7. Test conflict detection

### Manual Testing with Postman/cURL

#### 1. Create a Doctor with Schedule

```bash
POST /api/doctors
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "specialization": "Cardiology",
  "email": "jane.doe@hospital.com",
  "phone": "1234567890",
  "defaultSlotDuration": 30,
  "schedule": {
    "monday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "17:00",
      "slotDuration": 30,
      "breakTimes": [
        { "startTime": "12:00", "endTime": "13:00" }
      ]
    },
    "tuesday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "17:00",
      "slotDuration": 30,
      "breakTimes": []
    },
    "wednesday": {
      "isAvailable": false
    },
    "thursday": {
      "isAvailable": true,
      "startTime": "14:00",
      "endTime": "18:00",
      "slotDuration": 45,
      "breakTimes": []
    },
    "friday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "13:00",
      "slotDuration": 15,
      "breakTimes": []
    },
    "saturday": {
      "isAvailable": false
    },
    "sunday": {
      "isAvailable": false
    }
  }
}
```

#### 2. Get Available Slots

```bash
GET /api/doctors/{doctorId}/available-slots?date=2024-01-15
```

#### 3. Book Valid Appointment

```bash
POST /api/appointments
Content-Type: application/json

{
  "patient": "{patientId}",
  "doctor": "{doctorId}",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "09:00",
  "reason": "Regular checkup"
}
```

#### 4. Try Invalid Appointment (Should Fail)

```bash
POST /api/appointments
Content-Type: application/json

{
  "patient": "{patientId}",
  "doctor": "{doctorId}",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "08:00",  // Before working hours
  "reason": "This should fail"
}
```

## Common Use Cases

### Use Case 1: Different Slot Durations

**Scenario**: A doctor wants 15-minute slots on busy days and 45-minute slots on consultation days.

**Solution**:
```javascript
schedule: {
  monday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 15  // Quick consultations
  },
  thursday: {
    isAvailable: true,
    startTime: "14:00",
    endTime: "18:00",
    slotDuration: 45  // Detailed consultations
  }
}
```

### Use Case 2: Lunch Breaks

**Scenario**: Doctor needs a lunch break from 12:00 PM to 1:00 PM.

**Solution**:
```javascript
schedule: {
  monday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    breakTimes: [
      { startTime: "12:00", endTime: "13:00" }
    ]
  }
}
```

### Use Case 3: Half-Day Schedule

**Scenario**: Doctor only works mornings on Fridays.

**Solution**:
```javascript
schedule: {
  friday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "13:00",  // Only until 1 PM
    slotDuration: 30
  }
}
```

### Use Case 4: Emergency Override (Admin)

**Scenario**: Admin needs to book an emergency appointment outside normal hours.

**Solution**: Add an `isEmergency` flag to appointments that bypasses validation:

```javascript
// In appointments route
if (req.body.isEmergency && req.user.role === 'admin') {
  // Skip slot validation for emergency appointments
} else {
  // Normal validation
}
```

## Best Practices

### 1. Slot Duration Selection

- **15 minutes**: Quick follow-ups, prescription renewals
- **30 minutes**: Standard consultations (most common)
- **45 minutes**: Detailed examinations
- **60 minutes**: Complex cases, new patient consultations

### 2. Break Time Management

- Always include lunch breaks (typically 12:00-13:00)
- Consider short breaks between long consultation sessions
- Account for administrative time

### 3. Schedule Updates

- Update schedules during off-hours to avoid conflicts
- Notify patients if their booked slots are affected
- Provide alternative slots when canceling availability

### 4. Performance Optimization

- Cache available slots for frequently accessed dates
- Use database indexes on `doctor`, `appointmentDate`, and `appointmentTime`
- Implement pagination for slot listings

## Troubleshooting

### Issue: "Invalid time slot" error

**Cause**: Time doesn't align with slot duration or is outside working hours

**Solution**: 
1. Check doctor's schedule for that day
2. Verify slot duration
3. Use the available-slots endpoint to see valid times

### Issue: "Slot already booked" error

**Cause**: Another appointment was booked for that time

**Solution**:
1. Refresh available slots
2. Choose a different time
3. Check if the existing appointment can be rescheduled

### Issue: No slots available

**Cause**: All slots are booked or doctor is not available that day

**Solution**:
1. Try a different date
2. Check if doctor is marked as available for that day
3. Consider increasing slot duration to create more slots

## Future Enhancements

1. **Recurring Appointments**: Support for weekly/monthly recurring bookings
2. **Waitlist**: Allow patients to join a waitlist for fully booked days
3. **Buffer Time**: Add configurable buffer time between appointments
4. **Multi-Doctor Booking**: Book with any available doctor in a department
5. **Telemedicine Slots**: Separate slots for in-person vs. virtual appointments
6. **Slot Blocking**: Allow doctors to block specific slots for personal time
7. **Automated Reminders**: Send reminders based on appointment time
8. **Cancellation Policy**: Enforce minimum notice period for cancellations

## Conclusion

This slot-based booking system provides a robust, production-ready solution for managing doctor appointments. It prevents conflicts, ensures efficient scheduling, and provides a great user experience for both patients and healthcare providers.

For questions or issues, please refer to the main project documentation or contact the development team.
