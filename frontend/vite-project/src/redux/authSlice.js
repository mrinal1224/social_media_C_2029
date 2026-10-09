import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const hydrateCurrentUser = createAsyncThunk("auth/hydrate", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get("/users/me");
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Not authenticated");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, loading: true, error: "" },
  reducers: {
    setCurrentUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = "";
    },
    clearCurrentUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = "";
    },
    patchCurrentUser: (state, action) => {
      if (!state.user) state.user = {};
      state.user = { ...state.user, ...action.payload };
    },
    addFollowing: (state, action) => {
      if (!state.user) return;
      const current = state.user.followings || [];
      const id = action.payload;
      if (!current.some((item) => (item?._id || item)?.toString() === id?.toString())) {
        state.user.followings = [...current, id];
      }
    },
    removeFollowing: (state, action) => {
      if (!state.user) return;
      const id = action.payload;
      state.user.followings = (state.user.followings || []).filter(
        (item) => (item?._id || item)?.toString() !== id?.toString()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(hydrateCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(hydrateCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });
  },
});

export const { setCurrentUser, clearCurrentUser, patchCurrentUser, addFollowing, removeFollowing } = authSlice.actions;
export default authSlice.reducer;
