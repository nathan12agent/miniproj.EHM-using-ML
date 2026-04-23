# Appointment Slot Booking - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Migration (if you have existing doctors)

```bash
cd backend
npm run migrate:schedules
```

This will add schedule fields to all existing doctors with sensible defaults.

### Step 2: Test the System

```bash
npm run test:slots
```

This creates a test doctor and demonstrates all features.

### Step 3: Try the API

```bash
# Get available slots for a doctor
curl -X GET "http://localhost:5000/api/doctors/{doctorId}/available-slots?date=2024-01-15" \
  -H "Authorization: Bearer {your-token}"

# Book an appointment
curl -X POST "http://localhost:5000/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-token}" \
  -d '{
    "patient": "{patientId}",
    "doctor": "{doctorId}",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "09:00",
    "reason": "Checkup"
  }'
```

## 📋 Common Scenarios

### Scenario 1: Create Doctor with Custom Schedule

```javascript
POST /api/doctors

{
  "firstName": "John",
  "lastName": "Doe",
  "specialization": "Cardiology",
  "email": "john.doe@hospital.com",
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
      "slotDuration": 45
    },
    "friday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "13:00",
      "slotDuration": 15
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

### Scenario 2: Update Doctor Schedule

```javascript
PUT /api/doctors/{doctorId}

{
  "schedule": {
    "monday": {
      "isAvailable": true,
      "startTime": "10:00",  // Changed from 09:00
      "endTime": "18:00",    // Changed from 17:00
      "slotDuration": 30,
      "breakTimes": [
        { "startTime": "13:00", "endTime": "14:00" }  // Changed lunch time
      ]
    }
  }
}
```

### Scenario 3: Get Available Slots

```javascript
GET /api/doctors/{doctorId}/available-slots?date=2024-01-15

Response:
{
  "doctorId": "...",
  "doctorName": "Dr. John Doe",
  "date": "2024-01-15",
  "dayOfWeek": "Monday",
  "isAvailable": true,
  "workingHours": {
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDuration": 30
  },
  "totalSlots": 14,
  "availableSlots": [
    { "startTime": "09:00", "endTime": "09:30", "duration": 30 },
    { "startTime": "09:30", "endTime": "10:00", "duration": 30 },
    // ... more slots
  ]
}
```

### Scenario 4: Book Appointment

```javascript
POST /api/appointments

{
  "patient": "507f1f77bcf86cd799439012",
  "doctor": "507f1f77bcf86cd799439011",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "09:00",
  "reason": "Regular checkup"
}

Success Response:
{
  "message": "Appointment created successfully",
  "appointment": { ... }
}

Error Response (Invalid Slot):
{
  "message": "Invalid time slot. Please choose from available slots.",
  "hint": "Use GET /api/doctors/.../available-slots?date=... to see available slots"
}

Error Response (Already Booked):
{
  "message": "This time slot is already booked. Please choose another slot.",
  "hint": "Use GET /api/doctors/.../available-slots?date=... to see available slots"
}
```

## ⚙️ Configuration Options

### Slot Durations

- **15 minutes**: Quick consultations, follow-ups
- **30 minutes**: Standard appointments (default)
- **45 minutes**: Detailed examinations
- **60 minutes**: Complex cases, new patients

### Break Times

Add breaks to any day:

```javascript
"breakTimes": [
  { "startTime": "12:00", "endTime": "13:00" },  // Lunch
  { "startTime": "15:00", "endTime": "15:15" }   // Short break
]
```

### Day Availability

Mark days as unavailable:

```javascript
"saturday": {
  "isAvailable": false
}
```

## 🔍 Validation Rules

The system enforces these rules:

✅ **Valid Bookings**:
- Time within working hours
- Time aligned with slot duration
- Slot not already booked
- Date not in the past
- Doctor is active

❌ **Invalid Bookings**:
- Time before start time
- Time after end time
- Time during break
- Misaligned time (e.g., 09:15 with 30-min slots)
- Already booked slot
- Past date
- Inactive doctor

## 🎯 Frontend Integration Example

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AppointmentBooking({ patientId }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Fetch doctors
  useEffect(() => {
    axios.get('/api/doctors').then(res => {
      setDoctors(res.data.doctors);
    });
  }, []);

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      axios.get(`/api/doctors/${selectedDoctor}/available-slots?date=${selectedDate}`)
        .then(res => {
          setAvailableSlots(res.data.availableSlots);
        })
        .catch(err => {
          console.error('Error fetching slots:', err);
          setAvailableSlots([]);
        });
    }
  }, [selectedDoctor, selectedDate]);

  const bookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      const response = await axios.post('/api/appointments', {
        patient: patientId,
        doctor: selectedDoctor,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot.startTime,
        reason: 'Regular checkup'
      });

      alert('Appointment booked successfully!');
      // Reset form or redirect
    } catch (error) {
      if (error.response?.status === 409) {
        alert('This slot is no longer available. Please choose another.');
        // Refresh slots
        setSelectedSlot(null);
      } else {
        alert(error.response?.data?.message || 'Error booking appointment');
      }
    }
  };

  return (
    <div>
      <h2>Book Appointment</h2>

      {/* Doctor Selection */}
      <select onChange={(e) => setSelectedDoctor(e.target.value)}>
        <option value="">Select Doctor</option>
        {doctors.map(doctor => (
          <option key={doctor._id} value={doctor._id}>
            {doctor.fullName} - {doctor.specialization}
          </option>
        ))}
      </select>

      {/* Date Selection */}
      <input
        type="date"
        min={new Date().toISOString().split('T')[0]}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      {/* Slot Selection */}
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
      ) : selectedDoctor && selectedDate ? (
        <p>No available slots for this date</p>
      ) : null}

      {/* Book Button */}
      <button
        disabled={!selectedSlot}
        onClick={bookAppointment}
      >
        Book Appointment
      </button>
    </div>
  );
}

export default AppointmentBooking;
```

## 🐛 Troubleshooting

### Problem: "Invalid time slot" error

**Solution**: Check that the time aligns with the slot duration. For 30-minute slots, valid times are 09:00, 09:30, 10:00, etc.

### Problem: No slots available

**Solution**: 
1. Check if doctor is available on that day
2. Check if all slots are booked
3. Try a different date

### Problem: Migration fails

**Solution**:
1. Ensure MongoDB is running
2. Check connection string in .env
3. Run with: `MONGODB_URI=your-connection-string npm run migrate:schedules`

## 📚 Additional Resources

- Full Documentation: `docs/APPOINTMENT_SLOT_BOOKING_GUIDE.md`
- Test Script: `backend/scripts/test-appointment-slots.js`
- Migration Script: `backend/scripts/migrate-doctor-schedules.js`

## 🎉 Success!

You now have a fully functional slot-based appointment booking system!

**Next Steps**:
1. Customize doctor schedules based on your needs
2. Integrate the frontend components
3. Test with real data
4. Deploy to production

For questions or issues, refer to the full documentation or contact the development team.
