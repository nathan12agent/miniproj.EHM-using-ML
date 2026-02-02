# MongoDB Collections Guide

## Overview
This guide shows you how to view all collections in MongoDB Compass, including the new Nurse and Bed collections.

## Collections in Database

After running the seed script, your `hospital_management` database will have the following collections:

### 1. **users**
- Admin and staff user accounts
- Authentication credentials
- Roles and permissions

### 2. **doctors**
- Doctor profiles
- Specializations
- Qualifications
- Contact information

### 3. **patients**
- Patient records
- Medical history
- Contact information
- Risk scores

### 4. **appointments**
- Scheduled appointments
- Visit types (Inpatient/Outpatient)
- Appointment status
- Doctor-patient assignments

### 5. **beds** ⭐ NEW
- 30 beds total
  - 10 ICU beds (ICU-001 to ICU-010)
  - 10 General beds (GEN-001 to GEN-010)
  - 10 Emergency beds (ER-001 to ER-010)
- Bed status (Available/Occupied/Maintenance)
- Patient assignments
- Ward information

### 6. **nurses** ⭐ NEW
- 10 nurses across all wards
- Nurse information (name, email, phone)
- Ward assignments
- Shift schedules (Morning/Evening/Night)
- Working hours
- Max patient load
- Assigned patients

### 7. **bills**
- Patient billing records
- Payment information
- Insurance details

### 8. **reports**
- Medical reports
- Lab results
- Diagnostic reports

### 9. **inventories**
- Medical supplies
- Equipment tracking
- Stock levels

### 10. **attendances**
- Staff attendance records
- Clock in/out times
- Break tracking

## How to View Collections in MongoDB Compass

### Step 1: Open MongoDB Compass
1. Launch MongoDB Compass application
2. Connect to: `mongodb://localhost:27017`

### Step 2: Select Database
1. In the left sidebar, find `hospital_management`
2. Click on it to expand

### Step 3: View Collections
You should see all collections listed:
```
hospital_management
├── users
├── doctors
├── patients
├── appointments
├── beds          ⭐ NEW
├── nurses        ⭐ NEW
├── bills
├── reports
├── inventories
└── attendances
```

### Step 4: View Nurse Collection
1. Click on `nurses` collection
2. You should see 10 nurse documents
3. Each document contains:
   ```json
   {
     "_id": ObjectId("..."),
     "nurseId": "N12345678",
     "firstName": "Sarah",
     "lastName": "Johnson",
     "email": "sarah.johnson@hospital.com",
     "phone": "+1234567801",
     "ward": "ICU",
     "shift": "Morning",
     "status": "On Duty",
     "specialization": "Critical Care",
     "experience": 8,
     "workingHours": 8,
     "maxPatientLoad": 4,
     "assignedPatients": [],
     "createdAt": "2025-11-11T...",
     "updatedAt": "2025-11-11T..."
   }
   ```

### Step 5: View Bed Collection
1. Click on `beds` collection
2. You should see 30 bed documents
3. Each document contains:
   ```json
   {
     "_id": ObjectId("..."),
     "bedNumber": "ICU-001",
     "ward": "ICU",
     "status": "Occupied",
     "patient": ObjectId("..."),
     "assignedDate": "2025-11-11T...",
     "dischargeDate": null,
     "notes": "",
     "createdAt": "2025-11-11T...",
     "updatedAt": "2025-11-11T..."
   }
   ```

## Verifying Data

### Check Nurse Count by Ward:
```javascript
// In MongoDB Compass Aggregation tab
[
  {
    $group: {
      _id: "$ward",
      count: { $sum: 1 }
    }
  }
]
```

Expected Result:
```
ICU: 3 nurses
General: 4 nurses
Emergency: 3 nurses
```

### Check Bed Count by Ward:
```javascript
// In MongoDB Compass Aggregation tab
[
  {
    $group: {
      _id: "$ward",
      total: { $sum: 1 },
      occupied: {
        $sum: { $cond: [{ $eq: ["$status", "Occupied"] }, 1, 0] }
      }
    }
  }
]
```

Expected Result:
```
ICU: 10 beds (4 occupied)
General: 10 beds (5 occupied)
Emergency: 10 beds (3 occupied)
```

## Troubleshooting

### Collection Not Showing?

**Problem**: Nurse or Bed collection not visible in MongoDB Compass

**Solution**:
1. Re-run the seed script:
   ```cmd
   cd backend
   npm run seed
   ```
   OR
   ```cmd
   seed-database.cmd
   ```

2. Refresh MongoDB Compass (F5 or refresh button)

3. Check console output for errors

### Empty Collections?

**Problem**: Collections exist but are empty

**Solution**:
1. Check seed script ran successfully
2. Look for error messages in console
3. Verify MongoDB is running
4. Re-run seed script

### Connection Issues?

**Problem**: Cannot connect to MongoDB

**Solution**:
1. Ensure MongoDB service is running:
   ```cmd
   net start MongoDB
   ```

2. Check connection string: `mongodb://localhost:27017`

3. Verify port 27017 is not blocked

## Sample Queries

### Find All ICU Nurses:
```javascript
{ ward: "ICU" }
```

### Find Available Beds:
```javascript
{ status: "Available" }
```

### Find Nurses On Duty:
```javascript
{ status: "On Duty" }
```

### Find Occupied Beds with Patient Info:
```javascript
// Use Aggregation
[
  {
    $match: { status: "Occupied" }
  },
  {
    $lookup: {
      from: "patients",
      localField: "patient",
      foreignField: "_id",
      as: "patientInfo"
    }
  }
]
```

## Collection Statistics

After seeding, you should have:

| Collection | Count | Description |
|------------|-------|-------------|
| users | 1 | Admin user |
| doctors | 3 | Sample doctors |
| patients | 2+ | Sample patients |
| appointments | 0+ | Scheduled appointments |
| **beds** | **30** | **10 per ward** |
| **nurses** | **10** | **Across all wards** |
| bills | 0+ | Billing records |
| reports | 0+ | Medical reports |
| inventories | 0+ | Medical supplies |
| attendances | 0+ | Staff attendance |

## API Endpoints for Collections

### Nurses:
- `GET /api/nurses` - Get all nurses
- `GET /api/nurses/:id` - Get nurse by ID
- `POST /api/nurses` - Create nurse
- `PUT /api/nurses/:id` - Update nurse
- `DELETE /api/nurses/:id` - Delete nurse

### Beds:
- `GET /api/beds` - Get all beds
- `GET /api/beds/:id` - Get bed by ID
- `GET /api/beds/stats` - Get bed statistics
- `POST /api/beds` - Create bed
- `PUT /api/beds/:id` - Update bed
- `POST /api/beds/:id/assign` - Assign bed to patient
- `POST /api/beds/:id/discharge` - Discharge patient
- `DELETE /api/beds/:id` - Delete bed

## Summary

After running the seed script:
- ✅ Nurse collection created with 10 nurses
- ✅ Bed collection created with 30 beds
- ✅ All collections visible in MongoDB Compass
- ✅ Data properly structured and indexed
- ✅ Ready for use in the application

To verify everything is working:
1. Run seed script: `seed-database.cmd`
2. Open MongoDB Compass
3. Connect to `mongodb://localhost:27017`
4. Select `hospital_management` database
5. See all 10 collections including `nurses` and `beds`
6. Click on each to view the data

**All collections are now properly set up and visible in MongoDB!** 🎉
