# 03 — Registration Controller & Validation

**Commit:** `1884bdeaf1f6cbd0dc34092bea74508b496594ce` — `register controller (checked)`

## 1. Goal

The project now turns the User model into a real API. The registration flow is split into a controller and a router instead of keeping everything inside `index.js`.

Final endpoint:

```text
POST /users/register
```

## 2. Why Controllers?

A route should answer:

> Which endpoint is this, and which function should handle it?

The controller should answer:

> What business logic should happen for this request?

So we get:

```text
Route
  ↓
Controller
  ↓
Model
  ↓
Database
```

The route file stays small:

```js
userRoutes.post('/register', resgiterUser)
```

while the controller contains validation and database logic.

## 3. Router Mounting

The application imports `userRoutes` and mounts it with:

```js
app.use('/users', userRoutes)
```

Inside the router:

```js
userRoutes.post('/register', resgiterUser)
```

Express combines them:

```text
/users + /register
      ↓
/users/register
```

This pattern becomes very important when the application grows into:

```text
/users
/posts
/comments
/messages
/notifications
```

## 4. Reading Request Data

The controller uses:

```js
const { name, email, password, username } = req.body
```

This works because the application registered:

```js
app.use(express.json())
```

Without the JSON middleware, JSON request bodies would not be available through `req.body` in the expected way.

## 5. Validation #1 — Required Fields

```js
if (!username || !email || !password || !name) {
    return res.status(400).json({ message: "All fields Required" })
}
```

This catches missing values before making unnecessary database calls.

### Why `return`?

The controller must stop after sending the error response.

Without `return`:

```js
if (!username) {
    res.status(400).json(...)
}

// execution could continue here
```

That can lead to multiple responses or unexpected database operations.

Think of `return res.status(...).json(...)` as:

```text
Send response
   ↓
Stop this controller
```

## 6. Validation #2 — Password Length

```js
if (password.length < 6) {
    return res.status(400).json({
        message: "Password Length should be greater than 6"
    })
}
```

This is a basic business rule.

Important distinction:

```text
Schema validation     → data shape/rules
Controller validation → request/business rules
```

In larger systems, validation is often moved into a dedicated validation library or middleware layer.

## 7. Validation #3 — Username Exists

```js
const userNameExists = await User.findOne({ username })

if (userNameExists) {
    return res.status(409).json({ message: "User Already Exists" })
}
```

`findOne()` searches MongoDB for a matching document.

The `409 Conflict` status communicates that the requested operation conflicts with existing server state.

## 8. Validation #4 — Email Exists

The exact same pattern is used for email:

```js
const emailExists = await User.findOne({ email })

if (emailExists) {
    return res.status(409).json({ message: "User Already Exists" })
}
```

This is an application-level check before creation.

### Race condition insight

Even after checking:

```text
findOne → not found
```

another request could create the same email before our create operation executes.

That is why the database-level unique index is still important. Application validation improves the user experience; database constraints protect correctness.

## 9. Creating the User

```js
const newUser = await User.create({
    name,
    username,
    email,
    password
})
```

Mongoose validates the object against the schema and inserts the document.

At this commit, the password is still being stored as supplied. The next commit fixes this security problem with bcrypt.

## 10. HTTP 201 — Created

The response uses:

```js
res.status(201).json({
    message: "User Resgitered",
    user: newUser
})
```

`201 Created` is appropriate for a successful resource-creation operation.

## 11. Error Handling

The controller wraps the entire operation in:

```js
try {
   // logic
} catch (error) {
   res.status(500).json({
      message: 'Internal Server Errorr',
      error: error
   })
}
```

The intent is correct: unexpected failures should not crash the request without a response.

### Improvement for production

Returning the raw `error` object can expose implementation details. A production API should normally log the detailed error server-side and return a safe client-facing message.

## 12. Complete Registration Flow

```text
POST /users/register
        ↓
express.json()
        ↓
resgiterUser()
        ↓
Read body
        ↓
Required fields?
        ↓ yes
Password length valid?
        ↓ yes
Username exists?
        ↓ no
Email exists?
        ↓ no
Create User
        ↓
201 response
```

## 13. Common Bugs to Watch

### Bug: forgetting `return`

Can cause code to continue after an error response.

### Bug: no JSON middleware

`req.body` may be unavailable.

### Bug: trusting only controller uniqueness checks

Use database uniqueness as the final authority.

### Bug: returning full user object after password is added

Once passwords are hashed, the API should still avoid exposing password hashes to clients. The response should ideally select safe fields.

### Bug: weak email validation

`email` being non-empty is not the same as being a valid email address.

## 14. Practice Questions

1. Why is controller logic separated from routing?
2. Why is `400` used for malformed/missing input and `409` for an already-existing identity?
3. Why are database unique indexes still needed when `findOne()` is already used?
4. What could happen if `return` is removed from the validation branches?
5. Improve registration to validate email format.
6. Modify the response so password is never returned to the client.
7. Add `confirmPassword` validation without storing `confirmPassword` in MongoDB.

## 15. Commit Checkpoint

At this point, the application has a real registration API with clear separation of route and controller responsibilities. The major missing piece is password security, which the next commit addresses.
