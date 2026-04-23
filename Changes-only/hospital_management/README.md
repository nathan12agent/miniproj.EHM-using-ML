# Hospital Management System with AI/ML Integration

A comprehensive hospital management system featuring AI-powered disease prediction, role-based access control, and modern web interface.

## 🏥 System Overview

This system provides:
- **Admin Portal**: Complete hospital management (patients, doctors, appointments, inventory, billing)
- **Doctor Portal**: Medical dashboard with AI disease prediction tools
- **Patient Portal**: Self-service appointment booking and management
- **ML Service**: Machine learning API for disease prediction based on symptoms
- **Role-based Access**: Separate login systems for admins, doctors, and patients

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ and npm
- **MongoDB** running locally (default: `mongodb://localhost:27017`)
- **Python 3.8+** (optional, for ML service)

### 1. Start the Backend (Node.js)
```bash
cd backend
npm install
npm start
```
Backend API at: http://localhost:5000
API Docs at: http://localhost:5000/api-docs

### 2. Start the Frontend (React)
```bash
cd frontend
npm install
npm start
```
Access at: http://localhost:3000

### 3. Start the ML Service (Python Flask) - Optional
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```
ML API at: http://localhost:5001

## 🔐 Login Credentials

### Admin Portal
- **URL**: http://localhost:3000/login
- **Email**: admin@hospital.com
- **Password**: admin123

### Doctor Portal
- **URL**: http://localhost:3000/doctor/login
- **Credentials**:
  - Username: `sarah.johnson` | Password: `doctor123` (ML Access ✓)
  - Username: `emily.rodriguez` | Password: `doctor123` (ML Access ✓)
  - Username: `michael.chen` | Password: `doctor123` (No ML Access ✗)

### Patient Portal
- **URL**: http://localhost:3000/patient/login
- Self-service appointment booking available via the Patient Portal

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   Port: 27017   │
                       └─────────────────┘
```

## 📋 Features

### Admin Portal Features
- **Dashboard**: Hospital statistics and overview
- **Doctor Management**: 
  - Add/edit doctor profiles
  - Create login credentials for doctors
  - Enable/disable ML access permissions
  - Track doctor activity and specializations
- **Patient Management**: Patient records and information
- **Appointment System**:
  - Schedule and manage appointments
  - Cancel appointments (sets status to "Cancelled")
  - **Permanently delete cancelled appointments** (removes from database with confirmation dialog)
  - Real-time UI updates after cancel/delete operations
  - Snackbar feedback for success/error notifications
  - MUI confirmation popups for destructive actions
- **Bed Management**: Hospital bed allocation and tracking
- **Staff Management**: Nurse scheduling and assignment
- **Inventory Management**: Medical supplies and equipment
- **Billing System**: Financial management and invoicing
- **Reports & Analytics**: Data visualization and reporting
- **Attendance Tracking**: Staff clock-in/out and break management

### Doctor Portal Features
- **Medical Dashboard**: Personal statistics and patient overview
- **AI Disease Prediction**:
  - Symptom-based disease prediction
  - Multiple prediction algorithms
  - Confidence scoring
  - Prediction history tracking
- **Appointment Management**: View booked appointments with filters
- **Patient Records**: Access to assigned patients
- **Availability Management**: Set working hours and consultation fees
- **ML Access Control**: Permission-based AI tool access

### Patient Portal Features
- **Doctor Discovery**: Browse and search doctors by specialization
- **Online Booking**: Multi-step appointment booking wizard
- **Appointment Tracking**: View appointment history and status
- **Real-time Slot Availability**: See available time slots per doctor

### ML Service Features
- **Disease Prediction API**: RESTful API for symptom analysis
- **Multiple Endpoints**:
  - `/predict` - Single patient prediction
  - `/batch_predict` - Multiple patient predictions
  - `/symptoms` - Available symptoms list
  - `/model_info` - ML model information
- **Fallback System**: Works offline with mock predictions
- **Random Forest Model**: Trained on medical symptom datasets

## 🔧 API Endpoints

### Appointments API (`/api/appointments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all appointments (with pagination & filters) |
| GET | `/:id` | Get appointment by ID |
| POST | `/` | Create new appointment |
| PUT | `/:id` | Update appointment |
| DELETE | `/:id` | Cancel appointment (sets status to "Cancelled") |
| DELETE | `/:id/permanent` | **Permanently delete** a cancelled appointment |

### Scheduling API (`/api/scheduling`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/availability` | Set doctor availability |
| GET | `/availability` | Get doctor's own availability |
| DELETE | `/availability/:dayOfWeek` | Remove availability for a day |
| PUT | `/consultation-fee` | Set consultation fee |
| GET | `/slots/:doctorId` | Get available slots for a date |
| GET | `/doctors` | List doctors with availability |
| POST | `/book` | Book an appointment |
| PUT | `/cancel/:appointmentId` | Cancel an appointment |
| GET | `/doctor/appointments` | Doctor's appointments |
| GET | `/patient/appointments` | Patient's appointments (by email) |
| GET | `/admin/appointments` | All appointments (admin) |

### Other APIs
- **Auth**: `/api/auth` - Login, register, get current user
- **Patients**: `/api/patients` - CRUD operations, risk assessment
- **Doctors**: `/api/doctors` - CRUD operations
- **Beds**: `/api/beds` - Bed management, assignment, discharge
- **Nurses**: `/api/nurses` - Nurse management, smart assignment
- **Billing**: `/api/billing` - Invoice management
- **Reports**: `/api/reports` - Report generation
- **Attendance**: `/api/attendance` - Staff attendance tracking
- **ML**: `/api/ml` - Machine learning predictions

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI v5** - Professional UI components
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database & ODM
- **JWT** - Authentication
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting
- **Swagger** - API documentation

