import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as bedService from '../../services/bedService';

export const fetchBeds = createAsyncThunk('beds/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await bedService.getAllBeds(params.ward, params.status, params.purpose);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch beds');
  }
});

export const fetchBedStats = createAsyncThunk('beds/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await bedService.getBedStats();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch bed stats');
  }
});

export const updateBedStatus = createAsyncThunk('beds/updateStatus', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await bedService.updateBedStatus(id, data);
    return res.data.bed || res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update bed');
  }
});

const bedSlice = createSlice({
  name: 'beds',
  initialState: { beds: [], stats: null, breakdown: null, selectedWard: 'All', loading: false, error: null },
  reducers: {
    setSelectedWard: (state, action) => { state.selectedWard = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBeds.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchBeds.fulfilled, (s, a) => {
        s.loading = false;
        s.beds = a.payload.beds || a.payload;
        s.breakdown = a.payload.breakdown || null;
      })
      .addCase(fetchBeds.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchBedStats.fulfilled, (s, a) => { s.stats = a.payload; })
      .addCase(updateBedStatus.fulfilled, (s, a) => {
        const idx = s.beds.findIndex(b => b._id === a.payload._id);
        if (idx !== -1) s.beds[idx] = a.payload;
      });
  },
});

export const { setSelectedWard, clearError } = bedSlice.actions;
export default bedSlice.reducer;
