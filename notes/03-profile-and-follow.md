# 03 — Profile, useParams and Follow/Unfollow

## Dynamic profile route

App defines:

```jsx
<Route
  path='/profile/:username'
  element={<ProtectedRoute><Profile /></ProtectedRoute>}
/>
```

For:

```text
/profile/alex
```

Profile reads:

```js
const { username } = useParams();
```

The username in the URL is the profile being viewed, not automatically the authenticated user.

## Profile fetch

The page requests:

```js
axiosInstance.get(`/users/profile/${username}`)
```

Backend:

```js
const { username } = req.params;

const userData = await User.findOne({ username })
    .select('-password')
    .populate('followers', 'name username profileImage')
    .populate('followings', 'name username profileImage');
```

## Why populate?

MongoDB stores ObjectId references. Populate converts references into selected display data.

```text
followers: [ObjectId, ObjectId]
        ↓ populate
followers: [{ name, username, profileImage }, ...]
```

This gives the frontend enough information to display follower/following lists without another request for every user.

## Own profile detection

```js
const isOwnProfile = loggedInUser?.username === username;
```

Therefore:

```text
own profile → Edit Profile
other profile → Follow / Unfollow
```

## Follow flow

Current frontend handler:

```js
if (isFollowing) {
    await axiosInstance.delete(`/users/${userData._id}/follow`);
} else {
    await axiosInstance.post(`/users/${userData._id}/follow`);
}
```

Backend routes:

```js
userRoutes.post('/:id/follow', isAuthenticated, followUser);
userRoutes.delete('/:id/follow', isAuthenticated, unfollowUser);
```

## Actor and target

Backend derives actor from authentication:

```js
const currentUserId = req.user._id;
const targetUserId = req.params.id;
```

This is important: the client chooses the target, but the server derives the actor from the authenticated cookie.

## Self-follow protection

```js
if (currentUserId.toString() === targetUserId.toString()) {
    return res.status(409).json({
        message: 'You cannot follow yourself'
    });
}
```

## Duplicate follow protection

```js
const alreadyFollowing = targetUser.followers.some(
    (id) => id.toString() === currentUserId.toString()
);
```

Then:

```js
if (alreadyFollowing) {
    return res.status(409).json({
        message: 'You are already following this user'
    });
}
```

## MongoDB updates

Follow:

```js
await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { followings: targetUserId }
});

await User.findByIdAndUpdate(targetUserId, {
    $addToSet: { followers: currentUserId }
});
```

Unfollow uses `$pull` on the same two arrays.

## Why `$addToSet`?

A follow relationship behaves like a set.

```text
[B, C] + C using $addToSet
→ [B, C]
```

With `$push`, duplicate references could appear.

## Frontend state machine

```text
NOT FOLLOWING
   ↓ click
ACTION LOADING
   ↓ success
FOLLOWING
   ↓ click
ACTION LOADING
   ↓ success
NOT FOLLOWING
```

`actionLoading` prevents overlapping mutation requests.

## Refetch strategy

After follow/unfollow the Profile page calls `fetchProfile()` again. The server remains the source of truth for follower/following state.

## Consistency discussion

One follow operation updates two User documents. If one update succeeds and another fails, the relationship can become inconsistent. A production design can use a transaction or a dedicated Follow collection.

## Debugging

```text
useParams username
 ↓
profile GET
 ↓
req.params.username
 ↓
MongoDB

follow button
 ↓
POST/DELETE /users/:id/follow
 ↓
isAuthenticated
 ↓
actor + target
 ↓
MongoDB updates
 ↓
refetch
 ↓
React state
```

## Viva

1. Why is the URL username different from req.user?
2. What does populate do?
3. Why does actor ID come from req.user?
4. Why `$addToSet`?
5. Why are two User documents updated for one follow?