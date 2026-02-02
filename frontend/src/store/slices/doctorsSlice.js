import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  doctors: [],
  currentDoctor: null,
  loading: false,
  error: null,
};

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setDoctorsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setDoctorsSuccess: (state, action) => {
      state.doctors = action.payload;
      state.loading = false;
      state.error = null;
    },
    setDoctorsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCurrentDoctor: (state, action) => {
      state.currentDoctor = action.payload;
    },
    addDoctor: (state, action) => {
      state.doctors.push(action.payload);
    },
    updateDoctor: (state, action) => {
      const index = state.doctors.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.doctors[index] = action.payload;
      }
    },
    deleteDoctor: (state, action) => {
      state.doctors = state.doctors.filter(d => d._id !== action.payload);
    },
  },
});

export const {
  setDoctorsLoading,
  setDoctorsSuccess,
  setDoctorsError,
  setCurrentDoctor,
  addDoctor,
  updateDoctor,
  deleteDoctor,
} = doctorsSlice.actions;

export default doctorsSlice.reducer;