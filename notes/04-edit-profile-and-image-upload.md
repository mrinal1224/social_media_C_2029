# 04 — Edit Profile, FormData, Multer and Cloudinary

## Why this feature is more advanced

Profile editing combines:

```text
React controlled form
+
optional binary file
+
multipart/form-data
+
Multer
+
Cloudinary
+
MongoDB update
```

## Current backend route

```js
userRoutes.post(
    '/updateProfile',
    isAuthenticated,
    upload.single('profileImage'),
    updateProfile
);
```

The order is meaningful:

```text
authentication
 ↓
multipart parsing
 ↓
profile controller
```

## Profile controller

The controller derives the user from authentication:

```js
const userId = req.user._id;
```

Then reads text fields:

```js
const { name, username, email, bio } = req.body;
```

Required fields:

```js
if (!name?.trim() || !username?.trim() || !email?.trim()) {
    return res.status(400).json({
        message: 'Name, username and email are required'
    });
}
```

## Normalization

Username:

```js
const cleanUsername = username.trim();
```

Email:

```js
const normalizedEmail = email.trim().toLowerCase();
```

This prevents accidental whitespace and email casing inconsistencies.

## Uniqueness during update

Username check excludes the current user:

```js
User.findOne({
    username: cleanUsername,
    _id: { $ne: userId }
})
```

That means the user can keep their own username without receiving a duplicate error.

The same pattern is used for email.

## Update object

```js
const updates = {
    name: name.trim(),
    username: cleanUsername,
    email: normalizedEmail,
    bio: bio?.trim() || ''
};
```

## Optional image upload

If an image exists:

```js
if (req.file) {
    const uploadedImage = await uploadToCloudinary(req.file.buffer);
    updates.profileImage = uploadedImage.secure_url;
}
```

This creates an important two-stage storage flow:

```text
browser file
 ↓
Multer memory buffer
 ↓
Cloudinary
 ↓
secure_url
 ↓
MongoDB profileImage
```

MongoDB stores the URL/reference, not the binary image.

## Multer

The middleware uses:

```js
const storage = multer.memoryStorage();
```

and:

```js
if (file.mimetype.startsWith('image/')) {
    cb(null, true)
}
```

with a 5 MB limit:

```js
fileSize: 5 * 1024 * 1024
```

## Why memoryStorage?

The file must reach Cloudinary as a buffer. Memory storage provides that buffer directly through `req.file.buffer`.

Trade-off:

```text
large/concurrent uploads
        ↓
RAM pressure
```

The size limit is therefore an important safety boundary.

## Cloudinary configuration

`cloudinary.js` validates:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Then configures Cloudinary using those environment variables.

## Upload utility

`uploadToCloudinary.js` uses `upload_stream`:

```js
const uploadStream = cloudinary.uploader.upload_stream(
    {
        folder: 'social-media/profile-images',
        resource_type: 'image'
    },
    callback
);

uploadStream.end(buffer);
```

This is a clean separation:

```text
controller → upload utility → Cloudinary
```

## MongoDB update

```js
const updatedUser = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
).select('-password');
```

`new: true` returns the updated document. `runValidators: true` asks Mongoose to apply schema validators during the update.

## Current frontend boundary

The current Profile page contains an edit modal and local image preview, but its `handleEditSubmit` only changes local state. It does not currently submit FormData to `/users/updateProfile`.

So the repository contains a real backend implementation while the shown frontend path still has a UI-only save flow.

This distinction is important:

```text
backend endpoint exists
≠
frontend has wired it
```

## Viva

1. Why FormData instead of JSON?
2. Why memoryStorage?
3. Why Cloudinary?
4. Why store secure_url in MongoDB?
5. Why use `$ne` while checking username uniqueness?
6. What does `new: true` do?
7. What does `runValidators: true` do?