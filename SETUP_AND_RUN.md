# 🏥 AI Medical Disease Detection System
## Complete Setup and Execution Guide

### 📋 System Overview
This is an AI-powered medical system that provides:
- **Disease Helper**: AI disease detection with treatment recommendations
- **Patient Records**: Automatic patient record management
- **Dashboard**: Real-time analytics and patient history
- **Enhanced ML**: Advanced ensemble models for high accuracy

---

## 🚀 Quick Start (Recommended)

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or cloud)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install ML service dependencies
cd ../ml-service
pip install -r requirements.txt
```

### 2. Environment Setup

Create `.env` file in the `backend` folder:
```env
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
```

### 3. Start All Services

**Terminal 1 - ML Service:**
```bash
cd ml-service
python app.py
```

**Terminal 2 - Backend API:**
```bash
cd backend
node server.js
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

### 4. Access the Application
- **Main Application**: http://localhost:3000
- **Doctor Portal**: http://localhost:3000/doctor/login

---

## 🔐 Login Credentials

### Doctor Portal Access
- **Username**: `sarah.johnson` | **Password**: `doctor123`
- **Username**: `emily.rodriguez` | **Password**: `doctor123`
- **Username**: `michael.chen` | **Password**: `doctor123`

All doctors have ML access enabled for disease detection.

---

## 🎯 How to Use the System

### 1. Disease Helper Workflow
1. **Login** to the doctor portal
2. **Navigate** to "Disease Helper" tab
3. **Enter** patient information (name, age, gender, medical history)
4. **Select** symptoms using the searchable dropdown
5. **Click** "Detect Disease" 
   - AI analyzes symptoms using ensemble ML models
   - Patient is automatically saved to records
   - View diagnosis with confidence levels
   - See similar patient cases
   - Review treatment recommendations
6. **Optional**: Generate formal report for printing/download

### 2. Dashboard Features
- **Patient Statistics**: View total patients and reports
- **Recent Records**: See latest patient detections
- **ML Accuracy**: Real-time model performance metrics
- **Analytics**: Recovery rates and system statistics

---

## 🔧 Technical Details

### System Architecture
```
Frontend (React) ←→ Backend (Node.js/Express) ←→ MongoDB
                           ↕
                    ML Service (Python/Flask)
```

### Ports Used
- **Frontend**: 3000
- **Backend API**: 5000  
- **ML Service**: 5001
- **MongoDB**: 27017 (default)

### ML Models
- **Random Forest**: Primary classification model
- **SVM**: Support Vector Machine with RBF kernel
- **Gradient Boosting**: Ensemble boosting algorithm
- **Extra Trees**: Additional ensemble method
- **Neural Network**: Multi-layer perceptron
- **Voting Ensemble**: Combines all models for best accuracy

---

## 🛠️ Advanced Setup Options

### Using Docker (Alternative)
```bash
# Build and run all services
docker-compose up --build

# Access at http://localhost:3000
```

### Database Setup
The system uses MongoDB. You can:
1. **Local MongoDB**: Install MongoDB locally
2. **MongoDB Atlas**: Use cloud MongoDB (update MONGODB_URI in .env)
3. **Docker MongoDB**: Use the provided docker-compose.yml

### ML Model Training
The system automatically:
- Loads existing trained models if available
- Trains new enhanced models if needed
- Uses Training.csv (4,920 samples) for training
- Uses Testing.csv (42 samples) for validation

---

## 📊 Features Overview

### ✅ Disease Helper
- **AI Disease Detection**: Advanced ensemble ML models
- **Symptom Search**: Searchable dropdown with 132+ symptoms
- **Patient Auto-Save**: Automatic record creation
- **Treatment Plans**: Severity-based recommendations
- **Similar Cases**: Find patients with similar conditions
- **Report Generation**: Optional formal medical reports

### ✅ Dashboard
- **Real-time Analytics**: Live system performance
- **Patient Records**: Complete patient history
- **ML Metrics**: Model accuracy and confidence tracking
- **Quick Stats**: Patients, reports, accuracy rates

### ✅ Enhanced Security
- **JWT Authentication**: Secure login system
- **Role-based Access**: Doctor-specific permissions
- **Logout Confirmation**: Prevent accidental logouts
- **Session Management**: Automatic session handling

---

## 🔍 Troubleshooting

### Common Issues

**1. ML Service Not Starting**
```bash
# Check Python dependencies
cd ml-service
pip install -r requirements.txt

# Verify Training.csv and Testing.csv exist in root folder
```

**2. Backend Connection Issues**
```bash
# Check MongoDB is running
# Verify .env file exists in backend folder
# Check port 5000 is not in use
```

**3. Frontend Build Errors**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**4. Database Connection**
- Ensure MongoDB is running on port 27017
- Check MONGODB_URI in backend/.env file
- Verify network connectivity for cloud MongoDB

### Performance Optimization
- **ML Models**: First run may take time to train models
- **Database**: Index optimization happens automatically
- **Frontend**: Production build with `npm run build`

---

## 📈 System Monitoring

### Health Checks
- **ML Service**: http://localhost:5001/health
- **Backend API**: http://localhost:5000/api-docs
- **Frontend**: http://localhost:3000

### Logs Location
- **ML Service**: Console output with model performance
- **Backend**: Server logs with API requests
- **Frontend**: Browser console for client-side logs

---

## 🎯 Production Deployment

### Environment Variables
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=your_production_frontend_url
```

### Build Commands
```bash
# Frontend production build
cd frontend
npm run build

# Backend production start
cd backend
npm start

# ML service production
cd ml-service
python app.py
```

---

## 📞 Support

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Internet connection for initial setup
- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)

### File Structure
```
├── backend/          # Node.js API server
├── frontend/         # React application
├── ml-service/       # Python ML service
├── Training.csv      # ML training data (4,920 samples)
├── Testing.csv       # ML testing data (42 samples)
└── SETUP_AND_RUN.md  # This guide
```

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **ML Service**: "Disease predictor initialized successfully"
2. **Backend**: "Connected to MongoDB" and "Server running on port 5000"
3. **Frontend**: "Compiled successfully!" and opens browser automatically
4. **Login**: Can access doctor portal with provided credentials
5. **Disease Detection**: Can detect diseases and see results
6. **Records**: Patients automatically saved to database
7. **Dashboard**: Shows real patient data and analytics

---

**🏥 Ready to revolutionize medical diagnosis with AI!**

For technical support or questions, check the console logs for detailed error messages.