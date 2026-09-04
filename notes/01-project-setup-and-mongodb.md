# 01 — Project Setup & MongoDB Connection

**Commit:** `34f37fa116638c372f474052718a0bff78d011e4` — `first commit`

## 1. Goal

The project starts with the smallest useful backend: create an Express application, load environment variables, connect to MongoDB through Mongoose, and start an HTTP server.

The repository also adds `.gitignore` entries for `node_modules` and `.env`, and documents that `dbUrl` should hold the Atlas connection string.

## 2. Server Bootstrap

The initial server imports:

```js
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
```

Then the app is created:

```js
const app = express()
const PORT = 8089
```

`express()` creates the Express application object. `PORT` identifies the network port on which the server accepts requests.

## 3. Environment Variables

The code uses:

```js
dotenv.config()
```

and reads:

```js
process.env.dbUrl
```

### Why?

Credentials and environment-specific configuration should not be written directly into application source code.

Typical development setup:

```text
server/.env

 dbUrl=mongodb+srv://...
 JWT_SECRET=...
```

The repository uses `.env.example` as a safe template, while `.env` is ignored by Git.

### Common beginner mistake

If `process.env.dbUrl` is `undefined`, usually check:

1. Is the `.env` file inside the expected directory?
2. Is the variable name exactly `dbUrl`?
3. Is `dotenv.config()` executed before accessing the variable?
4. Was the server restarted after changing `.env`?
5. Is the MongoDB URI valid and URL-safe?

## 4. Connecting MongoDB with Mongoose

```js
mongoose.connect(process.env.dbUrl)
  .then(() => {
    console.log("DB Connected")
  })
  .catch((err) => {
    console.log(err)
  })
```

`mongoose.connect()` returns a Promise.

```text
connect()
   ↓
Promise
   ├── resolve → .then()
   └── reject  → .catch()
```

This is asynchronous because a remote database connection can take time. The JavaScript process should not pretend that the database is immediately available.

## 5. Starting the Server

```js
app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})
```

This asks Node to listen for incoming HTTP connections.

Important distinction:

```text
mongoose.connect() → establishes DB connectivity
app.listen()       → establishes HTTP server listening
```

They are related but solve different problems.

## 6. Project Dependency Mental Model

The first commit establishes three important libraries:

```text
Express   → HTTP server + routing
Mongoose  → MongoDB ODM
Dotenv    → environment variables
```

Later commits build authentication on top of this foundation.

## 7. Architecture at This Stage

```text
                 MongoDB Atlas
                      ↑
                 Mongoose
                      ↑
Client → Express App → Routes/Controllers (later)
                      ↑
                dotenv config
```

At this point there is no user model, no route, and no authentication.

## 8. Things to Notice Before Moving On

The code already uses ES modules (`import`/`export`) instead of CommonJS (`require`). Students should stay consistent with the project's module configuration.

Also note the naming convention `dbUrl`. Environment variable names are case-sensitive and must match exactly.

## 9. Practice Questions

1. What is the difference between `app.listen()` and `mongoose.connect()`?
2. Why should a MongoDB connection string not be hardcoded?
3. What happens when `mongoose.connect()` rejects its Promise?
4. Why does `process.env.dbUrl` only work after environment loading?
5. Write a tiny Express app that starts on port `3000` without MongoDB.

## 10. Commit Checkpoint

After this commit you should be able to explain:

- how an Express server starts;
- how environment variables are loaded;
- why database connections are asynchronous;
- what Mongoose is doing for us;
- and why configuration belongs outside source code.
