# 01 — User Model, Registration and Login

## User model

Core fields in `backend/models/user.model.js`:

```js
name
username
email
password
phone
bio
followers
followings
posts
stories
reels
profileImage
```

The schema enables timestamps:

```js
{ timestamps: true }
```

so MongoDB documents receive `createdAt` and `updatedAt`.

## Why normalize email?

Registration does:

```js
const normalizedEmail = email.trim().toLowerCase();
```

Login performs the same normalization before querying.

This avoids treating:

```text
MRINAL@EXAMPLE.COM
mrinal@example.com
```

as two different application-level identities.

## Registration flow

Frontend sends:

```js
await axiosInstance.post('/users/register', form)
```

Backend validation:

```js
if (!username || !name || !password || !email) {
    return res.status(400).json({
        message: 'All fields are required'
    });
}
```

Password rule:

```js
if (password.length < 6) {
    return res.status(400).json({
        message: 'Password must be at least 6 characters'
    });
}
```

Duplicate checks protect username and normalized email.

## Password hashing

The implementation uses:

```js
const hashedPassword = await bcrypt.hash(password, 10);
```

Then:

```js
const newUser = await User.create({
    username,
    name,
    password: hashedPassword,
    email: normalizedEmail
});
```

## Token and cookie

Registration immediately creates a JWT:

```js
const token = generateToken(newUser._id);
res.cookie('token', token, cookieOptions);
```

Current cookie configuration:

```js
const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
};
```

That means the browser receives an HttpOnly cookie valid for seven days in the current development configuration.

## Important improvement: safe API response

Unlike B/C, A already returns a deliberately selected user object during registration:

```js
user: {
    _id: newUser._id,
    name: newUser.name,
    username: newUser.username,
    email: newUser.email
}
```

The password hash is not returned.

Login follows the same safe shape.

## Login flow

```text
email + password
 ↓
normalize email
 ↓
find User
 ↓
bcrypt.compare
 ↓
generate JWT
 ↓
set cookie
 ↓
safe user response
 ↓
AuthContext.setUser
```

Login intentionally uses one generic message:

```text
Invalid credentials
```

for both missing user and wrong password. That avoids leaking whether a particular email exists.

## Debugging

Registration bugs:

```text
form state → request → validation → duplicate check → hash → User.create
```

Login bugs:

```text
email normalization → findOne → compare → JWT → cookie → response
```

## Viva

1. Why normalize email?
2. Why return `Invalid credentials` for both cases?
3. Why should the password hash not be returned?
4. Why does registration immediately create the JWT?
5. What is the purpose of `sameSite`?