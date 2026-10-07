# 05 — Production Hardening, Debugging and Viva

## Environment variables

The backend commits `backend/.env.example` rather than requiring real secrets in source control.

Important runtime variables include database and JWT/Cloudinary configuration.

Production rule:

```text
real secrets → environment/secret manager
example names → .env.example
```

## Cookie hardening

Current cookie configuration:

```js
const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
};
```

The `secure: false` setting is suitable only for the current development configuration. HTTPS production should deliberately review `secure`, SameSite behavior and domain/topology requirements.

## CORS

Development:

```js
origin: 'http://localhost:5173',
credentials: true
```

Production should explicitly allow the actual frontend origin rather than using a broad wildcard when credentials are involved.

## Response sanitization

A already sanitizes register/login responses and profile responses with `.select('-password')` in the database query.

This is a strong improvement over returning the full User document.

Still keep the rule explicit:

```text
database document
 ↓
safe response shape
 ↓
browser
```

## Error handling

Some controllers return `err.message` in 500 responses. In production, detailed internal errors should normally remain server-side logs while clients receive stable public messages.

## Rate limiting

Good candidates include:

```text
/login
/register
/password reset
profile mutations
uploads
```

## Relationship consistency

Follow writes two User documents:

```text
actor.followings
target.followers
```

If one write fails, the graph can become asymmetric. A transaction or a dedicated Follow collection may be appropriate at larger scale.

## File-upload security

Current Multer filter checks:

```js
file.mimetype.startsWith('image/')
```

and limits uploads to 5 MB.

Production systems may additionally validate actual file signatures, decode/transform images and control storage permissions.

## Important architecture observation

A's frontend edit-profile handler currently updates local state only:

```js
setUserData((prev) => ({
    ...prev,
    ...editForm,
    profileImage: previewImage || prev.profileImage
}))
```

The backend has a real `/users/updateProfile` endpoint, Multer and Cloudinary integration, but the shown frontend does not currently call that endpoint.

Therefore the feature has two different states:

```text
backend persistence path → implemented
frontend wiring → still UI-local in current Profile.jsx
```

## Debugging checklist

### Login fails

```text
form state
 ↓
POST /users/login
 ↓
email normalization
 ↓
User.findOne
 ↓
bcrypt.compare
 ↓
JWT
 ↓
cookie
```

### Refresh logs user out

```text
cookie exists?
 ↓
withCredentials?
 ↓
cookieParser?
 ↓
JWT_SECRET?
 ↓
/users/me?
 ↓
AuthContext.setUser?
```

### Follow button fails

```text
target userData._id
 ↓
POST/DELETE route
 ↓
isAuthenticated
 ↓
actor = req.user._id
 ↓
target = req.params.id
 ↓
MongoDB writes
 ↓
refetch profile
```

### Image update fails

```text
selected file
 ↓
FormData
 ↓
field name profileImage
 ↓
Multer
 ↓
req.file.buffer
 ↓
Cloudinary env
 ↓
upload_stream
 ↓
secure_url
 ↓
MongoDB
```

## Viva bank

1. Explain the complete login lifecycle.
2. Why hash passwords?
3. Why normalize emails?
4. Why use a generic Invalid credentials message?
5. Why put JWT in an HttpOnly cookie?
6. What does JWT verification prove?
7. Why query MongoDB after verifying a JWT?
8. Why does AuthContext need loading?
9. Why is ProtectedRoute not API security?
10. What does useParams return?
11. What does populate do?
12. Why derive actor ID from req.user?
13. Why use $addToSet?
14. Why use $pull for unfollow?
15. Why use Multer memoryStorage?
16. Why is Cloudinary a separate utility?
17. What does `new: true` do in findByIdAndUpdate?
18. What does `runValidators: true` do?
19. Why should file size be limited?
20. Why should real secrets not be committed?

## Practical assignment

Complete the frontend integration for `/users/updateProfile`.

Required flow:

```text
Edit form
 ↓
FormData
 ↓
POST /users/updateProfile
 ↓
Auth middleware
 ↓
Multer
 ↓
Cloudinary if image exists
 ↓
MongoDB update
 ↓
sanitized user
 ↓
setUser + setUserData
```

Then implement a proper logout button using the existing AuthContext `logout()` function.