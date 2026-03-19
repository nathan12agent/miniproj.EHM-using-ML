import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as nurseService from '../../services/nurseService';

export const fetchNurses = createAsyncThunk('nurses/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await nurseService.getAllNurses(params.page, params.limit, params.ward, params.status);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch nurses');
  }
});

export const addNurse = createAsyncThunk('nurses/add', async (data, { rejectWithValue }) => {
  try {
    const res = await nurseService.createNurse(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create nurse');
  }
});

export const updateNurse = createAsyncThunk('nurses/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await nurseService.updateNurse(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update nurse');
  }
});

export const deleteNurse = createAsyncThunk('nurses/delete', async (id, { rejectWithValue }) => {
  try {
    await nurseService.deleteNurse(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete nurse');
  }
});

const nurseSlice = createSlice({
  name: 'nurses',
  initialState: { nurses: [], total: 0, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNurses.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNurses.fulfilled, (s, a) => {
        s.loading = false;
        s.nurses = a.payload.nurses || a.payload;
        s.total = a.payload.total || (a.payload.nurses || a.payload).length;
      })
      .addCase(fetchNurses.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(addNurse.fulfilled, (s, a) => {
        s.nurses.unshift(a.payload.nurse || a.payload);
        s.total += 1;
      })
      .addCase(updateNurse.fulfilled, (s, a) => {
        const updated = a.payload.nurse || a.payload;
        const idx = s.nurses.findIndex(n => n._id === updated._id);
        if (idx !== -1) s.nurses[idx] = updated;
      })
      .addCase(deleteNurse.fulfilled, (s, a) => {
        s.nurses = s.nurses.filter(n => n._id !== a.payload);
        s.total -= 1;
      });
  },
});

export const { clearError } = nurseSlice.actions;
export default nurseSlice.reducer;
