# 02 — JWT, Auth Middleware, AuthContext and Protected Routes

## JWT generation

`backend/utils/generateToken.js` signs:

```js
jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
)
```

The token carries the user ID, is signed by `JWT_SECRET`, and expires after seven days.

## Authentication middleware

The middleware reads:

```js
const token = req.cookies.token;
```

Then:

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

Then it loads the current database user:

```js
const user = await User.findById(decoded.userId)
    .select('-password');
```

and exposes it to downstream handlers:

```js
req.user = user;
next();
```

The request pipeline is:

```text
cookie
 ↓
JWT verify
 ↓
userId
 ↓
MongoDB
 ↓
safe User document
 ↓
req.user
 ↓
controller
```

## Why fetch the user after verifying JWT?

JWT proves that the credential is valid. MongoDB gives the latest account state.

This matters if a user is deleted or their profile has changed after the token was created.

## `/users/me`

The protected route is:

```js
userRoutes.get('/me', isAuthenticated, getMe);
```

The controller returns `req.user` directly because the middleware already removed the password field:

```js
const user = await User.findById(decoded.userId).select('-password');
```

## AuthContext

Frontend state:

```js
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
```

On mount it calls:

```js
axiosInstance.get('/users/me')
```

Success:

```js
setUser(response.data);
```

Failure:

```js
setUser(null);
```

Finally:

```js
setLoading(false);
```

## Why loading is a real state

At startup:

```text
user = null
loading = true
```

does not yet mean guest.

It means:

```text
session status unknown
```

The route guard must wait until the `/users/me` check completes.

## Mounted flag

AuthContext uses:

```js
let mounted = true;
```

and cleanup:

```js
return () => {
    mounted = false;
};
```

This protects state updates if the asynchronous authentication check finishes after the provider has unmounted.

## Logout flow

A has a real logout implementation.

Context exposes:

```js
const logout = async () => {
    try {
        await axiosInstance.post('/users/logout');
    } finally {
        setUser(null);
    }
};
```

The backend clears the cookie:

```js
res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
});
```

So logout has two sides:

```text
browser/server credential cleared
           +
React user state cleared
```

## ProtectedRoute

```js
if (loading) {
    return <h1>Loading...</h1>;
}

if (!user) {
    return <Navigate to='/login' replace />;
}

return children;
```

## PublicRoute

PublicRoute performs the inverse UX rule: an authenticated user visiting login/signup is redirected to home.

## Frontend vs backend security

```text
ProtectedRoute
 → navigation/UI guard

isAuthenticated
 → backend security boundary
```

Never treat a React route guard as API authorization.

## Viva

1. Why does AuthContext need loading?
2. Why is `/users/me` necessary?
3. Why query MongoDB after JWT verification?
4. What does `req.user` contain?
5. Why is logout both a cookie operation and a React state operation?
6. Why is ProtectedRoute not enough to secure APIs?