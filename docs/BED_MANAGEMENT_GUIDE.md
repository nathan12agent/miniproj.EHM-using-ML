# Bed Management System - Integration Guide

## Overview
The Bed Management System is now fully integrated with the backend, allowing real-time bed assignments, patient discharges, and nurse tracking.

## Features Implemented

### 1. Backend Models
- **Bed Model** (`backend/models/Bed.js`)
  - Bed number, ward, status (Available/Occupied/Maintenance)
  - Patient assignment tracking
  - Assignment and discharge dates
  - Notes field for additional information

- **Nurse Model** (`backend/models/Nurse.js`)
  - Nurse information (name, email, phone)
  - Ward assignment
  - Shift tracking (Morning/Evening/Night)
  - Status (On Duty/On Break/Off Duty)
  - Assigned patients tracking

### 2. Backend API Endpoints

#### Beds API (`/api/beds`)
- `GET /api/beds` - Get all beds (with optional ward/status filters)
- `GET /api/beds/stats` - Get bed occupancy statistics
- `GET /api/beds/:id` - Get single bed details
- `POST /api/beds` - Create new bed
- `PUT /api/beds/:id` - Update bed status/notes
- `POST /api/beds/:id/assign` - Assign bed to patient
- `POST /api/beds/:id/discharge` - Discharge patient from bed
- `DELETE /api/beds/:id` - Delete bed (only if not occupied)

#### Nurses API (`/api/nurses`)
- `GET /api/nurses` - Get all nurses (with optional ward/status filters)
- `GET /api/nurses/:id` - Get single nurse details
- `POST /api/nurses` - Create new nurse
- `PUT /api/nurses/:id` - Update nurse information
- `POST /api/nurses/:id/assign-patient` - Assign patient to nurse
- `POST /api/nurses/:id/remove-patient` - Remove patient from nurse
- `DELETE /api/nurses/:id` - Delete nurse (only if no assigned patients)

### 3. Frontend Features

#### Bed Management Page (`/admin/bed-management`)
- **Visual Bed Display**
  - Color-coded bed cards (Green=Available, Red=Occupied, Orange=Maintenance)
  - Click on any bed to view details
  - Hover for quick patient information

- **Ward Filtering**
  - Tabs for All Wards, ICU, General, Emergency
  - Statistics update per ward selection

- **Statistics Dashboard**
  - Total beds count
  - Occupied beds with percentage
  - Available beds
  - Nurses on duty

- **Bed Assignment**
  - Click on available bed → "Assign Patient" button
  - Select from list of patients without beds
  - Automatic bed status update

- **Patient Discharge**
  - Click on occupied bed → "Discharge Patient" button
  - Confirms discharge and frees the bed
  - Updates bed status to Available

- **Nurse Tracking**
  - Real-time nurse status display
  - Patient count per nurse
  - Shift and ward information

## How to Use

### 1. Seed the Database
Run the seed script to populate sample beds and nurses:
```bash
cd backend
npm run seed
```

This will create:
- 6 ICU beds
- 8 General ward beds
- 4 Emergency beds
- 6 nurses across different wards

### 2. Access Bed Management
1. Login to the admin panel
2. Click "Bed Management" in the sidebar
3. View all beds or filter by ward using tabs

### 3. Assign a Bed to a Patient
1. Click on a green (Available) bed
2. Click "Assign Patient" button
3. Select a patient from the dropdown
4. Click "Assign"
5. Bed status updates to Occupied (red)

### 4. Discharge a Patient
1. Click on a red (Occupied) bed
2. View patient details
3. Click "Discharge Patient" button
4. Confirm discharge
5. Bed status updates to Available (green)

### 5. Monitor Nurses
- View nurse panel on the right side
- See nurse status (On Duty/On Break)
- Check patient count per nurse
- Filter by ward using tabs

## API Integration

### Frontend API Service
All bed and nurse operations use the centralized API service:

```javascript
import { bedsAPI, nursesAPI } from '../services/api';

// Get all beds
const beds = await bedsAPI.getAll({ ward: 'ICU' });

// Assign bed to patient
await bedsAPI.assignBed(bedId, patientId);

// Discharge patient
await bedsAPI.discharge(bedId);

// Get nurses
const nurses = await nursesAPI.getAll({ ward: 'General' });
```

## Data Flow

1. **Bed Assignment**
   - User selects available bed
   - Frontend shows list of patients without beds
   - User selects patient
   - API call: `POST /api/beds/:id/assign`
   - Backend updates bed status and patient reference
   - Frontend refreshes bed data

2. **Patient Discharge**
   - User clicks occupied bed
   - User clicks "Discharge Patient"
   - API call: `POST /api/beds/:id/discharge`
   - Backend clears patient reference, sets discharge date
   - Frontend refreshes bed data

## Database Schema

### Bed Schema
```javascript
{
  bedNumber: String (unique),
  ward: String (ICU/General/Emergency/Pediatric/Maternity),
  status: String (Available/Occupied/Maintenance/Reserved),
  patient: ObjectId (ref: Patient),
  assignedDate: Date,
  dischargeDate: Date,
  notes: String
}
```

### Nurse Schema
```javascript
{
  nurseId: String (auto-generated),
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  ward: String,
  shift: String (Morning/Evening/Night),
  status: String (On Duty/On Break/Off Duty),
  assignedPatients: [ObjectId] (ref: Patient),
  specialization: String,
  experience: Number
}
```

## Future Enhancements

Potential features to add:
- Bed reservation system
- Automatic nurse assignment based on workload
- Bed transfer between wards
- Maintenance scheduling
- Bed cleaning status tracking
- Patient history per bed
- Nurse shift scheduling
- Real-time notifications for bed availability
- Analytics and reporting

## Troubleshooting

### Beds not showing
- Ensure backend is running
- Check if seed script was executed
- Verify MongoDB connection
- Check browser console for errors

### Cannot assign bed
- Verify patient exists in database
- Check if patient already has a bed
- Ensure bed status is "Available"
- Check authentication token

### Discharge not working
- Verify bed is occupied
- Check user permissions
- Ensure backend route is registered
- Check network tab for API errors

## Testing

To test the bed management system:

1. **Create test data**
   ```bash
   npm run seed
   ```

2. **Test bed assignment**
   - Navigate to Bed Management
   - Click an available bed
   - Assign to a patient
   - Verify bed turns red

3. **Test discharge**
   - Click an occupied bed
   - Click discharge
   - Verify bed turns green

4. **Test filtering**
   - Switch between ward tabs
   - Verify statistics update
   - Check bed and nurse lists filter correctly

## Support

For issues or questions:
- Check backend logs for API errors
- Check frontend console for client errors
- Verify database connection
- Ensure all dependencies are installed
