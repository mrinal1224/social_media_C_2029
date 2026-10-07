# 00 — Project Architecture

## Project overview
Social Media A is a React + Express + MongoDB application with cookie-based JWT authentication, protected routes, profile management, social relationships and image upload through Multer + Cloudinary.

```text
React UI
   ↓
Axios
   ↓
Express
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Mongoose
   ↓
MongoDB

File upload:
Browser
   ↓
FormData
   ↓
Multer
   ↓
Cloudinary
   ↓
MongoDB profileImage
```

## Backend structure

```text
backend/
 ├── index.js
 ├── controllers/
 │    └── user.controllers.js
 ├── models/
 │    ├── user.model.js
 │    └── post.model.js
 ├── routes/
 │    └── user.routes.js
 ├── middlewares/
 │    ├── authMiddleware.js
 │    └── upload.middleware.js
 └── utils/
      ├── generateToken.js
      ├── cloudinary.js
      └── uploadToCloudinary.js
```

## Server bootstrap

```js
dotenv.config();

const app = express();
const port = 8084;

mongoose.connect(process.env.dbURL)
```

CORS:

```js
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
```

Then:

```js
app.use(express.json());
app.use(cookieParser());
app.use("/users", userRoutes);
```

### Why middleware order matters

The request is a pipeline:

```text
CORS
 ↓
JSON parsing
 ↓
cookie parsing
 ↓
router
 ↓
auth middleware
 ↓
controller
```

Authentication middleware depends on `req.cookies`, so cookie parsing must already have happened.

## Main API surface

```text
POST   /users/register
POST   /users/login
POST   /users/logout
GET    /users/me
GET    /users/profile/:username
POST   /users/:id/follow
DELETE /users/:id/follow
POST   /users/updateProfile
```

## MVC responsibilities

Route → maps method + URL.

Middleware → reusable request checks and transformations.

Controller → business operation.

Model → MongoDB data structure and queries.

Utils → reusable infrastructure such as JWT and Cloudinary helpers.

## Frontend architecture

```text
frontend/vite-project/src/
 ├── pages/
 ├── components/
 ├── context/
 ├── axiosCalls/
 └── App.jsx
```

The Axios instance uses `withCredentials: true`, which is important because authentication is transported through cookies.

## Login request

```text
Login.jsx
 ↓
axiosInstance.post('/users/login')
 ↓
Express
 ↓
/users router
 ↓
loginUser
 ↓
User.findOne()
 ↓
bcrypt.compare()
 ↓
generateToken()
 ↓
res.cookie()
 ↓
safe user response
 ↓
AuthContext.setUser()
 ↓
/home
```

## Profile update request

```text
Profile edit form
 ↓
FormData
 ↓
POST /users/updateProfile
 ↓
isAuthenticated
 ↓
Multer
 ↓
updateProfile
 ↓
optional Cloudinary upload
 ↓
User.findByIdAndUpdate()
 ↓
response
 ↓
React state
```

## Debugging framework

```text
UI handler does not run → React
Wrong URL/body → Axios/form state
404 → route/path
401 → cookie/JWT/auth middleware
Multer error → multipart/file validation
Cloudinary error → external storage/env
500 → controller/database/runtime
Correct response, wrong UI → React state/effect
```

## Viva

1. Why separate routes and controllers?
2. Why does authentication belong in middleware?
3. Why is Cloudinary upload a separate utility?
4. Why use a shared Axios instance?
5. Trace `/users/updateProfile` from browser to MongoDB.