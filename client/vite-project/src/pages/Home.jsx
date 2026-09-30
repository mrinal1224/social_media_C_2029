import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../axiosCalls/axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const stories = [
  { name: "Your Story", initials: "You", tone: "from-indigo-500 to-violet-500" },
  { name: "Ananya", initials: "AN", tone: "from-pink-500 to-rose-500" },
  { name: "Rohan", initials: "RO", tone: "from-cyan-500 to-blue-500" },
  { name: "Priya", initials: "PR", tone: "from-amber-400 to-orange-500" },
  { name: "Arjun", initials: "AR", tone: "from-emerald-400 to-teal-500" },
];

function Avatar({ initials, tone = "from-slate-700 to-slate-900", size = "h-11 w-11" }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white ring-2 ring-white`}>
      {initials}
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contentType, setContentType] = useState("post");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const publishingRef = useRef(false);
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadFeed = async () => {
      const results = await Promise.allSettled([
        axiosInstance.get("post/getAllPosts", { signal: controller.signal }),
        axiosInstance.get("reel/getAllReels", { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      const items = [];
      const failed = [];
      results.forEach((result, index) => {
        const type = index === 0 ? "post" : "reel";
        const records = result.status === "fulfilled" ? result.value.data[`${type}s`] : null;
        if (Array.isArray(records)) {
          items.push(...records.map((record) => ({ ...record, type })));
        } else {
          failed.push(`${type}s`);
        }
      });
      setFeed((current) => [
        ...current.filter((item) => failed.includes(`${item.type}s`)),
        ...items,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setFeedError(failed.length ? `Could not load ${failed.join(" and ")}. Please try again.` : "");
      setLoadingFeed(false);
    };
    loadFeed();
    return () => controller.abort();
  }, [refreshKey]);

  const handlePublish = async (event) => {
    event.preventDefault();
    if (publishingRef.current || loadingFeed) return;
    setPublishError("");
    setPublishMessage("");
    if (!caption.trim()) {
      setPublishError("Please add a caption.");
      return;
    }
    if (contentType === "reel" && !selectedFile) {
      setPublishError("Please choose a video for your reel.");
      return;
    }
    const mediaType = contentType === "post" ? "image" : "video";
    const sizeLimit = contentType === "post" ? 5 : 50;
    if (selectedFile && (!selectedFile.type.startsWith(`${mediaType}/`) || selectedFile.size > sizeLimit * 1024 * 1024)) {
      setPublishError(`Choose a valid ${mediaType} no larger than ${sizeLimit} MB.`);
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption.trim());


    if (selectedFile) formData.append(mediaType, selectedFile);
    publishingRef.current = true;
    setPublishing(true);
    try {
      const endpoint = contentType === "post" ? "post/createPost" : "reel/createReel";
      const { data } = await axiosInstance.post(endpoint, formData);
      const created = { ...data[contentType], type: contentType };

      console.log(created)
      setFeed((current) => [created, ...current.filter((item) => item.type !== created.type || item._id !== created._id)]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPublishMessage(contentType === "post" ? "Post published." : "Reel published.");
    } catch (error) {
      setPublishError(error.response?.data?.message || "Could not publish. Please try again.");
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedFile(null);
    setPublishError("");
    setPublishMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getInitials = (name) =>
    name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

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
            <button type="button" disabled title="Logout is not available yet" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-400 sm:block">Logout</button>
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
            <div className="flex gap-4 overflow-x-auto border-t border-slate-100 px-5 py-4 scrollbar-hide">
              {stories.map((story, index) => (
                <button key={story.name} className="group flex w-[76px] shrink-0 flex-col items-center gap-2">
                  <div className={`rounded-full bg-gradient-to-br ${story.tone} p-[3px] transition group-hover:scale-105`}>
                    <div className="rounded-full bg-white p-[2px]">
                      <Avatar initials={index === 0 ? getInitials(user?.name) : story.initials} tone={story.tone} size="h-12 w-12" />
                    </div>
                  </div>
                  <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600">{index === 0 ? "Your Story" : story.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Publish images, text posts, and video reels using multipart FormData. */}
          <form
            onSubmit={handlePublish}
            className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <fieldset disabled={publishing}>
              <div className="flex items-start gap-3">
                <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" />

                <textarea
                  aria-label="Caption"
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
                    ref={fileInputRef}
                    type="file"
                    accept={contentType === "post" ? "image/*" : "video/*"}
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={publishing || loadingFeed || !caption.trim() || (contentType === "reel" && !selectedFile)}
                  className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {publishing ? "Publishing…" : contentType === "post" ? "Create Post" : "Create Reel"}
                </button>
              </div>

              {selectedFile && (
                <p className="mt-2 text-xs text-slate-500">Selected: {selectedFile.name}</p>
              )}
            </fieldset>
            {publishError && <p role="alert" className="mt-3 text-sm text-red-600">{publishError}</p>}
            {publishMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{publishMessage}</p>}
          </form>

          <div className="space-y-5" aria-busy={loadingFeed}>
            {loadingFeed && <p role="status" className="p-5 text-center text-sm text-slate-500">Loading your feed…</p>}
            {feedError && (
              <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {feedError}
                <button type="button" disabled={loadingFeed || publishing} onClick={() => {
                  setLoadingFeed(true);
                  setFeedError("");
                  setRefreshKey((key) => key + 1);
                }} className="ml-3 font-bold underline disabled:opacity-50">Retry</button>
              </div>
            )}
            {!loadingFeed && !feedError && feed.length === 0 && (
              <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No posts or reels yet. Share the first one!</p>
            )}
            {feed.map((item) => (
              <article key={`${item.type}-${item._id}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                  <button type="button" disabled={!item.author?.username} onClick={() => navigate(`/profile/${item.author.username}`)} className="flex items-center gap-3 text-left">
                    {item.author?.profileImage ? (
                      <img src={item.author.profileImage} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <Avatar initials={getInitials(item.author?.name || item.author?.username)} tone="from-pink-500 to-rose-500" />
                    )}
                    <div>
                      <p className="text-sm font-bold">{item.author?.name || item.author?.username || "Unknown user"}</p>
                      <p className="text-xs text-slate-400">
                        {item.author?.username ? `@${item.author.username} · ` : ""}
                        {item.createdAt && <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>}
                      </p>
                    </div>
                  </button>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{item.type === "reel" ? "Reel" : "Post"}</span>
                </div>
                {item.type === "reel" && item.video && (
                  <video src={item.video} controls playsInline preload="metadata" aria-label={item.caption || "Reel"} className="max-h-[600px] w-full bg-black" />
                )}
                {item.type === "post" && item.image && (
                  <img src={item.image} alt={item.caption || "Post image"} loading="lazy" className="max-h-[600px] w-full object-contain bg-slate-50" />
                )}
                <p className="whitespace-pre-wrap break-words px-5 pb-5 pt-4 text-sm leading-6 text-slate-700">{item.caption}</p>
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
    </div>
  );
}

export default Home;
