import { configureStore } from "@reduxjs/toolkit";
import postsReducer from "./postsSlice";
import reelsReducer from "./reelsSlice";
import profilesReducer from "./profilesSlice";
import storiesReducer from "./storiesSlice";
import authReducer from "./authSlice";

// Shared server state lives here. Pages do not own independent copies.
// MongoDB remains persistent storage; each route hydrates the store on refresh.
export const store = configureStore({
  reducer: {
    posts: postsReducer,
    reels: reelsReducer,
    profiles: profilesReducer,
    stories: storiesReducer,
    auth: authReducer,
  },
});
