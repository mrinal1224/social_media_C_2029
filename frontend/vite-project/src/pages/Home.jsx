import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosCalls/axios";
import { useAuth } from "../context/AuthContext";
import {useDispatch } from "react-redux";
import { setPostsRedux } from "../redux/postSlice";

function Avatar({ initials, tone = "from-slate-700 to-slate-900", size = "h-11 w-11" }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white ring-2 ring-white`}>
      {initials}
    </div>
  );
}

const getLikeId = (like) => like?._id || like;

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [stories, setStories] = useState([]);
  const [storyLoading, setStoryLoading] = useState(true);
  const [storyError, setStoryError] = useState("");
  const [storyFile, setStoryFile] = useState(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyCreating, setStoryCreating] = useState(false);
  const [activeStory, setActiveStory] = useState(null);

  // CREATE FLOW STATE:
  // One simple composer supports both posts and reels.
  // contentType decides which backend endpoint and file field we use.
  const [contentType, setContentType] = useState("post");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // LIKE + COMMENT STATE:
  // Comments are fetched only when a user opens them for a post/reel.
  const [openComments, setOpenComments] = useState({});
  const [commentsByItem, setCommentsByItem] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [interactionError, setInteractionError] = useState({});

  const getItemKey = (type, id) => `${type}-${id}`;

  const isLikedByCurrentUser = (item) => {
    if (!user?._id) return false;

    return (item.likes || []).some(
      (like) => getLikeId(like)?.toString() === user._id.toString()
    );
  };


  let dispatch = useDispatch()

  // HOME FEED FETCH:
  // Keep the flow simple: fetch posts first, then fetch reels.
  // Each request has its own error handling so one API failing does not stop
  // the other content type from being loaded.
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get("/post");
        setPosts(response.data.posts || []); // this is to be removed
        dispatch(setPostsRedux(response.data.posts))
      } catch (error) {
        console.error("Posts fetch failed:", error);
        setFeedError(
          error.response?.data?.message || "Unable to load posts."
        );
      }
    };

    const fetchReels = async () => {
      try {
        const response = await axiosInstance.get("/reel");
        setReels(response.data.reels || []);
      } catch (error) {
        console.error("Reels fetch failed:", error);
        setFeedError(
          error.response?.data?.message || "Unable to load reels."
        );
      }
    };

    const loadFeed = async () => {
      try {
        setFeedLoading(true);
        setFeedError("");

        await fetchPosts();
        await fetchReels();
      } finally {
        setFeedLoading(false);
      }
    };

    loadFeed();
  }, []);

  // STORIES:
  // Fetch active stories from people the current user follows.
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setStoryLoading(true);
        setStoryError("");
        const response = await axiosInstance.get("/story/getStories");
        setStories(response.data.stories || []);
      } catch (error) {
        console.error("Stories fetch failed:", error);
        setStoryError(error.response?.data?.message || "Unable to load stories.");
      } finally {
        setStoryLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleCreateStory = async (event) => {
    event.preventDefault();

    if (!storyFile) {
      setStoryError("Please select an image for your story.");
      return;
    }

    try {
      setStoryCreating(true);
      setStoryError("");

      const formData = new FormData();
      formData.append("caption", storyCaption.trim());
      formData.append("image", storyFile);

      const response = await axiosInstance.post("/story/createStory", formData);
      setStories((prevStories) => [response.data.story, ...prevStories]);
      setStoryFile(null);
      setStoryCaption("");
      event.target.reset();
    } catch (error) {
      console.error("Story creation failed:", error);
      setStoryError(error.response?.data?.message || "Unable to create story.");
    } finally {
      setStoryCreating(false);
    }
  };

  const getStoryLabel = (story) => {
    if (story.author?._id === user?._id) return "Your Story";
    return story.author?.username || "Story";
  };

  // CREATE POST / REEL:
  // We send FormData because both backend create routes accept an uploaded file.
  const handleCreateContent = async (event) => {
    event.preventDefault();

    if (contentType === "post" && !caption.trim() && !selectedFile) {
      setCreateError("Add a caption or select an image.");
      return;
    }

    if (contentType === "reel" && !selectedFile) {
      setCreateError("Please select a video.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");

      const formData = new FormData();
      formData.append("caption", caption.trim());
      if (selectedFile) {
        formData.append(
          contentType === "post" ? "image" : "video",
          selectedFile
        );
      }

      if (contentType === "post") {
        const response = await axiosInstance.post("/post/create", formData);
        setPosts((prevPosts) => [response.data.post, ...prevPosts]);
      } else {
        const response = await axiosInstance.post("/reel/createReel", formData);
        setReels((prevReels) => [response.data.reel, ...prevReels]);
      }

      setCaption("");
      setSelectedFile(null);
      event.target.reset();
    } catch (error) {
      console.error("Content creation failed:", error);
      setCreateError(
        error.response?.data?.message || "Unable to create content."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPost = contentType === "post";
    const hasValidType = isPost
      ? file.type.startsWith("image/")
      : file.type.startsWith("video/");
    const maxSize = isPost ? 5 * 1024 * 1024 : 50 * 1024 * 1024;

    if (!hasValidType) {
      setCreateError(isPost ? "Please select a valid image." : "Please select a valid video.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      setCreateError(isPost ? "Image must be 5MB or smaller." : "Video must be 50MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setCreateError("");
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedFile(null);
    setCreateError("");
  };

  const handleLike = async (type, id) => {
    const key = getItemKey(type, id);
    const setItems = type === "post" ? setPosts : setReels;

    try {
      setLikeLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));

      const response = await axiosInstance.post(`/${type}/likes/${id}`);
      const liked = response.data.liked;

      setItems((items) =>
        items.map((item) => {
          if (item._id !== id) return item;

          const currentLikes = item.likes || [];
          const likesWithoutCurrentUser = currentLikes.filter(
            (like) => getLikeId(like)?.toString() !== user?._id?.toString()
          );

          return {
            ...item,
            likes: liked && user?._id
              ? [...likesWithoutCurrentUser, user._id]
              : likesWithoutCurrentUser,
          };
        })
      );
    } catch (error) {
      console.error("Like update failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to update like.",
      }));
    } finally {
      setLikeLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleComments = async (type, id) => {
    const key = getItemKey(type, id);
    const willOpen = !openComments[key];

    setOpenComments((prev) => ({ ...prev, [key]: willOpen }));

    if (!willOpen || commentsByItem[key] !== undefined) {
      return;
    }

    try {
      setCommentLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));

      const response = await axiosInstance.get(`/comment/${type}/${id}`);

      setCommentsByItem((prev) => ({
        ...prev,
        [key]: response.data.comments || [],
      }));
    } catch (error) {
      console.error("Comments fetch failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to load comments.",
      }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAddComment = async (event, type, id) => {
    event.preventDefault();

    const key = getItemKey(type, id); // reel or post
    const text = commentInputs[key]?.trim();

    if (!text) return;

    try {
      setCommentLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));

      const response = await axiosInstance.post(`/comment/${type}/${id}`, {
        text,
      });

      setCommentsByItem((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), response.data.comment],
      }));

      setCommentInputs((prev) => ({
        ...prev,
        [key]: "",
      }));
    } catch (error) {
      console.error("Comment create failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to add comment.",
      }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteComment = async (commentId, type, id) => {
    const key = getItemKey(type, id);

    try {
      setInteractionError((prev) => ({ ...prev, [key]: "" }));
      await axiosInstance.delete(`/comment/${commentId}`);

      setCommentsByItem((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((comment) => comment._id !== commentId),
      }));
    } catch (error) {
      console.error("Comment delete failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to delete comment.",
      }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) =>
    name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  const renderInteractions = (item, type) => {
    const key = getItemKey(type, item._id);
    const liked = isLikedByCurrentUser(item);
    const comments = commentsByItem[key];

    return (
      <>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>{item.likes?.length || 0} likes</span>
          <span>
            {comments !== undefined
              ? `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`
              : "Comments"}
          </span>
        </div>

        <div className="mt-4 flex border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => handleLike(type, item._id)}
            disabled={likeLoading[key]}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              liked
                ? "text-rose-600 hover:bg-rose-50"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {liked ? "♥ Liked" : "♡ Like"}
          </button>

          <button
            type="button"
            onClick={() => handleToggleComments(type, item._id)}
            className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ◌ {openComments[key] ? "Hide Comments" : "Comment"}
          </button>

          <button
            type="button"
            className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ↗ Share
          </button>
        </div>

        {interactionError[key] && (
          <p className="mt-2 text-xs text-red-500">{interactionError[key]}</p>
        )}

        {openComments[key] && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {commentLoading[key] && comments === undefined ? (
              <p className="text-xs text-slate-400">Loading comments...</p>
            ) : (
              <div className="space-y-3">
                {(comments || []).map((comment) => (
                  <div key={comment._id} className="flex items-start gap-3">
                    <img
                      src={
                        comment.user?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment.user?.name || "User"
                        )}&background=6366f1&color=fff`
                      }
                      alt={comment.user?.name || "User"}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-bold text-slate-700">
                          {comment.user?.name || "Unknown User"}
                        </p>
                        {comment.user?._id === user?._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id, type, item._id)}
                            className="text-[11px] font-semibold text-slate-400 transition hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 break-words text-sm text-slate-600">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}

                {comments?.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No comments yet. Start the conversation.
                  </p>
                )}
              </div>
            )}

            <form
              onSubmit={(event) => handleAddComment(event, type, item._id)}
              className="mt-4 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentInputs[key] || ""}
                onChange={(event) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [key]: event.target.value,
                  }))
                }
                maxLength={500}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
              />
              <button
                type="submit"
                disabled={commentLoading[key] || !commentInputs[key]?.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post
              </button>
            </form>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/home")} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-sm">
              S
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-base font-black tracking-tight">SST Social</p>
              <p className="text-[11px] text-slate-500">Your circle, your feed.</p>
            </div>
          </button>

          <div className="hidden w-72 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:flex">
            <span className="text-base">⌕</span>
            <span>Search people or posts</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications">♡</button>
            <button
              onClick={() => navigate(`/profile/${user?.username}`)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:shadow-sm"
            >
              <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" size="h-8 w-8" />
              <span className="hidden text-sm font-semibold sm:block">{user?.name || "You"}</span>
            </button>
            <button onClick={handleLogout} className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block">Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-left">
                <span className="text-lg">⌂</span>
                <span className="text-sm font-bold text-indigo-700">Home Feed</span>
              </button>
              <button onClick={() => navigate(`/profile/${user?.username}`)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50">
                <span className="text-lg">◉</span>
                <span className="text-sm font-semibold">My Profile</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50">
                <span className="text-lg">♡</span>
                <span className="text-sm font-semibold">Notifications</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50">
                <span className="text-lg">⌁</span>
                <span className="text-sm font-semibold">Explore</span>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h1 className="text-xl font-black tracking-tight">Your Feed</h1>
                <p className="mt-1 text-xs text-slate-500">See what your circle is up to.</p>
              </div>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Latest ↓</button>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <form onSubmit={handleCreateStory} className="mb-4 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={storyCaption}
                  onChange={(event) => setStoryCaption(event.target.value)}
                  maxLength={200}
                  placeholder="Story caption"
                  className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-slate-100"
                />
                <label className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  {storyFile ? storyFile.name : "Choose Story Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        setStoryError("Please select a valid image.");
                        event.target.value = "";
                        return;
                      }
                      setStoryFile(file);
                      setStoryError("");
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={storyCreating}
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {storyCreating ? "Sharing..." : "Add Story"}
                </button>
              </form>

              {storyError && <p className="mb-3 text-xs text-red-500">{storyError}</p>}

              {storyLoading ? (
                <p className="text-xs text-slate-400">Loading stories...</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                  {stories.map((story) => (
                    <button
                      key={story._id}
                      type="button"
                      onClick={() => setActiveStory(story)}
                      className="group flex w-[76px] shrink-0 flex-col items-center gap-2"
                    >
                      <div className="rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 p-[3px] transition group-hover:scale-105">
                        <div className="rounded-full bg-white p-[2px]">
                          <img
                            src={story.author?.profileImage || story.image}
                            alt={story.author?.username || "Story"}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600">
                        {getStoryLabel(story)}
                      </span>
                    </button>
                  ))}

                  {stories.length === 0 && (
                    <p className="text-xs text-slate-400">No active stories yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CREATE POST / REEL COMPOSER */}
          <form
            onSubmit={handleCreateContent}
            className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" />

              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder={`What's on your mind, ${user?.name?.split(" ")[0] || "there"}?`}
                className="flex-1 resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleContentTypeChange("post")}
                className={contentType === "post" ? "rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"}
              >
                ▧ Post
              </button>

              <button
                type="button"
                onClick={() => handleContentTypeChange("reel")}
                className={contentType === "reel" ? "rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"}
              >
                ▶ Reel
              </button>

              <label className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50">
                {contentType === "post" ? "Choose Image" : "Choose Video"}
                <input
                  type="file"
                  accept={contentType === "post" ? "image/*" : "video/*"}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={createLoading}
                className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createLoading ? "Creating..." : contentType === "post" ? "Create Post" : "Create Reel"}
              </button>
            </div>

            {selectedFile && (
              <p className="mt-2 text-xs text-slate-500">Selected: {selectedFile.name}</p>
            )}

            {createError && (
              <p className="mt-2 text-xs text-red-500">{createError}</p>
            )}
          </form>

          <div className="space-y-5">
            {feedLoading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Loading your feed...
              </div>
            )}

            {!feedLoading && feedError && (
              <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm text-red-600 shadow-sm">
                {feedError}
              </div>
            )}

            {!feedLoading && !feedError && posts.length === 0 && reels.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="font-bold text-slate-700">Your feed is empty</p>
                <p className="mt-1 text-sm text-slate-500">
                  Create a post or reel to get started.
                </p>
              </div>
            )}

            {/* POSTS: render real API data returned by GET /post. */}
            {posts.map((post) => (
              <article
                key={post._id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        post.author?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          post.author?.name || "User"
                        )}&background=6366f1&color=fff`
                      }
                      alt={post.author?.name || "User"}
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        {post.author?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{post.author?.username || "user"} ·{" "}
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="rounded-full px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-50">
                    •••
                  </button>
                </div>

                {post.image && (
                  <img
                    src={post.image}
                    alt={post.caption || "Post"}
                    className="max-h-[620px] w-full object-cover"
                  />
                )}

                <div className="px-5 pb-5 pt-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {post.caption}
                  </p>

                  {renderInteractions(post, "post")}
                </div>
              </article>
            ))}

            {/* REELS: render real API data returned by GET /reel. */}
            {reels.map((reel) => (
              <article
                key={reel._id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        reel.author?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          reel.author?.name || "User"
                        )}&background=6366f1&color=fff`
                      }
                      alt={reel.author?.name || "User"}
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        {reel.author?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{reel.author?.username || "user"} ·{" "}
                        {new Date(reel.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="rounded-full px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-50">
                    •••
                  </button>
                </div>

                {reel.video && (
                  <video
                    src={reel.video}
                    controls
                    className="max-h-[620px] w-full bg-black object-contain"
                  />
                )}

                <div className="px-5 pb-5 pt-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {reel.caption}
                  </p>

                  {renderInteractions(reel, "reel")}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black">People to follow</h2>
                <button className="text-xs font-bold text-indigo-600">See all</button>
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ["Priya Nair", "priyanair", "PN", "from-amber-400 to-orange-500"],
                  ["Arjun Kapoor", "arjunk", "AK", "from-emerald-400 to-teal-500"],
                  ["Meera Das", "meerad", "MD", "from-fuchsia-500 to-purple-500"],
                ].map(([name, handle, initials, tone]) => (
                  <div key={handle} className="flex items-center gap-3">
                    <Avatar initials={initials} tone={tone} size="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{name}</p>
                      <p className="truncate text-xs text-slate-400">@{handle}</p>
                    </div>
                    <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <img
                  src={activeStory.author?.profileImage || activeStory.image}
                  alt={activeStory.author?.username || "Story"}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-bold">{getStoryLabel(activeStory)}</p>
                  <p className="text-[11px] text-white/60">
                    {new Date(activeStory.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="rounded-full px-3 py-1 text-xl text-white/80 hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <img
              src={activeStory.image}
              alt={activeStory.caption || "Story"}
              className="max-h-[75vh] w-full bg-black object-contain"
            />

            {activeStory.caption && (
              <p className="bg-black px-4 py-4 text-sm text-white">{activeStory.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
