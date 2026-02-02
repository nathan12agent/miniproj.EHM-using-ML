# Frontend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- Backend server running on http://localhost:5000

## Installation Steps

### 1. Install Dependencies

```cmd
cd frontend
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file in the `frontend` folder if you need custom configuration:

```env
REACT_APP_API_URL=http://localhost:5000/api
PORT=3000
```

Note: The `proxy` in `package.json` already handles API requests to the backend.

### 3. Start the Frontend

```cmd
npm start
```

The frontend will run on http://localhost:3000

### 4. Login to the Application

Open http://localhost:3000 in your browser and login with:
- **Email**: admin@hospital.com
- **Password**: admin123

## Features

- **Dashboard**: Overview of hospital statistics
- **Patients Management**: Add, view, edit, and delete patients
- **Doctors Management**: Manage doctor profiles
- **Appointments**: Schedule and manage appointments
- **Authentication**: Secure login with JWT tokens

## Troubleshooting

### Cannot Connect to Backend
- Make sure backend is running on http://localhost:5000
- Check backend health: http://localhost:5000/health
- Verify CORS is enabled in backend

### Login Not Working
- Check browser console for errors
- Verify backend is seeded with admin user
- Check network tab in browser DevTools

### Port Already in Use
- Change PORT in `.env` file
- Or kill process: `netstat -ano | findstr :3000`

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Project Structure

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # Reusable components
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── store/       # Redux store
│   └── styles/      # Global styles
```
