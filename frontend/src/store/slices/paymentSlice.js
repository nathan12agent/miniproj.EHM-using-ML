import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as svc from '../../services/paymentService';

export const createOrder = createAsyncThunk('payment/createOrder', async (data, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.createOrder(data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create order');
  }
});

export const verifyPayment = createAsyncThunk('payment/verifyPayment', async (data, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.verifyPayment(data, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Payment verification failed');
  }
});

export const fetchHistory = createAsyncThunk('payment/fetchHistory', async (_, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.getHistory(token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
  }
});

export const fetchReceipt = createAsyncThunk('payment/fetchReceipt', async (paymentId, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    const res = await svc.getReceipt(paymentId, token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch receipt');
  }
});

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    currentOrder: null,
    history: [],
    receipt: null,
    loading: false,
    error: null,
    verifiedPayment: null,
  },
  reducers: {
    clearOrder: (state) => { state.currentOrder = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.loading = true; state.error = null; state.currentOrder = null; })
      .addCase(createOrder.fulfilled, (state, action) => { state.loading = false; state.currentOrder = action.payload; })
      .addCase(createOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(verifyPayment.pending, (state) => { state.loading = true; })
      .addCase(verifyPayment.fulfilled, (state, action) => { state.loading = false; state.verifiedPayment = action.payload.payment; })
      .addCase(verifyPayment.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchHistory.fulfilled, (state, action) => { state.history = action.payload; })
      .addCase(fetchReceipt.fulfilled, (state, action) => { state.receipt = action.payload; });
  }
});

export const { clearOrder, clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
