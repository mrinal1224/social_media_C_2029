# 06 — JWT, Cookies & Authentication Middleware

**Commit:** `02832e2f4794dc9b24b1052ac7fe264043a81e91` — `Push Authentication Server`

## 1. Goal

This is the biggest authentication milestone in the current repository. The project moves from simply verifying credentials to maintaining an authenticated identity across subsequent HTTP requests.

The commit introduces:

- JWT generation;
- an HttpOnly cookie containing the token;
- `cookie-parser` middleware;
- authentication middleware that reads and verifies the token;
- retrieval of the user from MongoDB;
- a controller that can return the authenticated user.

## 2. Why JWT?

After login, the server needs some way to recognize the user on later requests.

A simplified flow is:

```text
Request 1: Login
email + password
      ↓
verify password
      ↓
create identity token
      ↓
store/send token

Request 2: GET protected resource
      ↓
server reads token
      ↓
server verifies token
      ↓
server identifies user
      ↓
protected route executes
```

JWT is one way to represent that authenticated identity.

## 3. Token Generation Utility

The project adds:

```js
import jwt from 'jsonwebtoken'

export const genToken = (userId) => {
    const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "10d" }
    )
    return token
}
```

There are three important pieces:

```text
Payload  → { userId }
Secret   → process.env.JWT_SECRET
Expiry   → 10 days
```

### Payload

The payload contains the user identifier required to load the user's account later.

### Secret

The signing secret lets the server create and verify tokens.

It must never be hardcoded or exposed to clients.

### Expiry

The token is configured to expire after ten days. This limits the lifetime of a stolen token.

The right lifetime depends on the application's threat model and UX requirements.

## 4. JWT Mental Model

A JWT is conventionally represented as:

```text
header.payload.signature
```

The payload can be decoded by a client, so never put secrets or passwords inside it.

The signature is what lets the server detect that the signed token has been modified.

For this application the conceptual payload is:

```json
{
  "userId": "...",
  "iat": "...",
  "exp": "..."
}
```

The exact additional fields are handled by the JWT library.

## 5. Creating the Token After Registration

Once the user is created:

```js
const token = genToken(newUser._id)
```

The database's `_id` becomes the identity referenced by the token.

The important relationship is:

```text
JWT.userId
    ↓
User._id
```

The token does not contain the complete user document. The server uses the identifier to fetch the current user.

## 6. Cookie-Based Storage

The application uses:

```js
const cookiesOptions = {
    httpOnly: true,
    secure: true
}
```

and:

```js
res.cookie("token", token, cookiesOptions)
```

### `httpOnly`

An HttpOnly cookie cannot be read directly through normal client-side JavaScript APIs such as `document.cookie`.

This substantially reduces the ability of injected browser scripts to directly steal the cookie value.

### `secure`

A secure cookie is sent only over HTTPS.

### Development warning

When developing on plain `http://localhost`, `secure: true` can prevent the browser from sending the cookie because the request is not HTTPS. Cookie options often need an environment-aware configuration in local development versus production.

## 7. Why Cookies Instead of localStorage?

This project intentionally demonstrates cookie-based authentication.

With localStorage:

```text
JavaScript can read token
```

With an HttpOnly cookie:

```text
browser stores token
JavaScript cannot directly read token
browser can automatically attach cookie
```

This can reduce exposure to token theft through certain XSS scenarios. It does not make an application immune to XSS or CSRF; cookie authentication requires correct CSRF and other browser security considerations.

## 8. cookie-parser Middleware

The app adds:

```js
import cookieParser from 'cookie-parser'
```

and registers:

```js
app.use(cookieParser())
```

Now a request's cookies can be accessed as:

```js
req.cookies
```

The authentication middleware uses:

```js
const token = req.cookies.token
```

## 9. Authentication Middleware

The new middleware follows this idea:

```js
export const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        res.status(401).json({ message: "Not Authorized" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId)

    if (!user) {
        res.status(404).json({
            message: "User Not Found Token Invalid"
        })
    }

    req.user = user
    next()
}
```

The role of middleware is critical:

```text
Incoming request
      ↓
Read cookie
      ↓
Verify JWT
      ↓
Find User
      ↓
Attach user to req
      ↓
next()
      ↓
Controller
```

## 10. Why `req.user`?

The middleware adds:

```js
req.user = user
```

This is a very useful Express pattern.

Instead of every protected controller repeating:

```js
read cookie
verify token
find user
```

the authentication layer performs it once.

Then any protected controller can simply use:

```js
req.user
```

This is separation of concerns.

## 11. `next()`

In Express middleware:

```js
next()
```

means:

> Authentication succeeded; continue processing the request.

So:

```text
middleware
   ↓
next()
   ↓
next middleware / route handler
```