### ML Service
- **Python Flask** - API framework
- **scikit-learn** - Machine learning
- **pandas** - Data processing
- **Random Forest** - Classification algorithm

## 📁 Project Structure

```
hospital-management-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── AppointmentForm.js
│   │   │   ├── AppointmentDetailDialog.js
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   │   ├── Welcome/    # Landing page
│   │   │   ├── Login/      # Admin login
│   │   │   ├── Dashboard/  # Admin dashboard
│   │   │   ├── Appointments/ # Appointment management (with delete fix)
│   │   │   ├── Doctors/    # Doctor management
│   │   │   ├── Patients/   # Patient management
│   │   │   ├── PatientPortal/ # Patient self-service portal
│   │   │   ├── DoctorLogin/ # Doctor login
│   │   │   ├── DoctorDashboard/ # Doctor portal
│   │   │   ├── DoctorAppointments/ # Doctor's appointment view
│   │   │   ├── BedManagement/ # Bed allocation
│   │   │   ├── StaffManagement/ # Nurse management
│   │   │   ├── Billing/    # Billing management
│   │   │   └── Reports/    # Report generation
│   │   ├── services/       # API services (api.js, mlApi.js)
│   │   ├── store/          # Redux store
│   │   └── styles/         # Global styles
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── models/             # Database models (14 models)
│   │   ├── Appointment.js  # Appointment schema
│   │   ├── Doctor.js       # Doctor schema
│   │   ├── Patient.js      # Patient schema
│   │   └── ...
│   ├── routes/             # API routes (15 route files)
│   │   ├── appointments.js # Appointment CRUD + permanent delete
│   │   ├── scheduling.js   # Doctor-based scheduling system
│   │   ├── patientBooking.js # Patient portal booking
│   │   └── ...
│   ├── middleware/         # Auth middleware (JWT)
│   ├── utils/             # Utility functions
│   └── server.js          # Express server entry point
├── ml-service/             # Python ML service
│   ├── app.py             # Flask application
│   ├── disease_predictor.py # ML model
│   └── requirements.txt
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_API_URL=http://localhost:5001
```

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
```

#### ML Service (.env)
```
PORT=5001
DEBUG=True
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run all services
docker-compose up --build
```

### Manual Deployment
1. **Frontend**: Build and serve static files (`npm run build`)
2. **Backend**: Deploy to Node.js hosting (ensure MongoDB access)
3. **ML Service**: Deploy to Python hosting (Heroku, AWS, etc.)

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### ML Service Tests
```bash
cd ml-service
python -m pytest
```

## 📊 ML Model Details

### Disease Prediction Model
- **Algorithm**: Random Forest Classifier
- **Features**: 24+ medical symptoms
- **Accuracy**: ~94% (on training data)
- **Input**: Binary symptom indicators (0/1)
- **Output**: Disease prediction with confidence score

### Supported Symptoms
- Fever, Cough, Headache, Fatigue
- Chest Pain, Shortness of Breath
- Nausea, Vomiting, Diarrhea
- Muscle Pain, Joint Pain
- And 15+ more symptoms

### Prediction Categories
- Common Cold, Flu, Bronchitis
- Heart Disease, Hypertension
- Migraine, Tension Headache
- Anxiety, Depression
- And many more conditions

## 🔒 Security Features

- **JWT Authentication** for secure API access
- **Role-based Access Control** (Admin vs Doctor vs Patient)
- **ML Access Permissions** (configurable per doctor)
- **Input Validation** and sanitization (express-validator)
- **CORS Configuration** for cross-origin requests
- **Helmet** security headers
- **Rate Limiting** on all API endpoints
- **Confirmation dialogs** for destructive operations (delete/cancel)

## 🐛 Troubleshooting

### Common Issues

1. **ML Service Connection Error**
   - Ensure Python ML service is running on port 5001
   - Check firewall settings
   - System falls back to mock predictions if ML service is unavailable

2. **Frontend Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility (v16+)

3. **Database Connection Issues**
   - Ensure MongoDB is running on port 27017
   - Check connection string in backend `.env`
   - For replica set features (transactions), configure MongoDB replica set

4. **Delete Button Not Working for Cancelled Appointments**
   - This issue has been **fixed**. The delete button now:
     - For non-cancelled appointments: cancels them (sets status to "Cancelled")
     - For already-cancelled appointments: permanently deletes them from the database
     - Shows a confirmation dialog before any action
     - Shows success/error snackbar notifications
     - Instantly updates the UI without requiring page refresh

## 📝 Recent Changes

### v1.1.0 - Cancelled Appointment Delete Fix
- **Backend**: Added `DELETE /api/appointments/:id/permanent` endpoint for permanently deleting cancelled appointments from the database
- **Frontend API Service**: Added `deletePermanent()` method to `appointmentsAPI`
- **Frontend Appointments Page**:
  - Replaced `window.confirm()` with MUI `Dialog` confirmation popup
  - Added `Snackbar` notifications for success/error feedback
  - Implemented smart logic: delete button cancels active appointments OR permanently deletes cancelled ones
  - Instant UI updates via React state management (no page reload needed)
  - Proper error handling with backend error message propagation
  - Added unique IDs and tooltips to action buttons

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation at http://localhost:5000/api-docs
- Give suggestions

---

**Built with ❤️ for modern healthcare management**
