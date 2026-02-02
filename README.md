# Hospital Management System with AI/ML Integration

A comprehensive hospital management system featuring AI-powered disease prediction, role-based access control, and modern web interface.

## 🏥 System Overview

This system provides:
- **Admin Portal**: Complete hospital management (patients, doctors, appointments, inventory, billing)
- **Doctor Portal**: Medical dashboard with AI disease prediction tools
- **ML Service**: Machine learning API for disease prediction based on symptoms
- **Role-based Access**: Separate login systems for admins and doctors

## 🚀 Quick Start

### 1. Start the Frontend (React)
```bash
cd frontend
npm install
npm start
```
Access at: http://localhost:3000

### 2. Start the ML Service (Python Flask)
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```
ML API at: http://localhost:5001

### 3. Start the Backend (Node.js) - Optional
```bash
cd backend
npm install
npm start
```
Backend API at: http://localhost:5000

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

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
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
- **Appointment System**: Schedule and manage appointments
- **Inventory Management**: Medical supplies and equipment
- **Billing System**: Financial management and invoicing
- **Reports & Analytics**: Data visualization and reporting

### Doctor Portal Features
- **Medical Dashboard**: Personal statistics and patient overview
- **AI Disease Prediction**:
  - Symptom-based disease prediction
  - Multiple prediction algorithms
  - Confidence scoring
  - Prediction history tracking
- **Patient Records**: Access to assigned patients
- **ML Access Control**: Permission-based AI tool access

### ML Service Features
- **Disease Prediction API**: RESTful API for symptom analysis
- **Multiple Endpoints**:
  - `/predict` - Single patient prediction
  - `/batch_predict` - Multiple patient predictions
  - `/symptoms` - Available symptoms list
  - `/model_info` - ML model information
- **Fallback System**: Works offline with mock predictions
- **Random Forest Model**: Trained on medical symptom datasets

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI v5** - Professional UI components
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication

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
│   │   ├── pages/          # Page components
│   │   │   ├── Welcome/    # Landing page
│   │   │   ├── Login/      # Admin login
│   │   │   ├── Dashboard/  # Admin dashboard
│   │   │   ├── Doctors/    # Doctor management
│   │   │   ├── DoctorLogin/ # Doctor login
│   │   │   └── DoctorDashboard/ # Doctor portal
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   └── styles/         # Global styles
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── package.json
├── ml-service/             # Python ML service
│   ├── app.py             # Flask application
│   ├── disease_predictor.py # ML model
│   └── requirements.txt
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ML_API_URL=http://localhost:5001
```

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_db
JWT_SECRET=your_jwt_secret_key
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
1. **Frontend**: Build and serve static files
2. **Backend**: Deploy to Node.js hosting
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
- **Role-based Access Control** (Admin vs Doctor)
- **ML Access Permissions** (configurable per doctor)
- **Input Validation** and sanitization
- **CORS Configuration** for cross-origin requests

## 🐛 Troubleshooting

### Common Issues

1. **ML Service Connection Error**
   - Ensure Python ML service is running on port 5001
   - Check firewall settings
   - System falls back to mock predictions if ML service is unavailable

2. **Frontend Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

3. **Database Connection Issues**
   - Ensure MongoDB is running
   - Check connection string in backend .env

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
- Review the API documentation

---

**Built with ❤️ for modern healthcare management**