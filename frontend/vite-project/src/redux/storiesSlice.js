import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const fetchStories = createAsyncThunk("stories/fetch", async (_, { rejectWithValue }) => {
  try { const { data } = await axiosInstance.get("/story/getStories"); return data.stories || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to load stories."); }
});

const storiesSlice = createSlice({
  name: "stories",
  initialState: { items: [], loading: false, error: "" },
  reducers: { addStory: (state, action) => { state.items.unshift(action.payload); } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStories.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(fetchStories.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchStories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { addStory } = storiesSlice.actions;
export default storiesSlice.reducer;
