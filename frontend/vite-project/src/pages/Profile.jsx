import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axiosInstance from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import { fetchPostsByUsername, selectPostsByUsername, updatePostLike } from '../redux/postsSlice'
import { fetchReelsByUsername, selectReelsByUsername } from '../redux/reelsSlice'
import { fetchProfileByUsername, removeProfileKey, selectProfileByUsername, upsertProfile } from '../redux/profilesSlice'

function Profile() {
    const { username } = useParams()
    const navigate = useNavigate()
    const { user: loggedInUser, setUser } = useAuth()

    // REDUX STEP 9: PROFILE READS THE SAME STORE AS HOME
    //
    // Profile no longer owns a second independent "profilePosts" array.
    // Both Home and Profile now read Post entities from state.posts.items.
    const dispatch = useDispatch()
    const userData = useSelector((state) => selectProfileByUsername(state, username))
    const loading = useSelector((state) => state.profiles.loadingByUsername[username] ?? true)
    const profilePosts = useSelector((state) => selectPostsByUsername(state, username))
    const postsLoading = useSelector((state) => state.posts.loading)
    const postsError = useSelector((state) => state.posts.error)
    const profileReels = useSelector((state) => selectReelsByUsername(state, username))
    const reelsLoading = useSelector((state) => state.reels.loading)
    const reelsError = useSelector((state) => state.reels.error)

    const [isFollowing, setIsFollowing] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editForm, setEditForm] = useState({ name: '', username: '', email: '', bio: '' })
    const [selectedImage, setSelectedImage] = useState(null)
    const [previewImage, setPreviewImage] = useState('')
    const [editError, setEditError] = useState('')
    const [editLoading, setEditLoading] = useState(false)
    const [likeLoading, setLikeLoading] = useState({})
    const [activeContentTab, setActiveContentTab] = useState('posts')
    const fileInputRef = useRef(null)

    const isOwnProfile = loggedInUser?.username === username

    // Every route hydrates the same Redux store. A hard refresh therefore
    // rebuilds exactly the server state this profile needs.
    useEffect(() => {
        dispatch(fetchProfileByUsername(username))
        dispatch(fetchPostsByUsername(username))
        dispatch(fetchReelsByUsername(username))
    }, [username, dispatch])

    useEffect(() => {
        if (!userData || isOwnProfile) {
            setIsFollowing(false)
            return
        }

        const followingIds = loggedInUser?.followings || []
        setIsFollowing(
            followingIds.some((item) => (item?._id || item)?.toString() === userData._id?.toString())
        )
    }, [userData, isOwnProfile, loggedInUser])

    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage)
            }
        }
    }, [previewImage])

    const handleProfilePostLike = async (postId) => {
        if (likeLoading[postId]) return

        try {
            setLikeLoading((prev) => ({ ...prev, [postId]: true }))

            const response = await axiosInstance.patch(`/posts/${postId}/like`)

            // REDUX STEP 11: ONE LIKE ACTION, ONE SHARED STATE UPDATE
            //
            // We no longer call setProfilePosts(...).
            // Updating Redux means Home and Profile observe the same Post state.
            dispatch(
                updatePostLike({
                    postId,
                    userId: loggedInUser?._id,
                    liked: response.data.liked
                })
            )
        } catch (error) {
            console.error("Profile post like failed:", error)
        } finally {
            setLikeLoading((prev) => ({ ...prev, [postId]: false }))
        }
    }

    const handleFollowToggle = async () => {
        try {
            setActionLoading(true)

            if (isFollowing) {
                await axiosInstance.delete(`/users/${userData._id}/follow`)
            } else {
                await axiosInstance.post(`/users/${userData._id}/follow`)
            }

            setIsFollowing((prev) => !prev)
            dispatch(fetchProfileByUsername(username))
        } catch (error) {
            console.error("Follow action failed:", error)
            alert(error.response?.data?.message || "Something went wrong")
        } finally {
            setActionLoading(false)
        }
    }

    const openEditProfile = () => {
        setEditForm({
            name: userData?.name || '',
            username: userData?.username || '',
            email: userData?.email || '',
            bio: userData?.bio || ''
        })
        setSelectedImage(null)
        setPreviewImage('')
        setEditError('')
        setIsEditOpen(true)
    }

    const closeEditProfile = () => {
        if (editLoading) return
        setIsEditOpen(false)
        setSelectedImage(null)
        setEditError('')
        setPreviewImage('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleEditChange = (event) => {
        const { name, value } = event.target
        setEditForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleImageChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setEditError('Please select a valid image file.')
            event.target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setEditError('Profile image must be 5MB or smaller.')
            event.target.value = ''
            return
        }

        setEditError('')

        setSelectedImage(file)

        if (previewImage) {
            URL.revokeObjectURL(previewImage)
        }

        const previewUrl = URL.createObjectURL(file)
        setPreviewImage(previewUrl)
    }

    const handleEditSubmit = async (event) => {
        event.preventDefault()
        setEditError('')

        if (!editForm.name.trim() || !editForm.username.trim() || !editForm.email.trim()) {
            setEditError('Name, username and email are required.')
            return
        }

        try {
            setEditLoading(true)

            const formData = new FormData()
            formData.append('name', editForm.name.trim())
            formData.append('username', editForm.username.trim())
            formData.append('email', editForm.email.trim())
            formData.append('bio', editForm.bio.trim())

            if (selectedImage) {
                formData.append('profileImage', selectedImage)
            }

            const response = await axiosInstance.put('/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            const updatedUser = response.data.user

            dispatch(upsertProfile(updatedUser))
            setUser({
                ...loggedInUser,
                ...updatedUser
            })

            const usernameChanged = updatedUser.username !== username

            closeEditProfile()

            if (usernameChanged) {
                dispatch(removeProfileKey(username))
                navigate(`/profile/${updatedUser.username}`, { replace: true })
            }
        } catch (error) {
            console.error('Profile update failed:', error)
            setEditError(
                error.response?.data?.message || 'Unable to update profile. Please try again.'
            )
        } finally {
            setEditLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!userData) {
        return (
            <div className="text-center py-10 text-gray-500">
                User profile not found.
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-6 py-8 sm:px-10 sm:py-10">
                    <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-100/70 blur-3xl"></div>
                    <div className="absolute -bottom-20 left-24 h-44 w-44 rounded-full bg-violet-100/60 blur-3xl"></div>

                    <div className="relative flex flex-col items-center gap-7 sm:flex-row sm:items-start">
                <img
                    src={userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366f1&color=fff`}
                    alt={userData.name || 'Profile'}
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg ring-1 ring-slate-200"
                />

                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{userData.name}</h1>
                                    <p className="mt-1 text-sm font-semibold text-indigo-600">@{userData.username}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-500">{userData.email}</p>

                    {isOwnProfile ? (
                        <button
                            onClick={openEditProfile}
                            className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <button
                            onClick={handleFollowToggle}
                            disabled={actionLoading}
                            className="mt-5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {actionLoading ? 'Please wait...' : isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6 sm:px-10">
                    <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-center">
                        <div className="px-4 py-4">
                            <span className="block text-xl font-black text-slate-900">
                                {profilePosts.length}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posts</span>
                        </div>
                        <div className="border-x border-slate-200 px-4 py-4">
                            <span className="block text-xl font-black text-slate-900">
                                {userData.followers?.length || 0}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Followers</span>
                        </div>
                        <div className="px-4 py-4">
                            <span className="block text-xl font-black text-slate-900">
                                {userData.followings?.length || 0}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Following</span>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">About</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                            {userData.bio || "No bio available yet."}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-around items-center pt-4 border-t border-gray-100 text-center hidden">
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">
                        {userData.posts?.length ?? userData.postsCount ?? 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Posts</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">
                        {userData.followers?.length || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Followers</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">
                        {userData.followings?.length || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Following</span>
                </div>
            </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                            <h3 className="mb-3 text-sm font-bold text-slate-800">Followers</h3>
                    {userData.followers?.length === 0 ? (
                        <p className="text-sm text-gray-500">No followers yet.</p>
                    ) : (
                        userData.followers?.map((user) => (
                            <div key={user._id} className="py-2 border-b last:border-b-0">
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                        ))
                    )}
                </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                            <h3 className="mb-3 text-sm font-bold text-slate-800">Following</h3>
                    {userData.followings?.length === 0 ? (
                        <p className="text-sm text-gray-500">Not following anyone yet.</p>
                    ) : (
                        userData.followings?.map((user) => (
                            <div key={user._id} className="py-2 border-b last:border-b-0">
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <div className="mx-auto mb-6 flex max-w-md rounded-2xl bg-slate-100 p-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveContentTab('posts')}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            activeContentTab === 'posts'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Posts
                        <span className="ml-2 text-xs text-gray-400">{profilePosts.length}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveContentTab('reels')}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            activeContentTab === 'reels'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Reels
                        <span className="ml-2 text-xs text-gray-400">{profileReels.length}</span>
                    </button>
                </div>

                {activeContentTab === 'posts' ? (
                    postsLoading ? (
                        <p className="py-8 text-center text-sm text-gray-500">Loading posts...</p>
                    ) : postsError ? (
                        <p className="py-8 text-center text-sm text-red-500">{postsError}</p>
                    ) : profilePosts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                            <p className="text-sm font-semibold text-gray-700">No posts yet</p>
                            <p className="mt-1 text-xs text-gray-400">Posts created by this user will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {profilePosts.map((post) => {
                                const likedByMe = (post.likes || []).some(
                                    (id) => (id?._id || id)?.toString() === loggedInUser?._id?.toString()
                                )

                                return (
                                    <article
                                        key={post._id}
                                        className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                                    >
                                        {post.image ? (
                                            <img
                                                src={post.image}
                                                alt={post.caption || 'Post'}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-medium text-gray-500">
                                                {post.caption || 'Post'}
                                            </div>
                                        )}

                                        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => handleProfilePostLike(post._id)}
                                                disabled={likeLoading[post._id]}
                                                className="rounded-full bg-white/95 px-3 py-2 text-sm font-bold text-gray-900 shadow disabled:opacity-60"
                                            >
                                                {likedByMe ? '♥' : '♡'} {post.likes?.length || 0}
                                            </button>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )
                ) : (
                    reelsLoading ? (
                        <p className="py-8 text-center text-sm text-gray-500">Loading reels...</p>
                    ) : reelsError ? (
                        <p className="py-8 text-center text-sm text-red-500">{reelsError}</p>
                    ) : profileReels.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                            <p className="text-sm font-semibold text-gray-700">No reels yet</p>
                            <p className="mt-1 text-xs text-gray-400">Reels created by this user will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {profileReels.map((reel) => (
                                <article
                                    key={reel._id}
                                    className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-slate-200"
                                >
                                    <video
                                        src={reel.video}
                                        controls
                                        preload="metadata"
                                        className="h-full w-full object-cover"
                                    />

                                    {reel.caption && (
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                                            <p className="line-clamp-2 text-xs font-medium text-white">
                                                {reel.caption}
                                            </p>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )
                )}
            </div>

                    {isOwnProfile && isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                                <p className="text-sm text-gray-500 mt-1">Update your profile details.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditProfile}
                                disabled={editLoading}
                                className="text-gray-400 hover:text-gray-700 text-2xl leading-none disabled:opacity-50"
                                aria-label="Close edit profile"
                            >
                                &times;
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                {editError}
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={previewImage || userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name || 'User')}&background=6366f1&color=fff`}
                                        alt="Profile preview"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100"
                                    />
                                    <div>
                                        <label className="inline-flex cursor-pointer items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                                            Choose Image
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {selectedImage && (
                                            <p className="mt-2 max-w-xs truncate text-xs text-gray-500">
                                                {selectedImage.name}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-400">PNG, JPG or other image up to 5MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={editForm.username}
                                    onChange={handleEditChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={editForm.bio}
                                    onChange={handleEditChange}
                                    rows="4"
                                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditProfile}
                                    disabled={editLoading}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
