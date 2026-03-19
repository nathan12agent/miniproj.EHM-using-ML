import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as insuranceService from '../../services/insuranceService';

export const fetchPolicy = createAsyncThunk('insurance/fetchPolicy', async (patientId, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await insuranceService.getPolicy(patientId, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch policy');
  }
});

export const fetchClaims = createAsyncThunk('insurance/fetchClaims', async (page = 1, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await insuranceService.getClaims(page, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch claims');
  }
});

export const submitClaim = createAsyncThunk('insurance/submitClaim', async (data, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await insuranceService.submitClaim(data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit claim');
  }
});

export const reviewClaim = createAsyncThunk('insurance/reviewClaim', async ({ claimId, data }, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await insuranceService.reviewClaim(claimId, data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to review claim');
  }
});

const insuranceSlice = createSlice({
  name: 'insurance',
  initialState: {
    policy: null,
    claims: [],
    totalClaims: 0,
    currentPage: 1,
    loading: false,
    error: null,
    fraudPrecheck: null,
    lastSubmittedClaim: null
  },
  reducers: {
    setFraudPrecheck: (state, action) => { state.fraudPrecheck = action.payload; },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicy.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPolicy.fulfilled, (state, action) => { state.loading = false; state.policy = action.payload; })
      .addCase(fetchPolicy.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchClaims.pending, (state) => { state.loading = true; })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.claims = action.payload.claims;
        state.totalClaims = action.payload.total;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchClaims.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(submitClaim.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitClaim.fulfilled, (state, action) => { state.loading = false; state.lastSubmittedClaim = action.payload; })
      .addCase(submitClaim.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(reviewClaim.fulfilled, (state, action) => {
        const idx = state.claims.findIndex(c => c.claimId === action.payload.claimId);
        if (idx !== -1) state.claims[idx] = action.payload;
      });
  }
});

export const { setFraudPrecheck, clearError } = insuranceSlice.actions;
export default insuranceSlice.reducer;
