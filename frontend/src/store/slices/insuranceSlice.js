import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as svc from '../../services/insuranceService';

export const validatePolicy = createAsyncThunk('insurance/validatePolicy', async (data, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.validatePolicy(data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Validation failed');
  }
});

export const submitClaim = createAsyncThunk('insurance/submitClaim', async (data, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.submitClaim(data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit claim');
  }
});

export const fetchClaims = createAsyncThunk('insurance/fetchClaims', async (params = {}, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.getClaims(params, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch claims');
  }
});

export const reviewClaim = createAsyncThunk('insurance/reviewClaim', async ({ claimId, data }, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.reviewClaim(claimId, data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to review claim');
  }
});

export const fetchActiveClaim = createAsyncThunk('insurance/fetchActiveClaim', async (patientId, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.fetchActiveClaim(patientId, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'No active claim found');
  }
});

const insuranceSlice = createSlice({
  name: 'insurance',
  initialState: {
    claims: [],
    totalClaims: 0,
    currentPage: 1,
    validationResult: null,
    activeClaim: null,
    lastSubmittedClaim: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearValidation: (state) => { state.validationResult = null; },
    clearError: (state) => { state.error = null; },
    clearActiveClaim: (state) => { state.activeClaim = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validatePolicy.pending, (state) => { state.loading = true; state.error = null; state.validationResult = null; })
      .addCase(validatePolicy.fulfilled, (state, action) => { state.loading = false; state.validationResult = action.payload; })
      .addCase(validatePolicy.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(submitClaim.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitClaim.fulfilled, (state, action) => { state.loading = false; state.lastSubmittedClaim = action.payload; })
      .addCase(submitClaim.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchClaims.pending, (state) => { state.loading = true; })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = action.payload.claims;
        state.totalClaims = action.payload.total;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchClaims.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(reviewClaim.fulfilled, (state, action) => {
        const idx = state.claims.findIndex(c => c.claimId === action.payload.claimId);
        if (idx !== -1) state.claims[idx] = action.payload;
      })
      .addCase(fetchActiveClaim.pending, (state) => { state.loading = true; state.activeClaim = null; })
      .addCase(fetchActiveClaim.fulfilled, (state, action) => { state.loading = false; state.activeClaim = action.payload; })
      .addCase(fetchActiveClaim.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearValidation, clearError, clearActiveClaim } = insuranceSlice.actions;
export default insuranceSlice.reducer;
