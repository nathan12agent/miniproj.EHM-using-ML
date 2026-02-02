import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  appointments: [],
  currentAppointment: null,
  loading: false,
  error: null,
};

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointmentsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAppointmentsSuccess: (state, action) => {
      state.appointments = action.payload;
      state.loading = false;
      state.error = null;
    },
    setAppointmentsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCurrentAppointment: (state, action) => {
      state.currentAppointment = action.payload;
    },
    addAppointment: (state, action) => {
      state.appointments.push(action.payload);
    },
    updateAppointment: (state, action) => {
      const index = state.appointments.findIndex(a => a._id === action.payload._id);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    },
    deleteAppointment: (state, action) => {
      state.appointments = state.appointments.filter(a => a._id !== action.payload);
    },
  },
});

export const {
  setAppointmentsLoading,
  setAppointmentsSuccess,
  setAppointmentsError,
  setCurrentAppointment,
  addAppointment,
  updateAppointment,
  deleteAppointment,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;