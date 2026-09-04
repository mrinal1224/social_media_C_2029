# 02 — User Model & Social Media Data Design

**Commit:** `7e2efb90840dd353da06b422adbd9d6b8c2c4e54` — `user model`

## 1. Goal

The application now needs a persistent representation of a social-media user. The commit introduces a Mongoose schema and compiles it into a `User` model.

## 2. Schema vs Model

A **Schema** defines the shape and rules of a document.

A **Model** is the programmatic interface used to create, read, update, and delete documents that follow that schema.

```text
Schema → blueprint
Model  → object used to work with actual documents
```

The code starts with:

```js
import mongoose from "mongoose"
```

Then:

```js
const userSchema = new mongoose.Schema({...}, { timestamps: true })
```

and finally:

```js
const User = mongoose.model('User', userSchema)
```

## 3. User Fields

The schema contains:

```text
name          String, required
username      String, required, unique
email         String, required, unique
password      String, required
profileImage  String
followers     []
followings    []
posts         []
stories       []
reels         []
```

The important lesson is to understand that schema design is an application-design decision, not just syntax.

## 4. Required Fields

```js
name: {
    type: String,
    required: true
}
```

`required: true` tells Mongoose that a document should not pass validation without this field.

This is application-level validation. MongoDB itself is more flexible than a relational database schema.

## 5. Unique Fields

```js
username: {
    type: String,
    required: true,
    unique: true
}
```

and:

```js
email: {
    type: String,
    required: true,
    unique: true
}
```

These indicate that usernames and emails are intended to be unique.

### Important interview point

`unique: true` should not be treated as ordinary validation logic. It is used by MongoDB/Mongoose to create a unique index; duplicate writes can still surface as a database error. Controllers should still handle duplicate-key failures gracefully.

## 6. Password Field

```js
password: {
    type: String,
    required: true
}
```

At this stage the field exists but the project has not yet secured the password. The later bcrypt commit changes the value stored in this field from plaintext to a password hash.

This distinction is crucial:

```text
User input password
        ↓
 validation
        ↓
 bcrypt hashing
        ↓
 stored password hash
```

Never design authentication around storing plaintext passwords.

## 7. timestamps

```js
{ timestamps: true }
```

Mongoose automatically maintains timestamp fields such as:

```text
createdAt
updatedAt
```

This is useful for feeds, profile history, moderation, analytics, and debugging.

## 8. Social Graph Fields

The schema currently represents:

```js
followers: []
followings: []
```

Conceptually:

```text
Alice follows Bob

Alice.followings → Bob
Bob.followers    → Alice
```

Similarly, `posts`, `stories`, and `reels` are placeholders for relationships between a user and their content.

### Design discussion

As the application grows, arrays of raw values may become insufficient. A production model commonly uses ObjectId references or separate collections for content and relationships.

That leads to an important system-design question:

> Should all posts be embedded inside the User document, or should Post be a separate collection?

For large social-media systems, separate collections are generally more scalable because feeds and content can grow independently of a user's profile document.

## 9. Model Naming

```js
mongoose.model('User', userSchema)
```

The string `'User'` is the model name. Mongoose uses model/collection naming conventions internally.

Students should understand the difference between:

```text
User              → model in application code
user document     → one MongoDB document
users collection  → MongoDB collection
```

## 10. Current Data Flow

```text
POST /users/register
        ↓
controller
        ↓
User.create(...)
        ↓
Mongoose schema validation
        ↓
MongoDB document
```

The route/controller does not exist yet in this commit; the model is the foundation they will use.

## 11. Common Beginner Mistakes

### Mistake 1 — Storing plaintext passwords

The model permits a password string, but it does not mean the controller should save the user's raw password.

### Mistake 2 — Assuming unique means controller validation

Always handle database duplicate errors.

### Mistake 3 — Designing huge embedded arrays

A user's posts can grow indefinitely. Embedding everything directly into one user document can create size and update problems.

### Mistake 4 — Treating schema as database table definition

Mongoose Schema describes expected data at the application layer. MongoDB remains document-oriented.

## 12. Practice Questions

1. Explain the difference between a Mongoose Schema and Model.
2. Why are username and email marked `unique`?
3. What does `{ timestamps: true }` provide?
4. Why is storing posts inside User potentially problematic at scale?
5. Design a Post schema with `content`, `image`, `author`, `likes`, and `createdAt`.
6. Which fields should be indexed for fast login?

## 13. Commit Checkpoint

You should now be able to explain how a social-media user is represented in MongoDB and why schema design matters before writing authentication controllers.
