import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  patients: [],
  currentPatient: null,
  loading: false,
  error: null,
};

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatientsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPatientsSuccess: (state, action) => {
      state.patients = action.payload;
      state.loading = false;
      state.error = null;
    },
    setPatientsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    addPatient: (state, action) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    deletePatient: (state, action) => {
      state.patients = state.patients.filter(p => p._id !== action.payload);
    },
  },
});

export const {
  setPatientsLoading,
  setPatientsSuccess,
  setPatientsError,
  setCurrentPatient,
  addPatient,
  updatePatient,
  deletePatient,
} = patientsSlice.actions;

export default patientsSlice.reducer;