Without calling `next()`, the request can remain stuck unless the middleware sends a response.

## 12. Protected User Controller

The controller includes:

```js
export const getUser = async (req, res) => {
    res.status(200).json({
        message: "User Authenticated",
        userData: req.user
    })
}
```

This demonstrates the payoff of the middleware architecture.

The controller does not need to understand JWT internals. It receives an authenticated user from the middleware.

## 13. Full Authentication Flow

### Registration

```text
POST /users/register
        ↓
validate data
        ↓
check existing user
        ↓
hash password with bcrypt
        ↓
create user
        ↓
generate JWT using newUser._id
        ↓
set HttpOnly cookie
        ↓
201 Created
```

### Login — current implementation note

The current login controller verifies the password and returns a success response, but this commit's token/cookie code is added to the registration path. For a fully persistent login flow, login should also issue the JWT and set the same authentication cookie after successful password verification.

That distinction is important for students to notice rather than assuming the authentication flow is already complete.

### Protected Request

```text
GET /users/me
        ↓
cookie-parser
        ↓
isAuthenticated
        ↓
req.cookies.token
        ↓
jwt.verify(...)
        ↓
User.findById(decoded.userId)
        ↓
req.user = user
        ↓
next()
        ↓
getUser controller
```

## 14. Important Bugs in the Current Middleware

The current middleware contains a teaching-worthy bug:

```js
if (!token) {
    res.status(401).json({message:"Not Authorized"})
}
```

There is no `return`.

Execution can continue to:

```js
jwt.verify(token, process.env.JWT_SECRET)
```

even though `token` is missing.

### Safer pattern

```js
if (!token) {
    return res.status(401).json({ message: "Not Authorized" })
}
```

The same issue exists after the user lookup:

```js
if (!user) {
    return res.status(404).json({
        message: "User Not Found Token Invalid"
    })
}
```

## 15. JWT Verification Errors

The code calls:

```js
jwt.verify(token, process.env.JWT_SECRET)
```

but does not explicitly catch errors from an invalid or expired JWT inside the middleware.

For example, a malformed/expired token can cause `jwt.verify()` to throw.

The stronger pattern is:

```js
try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // continue
} catch (error) {
    return res.status(401).json({
        message: "Invalid or expired token"
    })
}
```

This is an important real-world authentication lesson.

## 16. Another Security Improvement — Do Not Return Password Hashes

The current `getUser` response sends `req.user` directly:

```js
userData: req.user
```

Since the user document contains the password hash, the response may expose it.

The client does not need the password hash.

Better patterns include selecting safe fields or explicitly projecting the document before returning it.

Conceptually:

```text
Database User
   ├── name       ✅
   ├── username   ✅
   ├── email      ✅
   ├── profile    ✅
   └── password   ❌ never return
```

## 17. Cookie Configuration Improvements

A production cookie configuration often considers:

```text
httpOnly
secure
sameSite
path
maxAge / expires
```

The correct `sameSite` policy depends on how the frontend and backend are deployed.

For local development, `secure` may need to depend on the environment.

## 18. CSRF Consideration

An HttpOnly cookie protects JavaScript from directly reading the token, but browsers automatically attach cookies to matching requests.

Therefore, cookie-based authentication must be designed with CSRF in mind, especially when cross-site requests are possible.

This is why `SameSite`, CSRF tokens, origin checks, and careful CORS configuration matter.

## 19. Why JWT Does Not Equal “Authentication Is Solved”

JWT solves token representation and verification. It does not automatically solve:

```text
password security
CSRF
XSS
token theft
logout semantics
refresh tokens
revocation
authorization
rate limiting
account lockout
```

Authentication is a complete system, not a single library call.

## 20. Practice Questions

1. What information is stored in the JWT payload in this project?
2. Why is the JWT secret stored in an environment variable?
3. What does `jwt.verify()` actually guarantee?
4. Why is an HttpOnly cookie useful against some XSS-driven token theft?
5. Why does HttpOnly not completely eliminate authentication security risks?
6. Fix the missing `return` after the 401 response.
7. Wrap `jwt.verify()` in proper error handling.
8. Modify login so successful authentication also creates and sets the JWT cookie.
9. Modify `getUser` so the password hash is never returned.
10. Explain the job of `next()` in the middleware chain.

## 21. Commit Checkpoint

You should now understand the complete architecture introduced by the current repository history:

```text
bcrypt
  ↓
verify credentials
  ↓
JWT
  ↓
HttpOnly cookie
  ↓
cookie-parser
  ↓
auth middleware
  ↓
JWT verification
  ↓
load user
  ↓
req.user
  ↓
protected controller
```

This is the foundation for protected posts, likes, follows, comments, stories, messaging, and every other feature that requires an authenticated user.
