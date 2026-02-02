# Hospital Management System - Frontend

A modern, professional hospital management system with a beautiful UI inspired by medical design principles.

## 🏥 Features

- **Welcome Landing Page**: Professional healthcare-themed landing page
- **Secure Login System**: Demo authentication with medical branding
- **Admin Dashboard**: Comprehensive hospital management interface
- **Patient Management**: Track and manage patient records
- **Doctor Management**: Manage medical staff information
- **Appointment System**: Schedule and track appointments
- **Inventory Management**: Medical supplies and equipment tracking
- **Billing System**: Financial management and invoicing
- **Reports & Analytics**: Data visualization and reporting
- **ML Dashboard**: Machine learning insights and predictions

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation & Running

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

## 🔐 Demo Credentials

When you reach the login page, use these credentials:

- **Email:** `admin@hospital.com`
- **Password:** `admin123`

## 📱 User Flow

1. **Welcome Page** (`/`) - Professional landing page with hospital branding
2. **Login Page** (`/login`) - Secure authentication with demo credentials
3. **Admin Dashboard** (`/admin/dashboard`) - Main hospital management interface

## 🎨 Design Features

- **Medical Red Theme**: Professional healthcare color scheme
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI Components**: Material-UI with custom medical styling
- **Professional Typography**: Poppins font family for headers
- **Interactive Elements**: Hover effects and smooth transitions
- **Medical Icons**: Healthcare-focused iconography throughout

## 🏗️ Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   └── ProtectedRoute/
│   ├── pages/
│   │   ├── Welcome/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Patients/
│   │   ├── Doctors/
│   │   ├── Appointments/
│   │   ├── Inventory/
│   │   ├── Billing/
│   │   ├── Reports/
│   │   └── MLDashboard/
│   ├── store/
│   │   └── slices/
│   ├── styles/
│   └── App.js
└── package.json
```

## 🛠️ Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## 🎯 Key Technologies

- **React 18** - Modern React with hooks
- **Material-UI v5** - Professional UI components
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Emotion** - CSS-in-JS styling
- **React Toastify** - Notifications

## 📊 Dashboard Features

- **Statistics Cards**: Patient count, doctor availability, appointments
- **Quick Actions**: Red gradient action cards for common tasks
- **Data Visualization**: Mock charts for revenue and patient analytics
- **Recent Activities**: Real-time activity feed
- **Hospital Capacity**: Bed occupancy and resource tracking

## 🔧 Customization

The application uses a medical red theme (`#dc2626`) as the primary color. You can customize the theme in `src/App.js` by modifying the Material-UI theme configuration.

## 📝 Notes

- This is a frontend-only demo with mock data
- Authentication is simulated for demonstration purposes
- All data is stored in local state (not persistent)
- Charts and analytics show mock data for visualization

## 🚀 Next Steps

To make this a production-ready application:

1. Connect to a real backend API
2. Implement real authentication
3. Add data persistence
4. Integrate real chart libraries
5. Add comprehensive testing
6. Implement proper error handling
7. Add loading states and optimizations

---

**Enjoy exploring the Hospital Management System!** 🏥✨