import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const fetchProfileByUsername = createAsyncThunk("profiles/fetchByUsername", async (username, { rejectWithValue }) => {
  try { const { data } = await axiosInstance.get(`/users/profile/${username}`); return data.userData; }
  catch (error) { return rejectWithValue({ username, message: error.response?.data?.message || "Unable to load profile." }); }
});

const profilesSlice = createSlice({
  name: "profiles",
  initialState: { byUsername: {}, loadingByUsername: {}, errorByUsername: {} },
  reducers: {
    upsertProfile: (state, action) => { state.byUsername[action.payload.username] = action.payload; },
    removeProfileKey: (state, action) => { delete state.byUsername[action.payload]; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileByUsername.pending, (state, action) => {
        const username = action.meta.arg; state.loadingByUsername[username] = true; state.errorByUsername[username] = "";
      })
      .addCase(fetchProfileByUsername.fulfilled, (state, action) => {
        const username = action.meta.arg; state.loadingByUsername[username] = false; state.byUsername[username] = action.payload;
      })
      .addCase(fetchProfileByUsername.rejected, (state, action) => {
        const username = action.meta.arg; state.loadingByUsername[username] = false; state.errorByUsername[username] = action.payload?.message || "Unable to load profile.";
      });
  },
});

export const { upsertProfile, removeProfileKey } = profilesSlice.actions;
export const selectProfileByUsername = (state, username) => state.profiles.byUsername[username] || null;
export default profilesSlice.reducer;
