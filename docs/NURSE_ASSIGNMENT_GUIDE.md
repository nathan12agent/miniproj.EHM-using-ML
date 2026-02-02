# Nurse Assignment Feature - User Guide

## Overview
You can now assign and manage patients for each nurse directly from the Bed Management page.

## How to Assign Patients to a Nurse

### Step 1: Access Bed Management
1. Login to the admin panel
2. Click "Bed Management" in the sidebar
3. View the nurses panel on the right side

### Step 2: Click on a Nurse
1. Click on any nurse card in the nurses panel
2. The nurse assignment dialog will open

### Step 3: Select Patients
1. You'll see all patients in the system displayed as cards
2. Click on patient cards to select/deselect them
3. Selected patients will have:
   - Red border
   - Red background tint
   - "Selected" chip
4. Click again to deselect

### Step 4: Save Assignments
1. Review the summary at the bottom showing selected count
2. Click "Update Assignments" to save
3. Click "Cancel" to close without saving

## Features

### Visual Indicators
- **Selected Patients**: Red border, red background, "Selected" chip
- **Unselected Patients**: Gray border, white background
- **Hover Effect**: Cards lift up when you hover over them

### Smart Assignment
- Automatically shows currently assigned patients as selected
- Add new patients by selecting them
- Remove patients by deselecting them
- Updates only changed assignments (efficient)

### Patient Information Displayed
- Patient name
- Patient ID
- Gender
- Avatar with initials

### Summary Section
- Shows total number of selected patients
- Updates in real-time as you select/deselect

## Example Workflow

### Scenario: Assign 3 patients to Nurse Sarah Johnson

1. **Click** on Sarah Johnson's nurse card
2. **See** her currently assigned patients (already selected)
3. **Click** on 3 additional patient cards to select them
4. **Review** summary: "5 patient(s) selected" (2 existing + 3 new)
5. **Click** "Update Assignments"
6. **Success!** Sarah now has 5 patients assigned

### Scenario: Remove a patient from a nurse

1. **Click** on the nurse card
2. **See** currently assigned patients (selected with red border)
3. **Click** on a selected patient to deselect them
4. **Review** summary showing reduced count
5. **Click** "Update Assignments"
6. **Success!** Patient removed from nurse's assignment

## Tips

### Best Practices
- Balance patient load across nurses
- Consider nurse specialization when assigning
- Check nurse status (On Duty vs On Break)
- Review ward assignments (assign patients from same ward)

### Quick Actions
- **Select All**: Click each patient card
- **Deselect All**: Click each selected patient again
- **Cancel Changes**: Click "Cancel" button

### Visual Cues
- **Nurse Card Hover**: Card lifts up - indicates clickable
- **Patient Card Hover**: Card lifts up - indicates selectable
- **Red Border**: Patient is selected
- **Gray Border**: Patient is not selected

## Nurse Card Information

Each nurse card shows:
- **Name**: Full name of the nurse
- **Ward**: Which ward they work in
- **Shift**: Morning/Evening/Night
- **Status**: On Duty (green) or On Break (orange)
- **Patient Count**: Number of currently assigned patients

## Patient Card Information

Each patient card shows:
- **Avatar**: Initials in a circle
- **Name**: Full patient name
- **Patient ID**: Unique identifier
- **Gender**: Male/Female/Other
- **Selection Status**: "Selected" chip if assigned

## Backend Integration

All assignments are saved to the database:
- Nurse's `assignedPatients` array is updated
- Changes persist across sessions
- Real-time updates after saving
- Automatic refresh of nurse list

## Troubleshooting

### Can't see patients
- Ensure patients exist in the database
- Run seed script if needed: `npm run seed`
- Check backend is running

### Changes not saving
- Check backend connection
- Verify authentication token
- Check browser console for errors
- Ensure nurse exists in database

### Nurse card not clickable
- Refresh the page
- Check if nurses loaded properly
- Verify backend API is responding

## API Endpoints Used

- `POST /api/nurses/:id/assign-patient` - Assign patient to nurse
- `POST /api/nurses/:id/remove-patient` - Remove patient from nurse
- `GET /api/nurses` - Get all nurses with assigned patients
- `GET /api/patients` - Get all patients

## Future Enhancements

Potential features to add:
- Bulk assign/unassign
- Filter patients by ward
- Search patients by name
- Show patient bed assignments
- Workload recommendations
- Shift-based assignments
- Nurse availability checking
- Patient priority indicators
