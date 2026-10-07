# Project Stage: Before Profile Feature

This repository is intentionally prepared up to the point immediately before the **Public Profile** feature.

## Current stage

Authentication is complete and should be the baseline for the next classroom session:

- User registration
- User login
- JWT authentication via HttpOnly cookie
- `/users/me` authenticated session check
- Logout
- Public routes for landing, login and signup
- Protected `/home` route
- React `AuthContext` for authenticated user state
- Shared Axios instance with credentials enabled

## Important classroom boundary

**Do not implement the profile feature yet.**

The next class starts with the Profile module. The intended implementation will add:

- `GET /users/profile/:username`
- `/profile/:username`
- Public profile UI
- Profile-specific loading and error states

Those changes should be introduced as the next feature commits during class, not as part of this preparation stage.

## Architecture to continue from

### Backend

```text
backend/
├── controllers/
│   └── user.controllers.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   ├── user.model.js
│   └── post.model.js
├── routes/
│   └── user.routes.js
└── utils/
    └── generateToken.js
```

### Frontend

```text
frontend/vite-project/src/
├── axiosCalls/
│   └── axios.js
├── components/
│   ├── ProtectedRoute.jsx
│   └── PublicRoute.jsx
├── context/
│   └── AuthContext.jsx
└── pages/
    ├── Landing.jsx
    ├── Login.jsx
    ├── SignUp.jsx
    └── Home.jsx
```

## Design decisions

### AuthContext, not Redux

Authentication state is the only cross-cutting client state at this stage. Keep it in `AuthContext`. Page-specific server data should remain local to the page until a real need for shared state appears.

### User module owns profile functionality

When the profile feature is introduced, keep its API under `user.routes.js` and its controller under `user.controllers.js`. A profile is a public representation of a User, not a separate domain entity.

## Next class

Start with the public profile API and build the frontend profile page feature-by-feature.

Client - sends an Image