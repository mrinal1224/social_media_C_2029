# Social Media C-2029 — Commit-Wise Notes

These notes follow the repository's implementation history in order. Each note explains **what changed, why it changed, how the code works, common mistakes, and what to practice**.

## Learning Path

1. [01 — Project Setup & MongoDB Connection](./01-project-setup-and-mongodb.md)
2. [02 — User Model & Data Design](./02-user-model.md)
3. [03 — Registration Controller & Validation](./03-register-controller.md)
4. [04 — Password Hashing with bcrypt](./04-password-hashing.md)
5. [05 — Login Flow & Password Verification](./05-login.md)
6. [06 — JWT, Cookies & Authentication Middleware](./06-jwt-cookies-auth-middleware.md)

## How to Use These Notes

For every stage, first open the matching commit in GitHub, inspect the changed files, then read the note. Try reproducing the change yourself before comparing with the repository.

The important mental model is:

```text
Client
  ↓
Express Route
  ↓
Controller
  ↓
Mongoose Model
  ↓
MongoDB

Authentication adds:

Login/Register
  ↓
Password Hashing (bcrypt)
  ↓
JWT Creation
  ↓
HttpOnly Cookie
  ↓
Authentication Middleware
  ↓
Protected Controller
```

## Important Repository Milestones

| Commit | Main Concept |
|---|---|
| `34f37fa` | Server bootstrap, dotenv, MongoDB connection |
| `7e2efb9` | User Mongoose schema/model |
| `1884bde` | Registration validation + controller + route |
| `1a20ef1` | bcrypt password hashing |
| `30d68d0` | Login + password verification |
| `02832e2` | JWT + cookies + authentication middleware |

## Current Architecture

```text
server/
├── controllers/
│   └── user.controllers.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   └── user.model.js
├── routes/
│   └── user.routes.js
├── utils/
│   └── generateToken.js
├── .env.example
└── index.js
```

## Suggested Practice

After completing the notes, implement logout, a protected `/users/me` endpoint, stronger validation, consistent error handling, and safer cookie options for local development.
