# 05 — Login Flow & Password Verification

**Commit:** `30d68d0ef44ac8f7a49926a7576062101ff07b6b` — `login controller`

## 1. Goal

Registration creates the account. Login proves that a person knows the password associated with an existing account.

New endpoint:

```text
POST /users/login
```

The commit adds `loginUser` to the controller and connects it through the router.

## 2. Why Login Is Different From Registration

Registration:

```text
Input identity + password
        ↓
validate
        ↓
hash password
        ↓
create user
```

Login:

```text
Input identity + password
        ↓
find existing user
        ↓
compare password with stored hash
        ↓
authenticate
```

We do not create a new password hash and compare strings manually. Bcrypt performs the correct verification against the stored hash.

## 3. Reading Login Input

```js
const { email, password } = req.body
```

A login request needs an identifier and a password.

Example request body:

```json
{
  "email": "alice@example.com",
  "password": "hello123"
}
```

## 4. Find the User

```js
const user = await User.findOne({ email })
```

This asks MongoDB/Mongoose for the account associated with that email.

If no document is found:

```js
if (!user) {
    return res.status(404).json({
        message: "User Not Found Please Register"
    })
}
```

The early `return` prevents later code from trying to access properties on `undefined`.

## 5. Password Verification

The key line is:

```js
const passwordCheck = await bcrypt.compare(password, user.password)
```

Inputs:

```text
password      → raw password typed during login
user.password → stored bcrypt hash
```

Output:

```text
true / false
```

The stored hash is not decrypted.

## 6. Wrong Password

```js
if (!passwordCheck) {
    return res.status(400).json({ message: "Wrong Password" })
}
```

Only after this check succeeds does the user count as authenticated.

## 7. Successful Response

The current implementation returns:

```js
res.status(200).json({ message: "User Logged IN" })
```

This confirms successful login but does not yet establish a usable authenticated session for future requests.

That missing piece is solved by JWT + cookie authentication in the next commit.

## 8. Important Architecture Observation

At this exact point, the application can answer:

> Is the submitted password correct?

But it still cannot answer this efficiently on later API requests:

> Is this request coming from a user who already logged in?

For that we need a credential that can travel with future requests. This is where a token enters the architecture.

## 9. Why We Do Not Store the Plain Password in a Session

The system should not create a session value containing the user's password.

Instead:

```text
Password
   ↓
Bcrypt verification
   ↓
Authentication succeeds
   ↓
Issue an authentication credential
```

The next stage uses a JWT stored in an HttpOnly cookie.

## 10. Error Handling

Like registration, login is wrapped in `try/catch`:

```js
try {
   // login logic
} catch (error) {
   res.status(500).json({
      message: 'Internal Server Errorr',
      error: error
   })
}
```

Unexpected database/bcrypt errors are caught so the request gets a response.

A production API should return a stable generic error message while logging detailed diagnostics server-side.

## 11. Security and API Design Discussion

The current API reveals whether a user exists by returning `404` for an unknown email and a different message for a bad password. That is easy to understand while teaching, but many production systems use a generic authentication error for both cases to reduce account-enumeration information leaks.

Another improvement is request validation before querying the database:

```text
email present?
password present?
email valid?
```

## 12. Common Beginner Mistakes

### Mistake 1 — Comparing raw password to hash

```js
password === user.password
```

Wrong.

### Mistake 2 — Hashing the login password with a new salt and comparing hash strings

Also wrong. Use `bcrypt.compare()`.

### Mistake 3 — Forgetting `return` after 404

The code must stop before `bcrypt.compare()`.

### Mistake 4 — Believing 200 login response automatically authenticates future requests

It does not. You still need a session mechanism or token.

## 13. Practice Questions

1. Why does login use `bcrypt.compare()` instead of `bcrypt.hash()`?
2. What exactly are the two arguments to `bcrypt.compare()`?
3. Why should the route return immediately when the user is not found?
4. Design a generic `Invalid credentials` response that does not reveal whether the email exists.
5. What needs to be added after a successful login so `/posts`, `/messages`, etc. can recognize the user later?
6. Why should login input be validated before performing database work?

## 14. Commit Checkpoint

At this stage you understand the difference between **credential verification** and **persistent authentication**. The next step turns a successful login/registration into a reusable authentication identity.
