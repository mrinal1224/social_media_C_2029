import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const fetchReels = createAsyncThunk("reels/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await axiosInstance.get("/reel"); return data.reels || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to load reels."); }
});

export const fetchReelsByUsername = createAsyncThunk("reels/fetchByUsername", async (username, { rejectWithValue }) => {
  try { const { data } = await axiosInstance.get(`/reel/user/${username}`); return data.reels || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to load reels."); }
});

const merge = (state, incoming) => {
  incoming.forEach((reel) => {
    const index = state.items.findIndex((item) => item._id === reel._id);
    if (index === -1) state.items.push(reel); else state.items[index] = reel;
  });
};

const reelsSlice = createSlice({
  name: "reels",
  initialState: { items: [], loading: false, error: "" },
  reducers: {
    addReel: (state, action) => { state.items.unshift(action.payload); },
    updateReelLike: (state, action) => {
      const { reelId, userId, liked } = action.payload;
      const reel = state.items.find((item) => item._id === reelId);
      if (!reel) return;
      const withoutMe = (reel.likes || []).filter((like) => (like?._id || like)?.toString() !== userId?.toString());
      reel.likes = liked && userId ? [...withoutMe, userId] : withoutMe;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReels.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(fetchReels.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchReels.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchReelsByUsername.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(fetchReelsByUsername.fulfilled, (state, action) => { state.loading = false; merge(state, action.payload); })
      .addCase(fetchReelsByUsername.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { addReel, updateReelLike } = reelsSlice.actions;
export const selectReelsByUsername = (state, username) => state.reels.items.filter((reel) => reel.author?.username === username);
export default reelsSlice.reducer;
