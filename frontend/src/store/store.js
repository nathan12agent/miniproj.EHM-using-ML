import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientsReducer from './slices/patientsSlice';
import doctorsReducer from './slices/doctorsSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import insuranceReducer from './slices/insuranceSlice';
import paymentReducer from './slices/paymentSlice';
import nurseReducer from './slices/nurseSlice';
import bedReducer from './slices/bedSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    doctors: doctorsReducer,
    appointments: appointmentsReducer,
    insurance: insuranceReducer,
    payment: paymentReducer,
    nurses: nurseReducer,
    beds: bedReducer,
  },
});

export default store;
