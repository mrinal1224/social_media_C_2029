# 04 — Password Hashing with bcrypt

**Commit:** `1a20ef11e7a2933f3da781243b3526b202eeaaca` — `hashed password register`

## 1. The Security Problem

The previous registration implementation accepted:

```text
password = user's actual password
```

and stored it directly in the database.

That is unsafe. If the database is compromised, attackers could immediately obtain users' real passwords.

The commit replaces plaintext storage with a bcrypt hash.

## 2. Installing bcrypt

The dependency added is:

```json
"bcrypt": "^6.0.0"
```

Then it is imported:

```js
import bcrypt from 'bcrypt'
```

## 3. Hashing Flow

The controller now does:

```js
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)
```

Then stores:

```js
password: hashedPassword
```

So the flow becomes:

```text
Plain password
      ↓
Generate salt
      ↓
bcrypt hash
      ↓
Store hash
```

## 4. What Is a Salt?

A salt is additional random data incorporated into password hashing.

Conceptually:

```text
password + random salt
           ↓
        bcrypt
           ↓
       password hash
```

This means two users with the same password should not end up with the same bcrypt hash when different salts are used.

## 5. Why Not Just Hash with SHA-256?

Password hashing and ordinary hashing solve different problems.

General-purpose hashes such as SHA-256 are designed to be extremely fast. That is useful for integrity checks but undesirable for passwords because attackers can try enormous numbers of guesses quickly.

bcrypt is intentionally designed to be computationally expensive and configurable through its cost factor.

## 6. Understanding `genSalt(10)`

```js
bcrypt.genSalt(10)
```

The cost factor controls how much work bcrypt performs.

Higher cost → more computation → slower hashing and verification.

The correct value depends on the environment and security/performance requirements. Do not treat `10` as a magical universal number; benchmark appropriate settings for the application.

## 7. Why `await`?

bcrypt's APIs are asynchronous in this implementation.

```js
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)
```

The route waits for the operation to finish before writing the user.

This is preferable to blocking the entire Node.js process with a synchronous CPU-heavy operation.

## 8. Never Log Secrets

The commit removes the temporary debug logging of the salt/hash from the previous version.

That is important because:

```text
password hash
salt
JWT
cookie value
API credentials
```

should not be casually printed to production logs.

A hash is not the same as the plaintext password, but it is still sensitive authentication data.

## 9. Hash vs Encryption

A common interview question:

> Why don't we encrypt passwords and decrypt them during login?

Because the server does not need the original password.

We only need to answer:

```text
Does the submitted password match the stored password?
```

This is exactly what password hashing is designed for.

```text
Register:
password → hash → database

Login:
password + stored hash → compare → true/false
```

## 10. The Important Bcrypt API Pair

Register:

```js
bcrypt.hash(password, salt)
```

Login:

```js
bcrypt.compare(password, user.password)
```

The application does **not** reverse the hash.

## 11. Potential Improvement

The controller currently generates a salt explicitly:

```js
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)
```

bcrypt also supports hashing with a cost factor directly. Both approaches can be valid. Explicit salt generation is pedagogically useful because it makes the salt concept visible.

## 12. Data Before vs After

### Before

```json
{
  "email": "alice@example.com",
  "password": "hello123"
}
```

### After

```json
{
  "email": "alice@example.com",
  "password": "$2b$..."
}
```

The actual hash is intentionally omitted from these notes.

## 13. Common Beginner Mistakes

### Mistake 1 — Hashing twice during registration

Do not repeatedly hash an already-hashed password unless your design explicitly requires it.

### Mistake 2 — Comparing plaintext with the hash directly

Wrong:

```js
password === user.password
```

Correct:

```js
await bcrypt.compare(password, user.password)
```

### Mistake 3 — Storing the salt separately without understanding bcrypt

bcrypt hashes encode the salt and cost information as part of the stored bcrypt string.

### Mistake 4 — Returning the hash

Never send the password hash to clients unnecessarily.

## 14. Practice Questions

1. Why is bcrypt better suited for passwords than SHA-256?
2. What does a salt protect against?
3. Why should two identical passwords produce different bcrypt strings in normal usage?
4. Why don't we decrypt a bcrypt password hash during login?
5. What is the role of the cost factor?
6. Rewrite registration so the hash is generated with bcrypt's cost parameter directly.

## 15. Commit Checkpoint

You should now be able to explain password hashing from first principles and describe exactly where bcrypt belongs in a registration flow.
