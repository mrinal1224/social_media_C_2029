import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const fetchFeedPosts = createAsyncThunk("posts/fetchFeed", async (_, { rejectWithValue }) => {
  try { const { data } = await axiosInstance.get("/post"); return data.posts || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to load posts."); }
});

export const fetchPostsByUsername = createAsyncThunk("posts/fetchByUsername", async (username, { rejectWithValue }) => {
  try { const { data } = await axiosInstance.get(`/post/user/${username}`); return data.posts || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to load posts."); }
});

const mergePosts = (state, incoming) => {
  incoming.forEach((post) => {
    const index = state.items.findIndex((item) => item._id === post._id);
    if (index === -1) state.items.push(post); else state.items[index] = post;
  });
};

const postsSlice = createSlice({
  name: "posts",
  initialState: { items: [], loading: false, error: "" },
  reducers: {
    setPosts: (state, action) => { state.items = action.payload; },
    addPost: (state, action) => { state.items.unshift(action.payload); },
    replaceUserPosts: (state, action) => { mergePosts(state, action.payload); },
    updatePostLike: (state, action) => {
      const { postId, userId, liked } = action.payload;
      const post = state.items.find((item) => item._id === postId);
      if (!post) return;
      const withoutMe = (post.likes || []).filter((like) => (like?._id || like)?.toString() !== userId?.toString());
      post.likes = liked && userId ? [...withoutMe, userId] : withoutMe;
    },
    setPostsLoading: (state, action) => { state.loading = action.payload; },
    setPostsError: (state, action) => { state.error = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedPosts.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(fetchFeedPosts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchFeedPosts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchPostsByUsername.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(fetchPostsByUsername.fulfilled, (state, action) => { state.loading = false; mergePosts(state, action.payload); })
      .addCase(fetchPostsByUsername.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { setPosts, addPost, replaceUserPosts, updatePostLike, setPostsLoading, setPostsError } = postsSlice.actions;
export const selectPostsByUsername = (state, username) => state.posts.items.filter((post) => post.author?.username === username);
export default postsSlice.reducer;
