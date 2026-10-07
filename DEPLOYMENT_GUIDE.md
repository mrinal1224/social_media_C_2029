# Deploying the MERN Social Media App for Free

> **Student Deployment Guide**
>
> This guide is written for the same project structure used in the Social Media classroom project:
>
> ```text
> project-root/
> ├── backend/
> │   ├── index.js
> │   ├── package.json
> │   ├── controllers/
> │   ├── models/
> │   ├── routes/
> │   ├── middlewares/
> │   ├── utils/
> │   └── socket.js
> │
> └── frontend/
>     └── vite-project/
>         ├── package.json
>         ├── src/
>         ├── vite.config.js
>         └── index.html
> ```
>
> The application uses:
>
> - React + Vite
> - Redux
> - Node.js
> - Express
> - MongoDB
> - JWT authentication using an `httpOnly` cookie
> - Multer
> - Cloudinary
> - Socket.IO
> - Real-time notifications
>
> We will deploy the complete application without requiring a paid server.

---

## 1. Final Deployment Architecture

We will use the following services:

| Part | Service | Purpose |
|---|---|---|
| Source Code | GitHub | Store the project |
| Frontend | Vercel | Host React/Vite |
| Backend | Render | Host Express + Socket.IO |
| Database | MongoDB Atlas | Store users, posts, comments, notifications, etc. |
| Media | Cloudinary | Store images and videos |

Final architecture:

```text
                         USER
                          │
                          ▼
                 ┌─────────────────┐
                 │     Vercel      │
                 │   React / Vite  │
                 └────────┬────────┘
                          │
                 HTTPS + Socket.IO
                          │
                          ▼
                 ┌─────────────────┐
                 │     Render      │
                 │ Express + Node  │
                 │    Socket.IO    │
                 └───────┬─────────┘
                         │
               ┌─────────┴───────────┐
               ▼                     ▼
       ┌───────────────┐     ┌───────────────┐
       │ MongoDB Atlas │     │  Cloudinary   │
       │   Database    │     │ Images/Videos │
       └───────────────┘     └───────────────┘
```

---

# 2. Before You Deploy

Before deploying, make sure:

- Your complete project is pushed to GitHub.
- The frontend works locally.
- The backend works locally.
- MongoDB connects successfully.
- Login/register works.
- Image upload works.
- Posts/reels work.
- Socket.IO works locally.
- Your `.env` file is **not pushed to GitHub**.

Run:

```bash
git status
```

Make sure `.env` does not appear as a file waiting to be committed.

Your `.gitignore` should contain something similar to:

```gitignore
node_modules
.env
.env.*
!.env.example
dist
.DS_Store
```

Never push:

```text
MongoDB passwords
JWT secrets
Cloudinary API secrets
API keys
```

---

# 3. Make the Backend Deployment Ready

The local project currently assumes:

```text
Frontend → http://localhost:5173
Backend  → http://localhost:8084
```

These URLs will change after deployment.

We therefore need to move deployment-specific values into environment variables.

---

## 3.1 Add a Production Start Script

Open:

```text
backend/package.json
```

Add a `start` script.

Example:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

Do not remove your dependencies.

Render will eventually execute:

```bash
npm start
```

which will execute:

```bash
node index.js
```

---

# 4. Make the Port Dynamic

Locally we may use:

```js
const port = 8084;
```

A cloud provider decides which port your application should use.

Change it to:

```js
const port = process.env.PORT || 8084;
```

Now:

```text
Local Machine
PORT missing
        ↓
uses 8084
```

while:

```text
Render
PORT provided by Render
        ↓
uses Render's port
```

At the bottom of `backend/index.js`, use:

```js
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server Started at ${port}`);
});
```

---

# 5. Fix Production CORS

Your frontend will eventually look something like:

```text
https://your-project.vercel.app
```

while your backend may look like:

```text
https://your-project-api.onrender.com
```

The backend must explicitly allow the frontend origin.

In `backend/index.js`, create:

```js
const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);
```

Create a reusable CORS configuration:

```js
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
};
```

Use it with Express:

```js
app.use(cors(corsOptions));
```

---

# 6. Fix Socket.IO CORS

Socket.IO also needs permission to connect from the deployed frontend.

Instead of:

```js
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});
```

use:

```js
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});
```

Your frontend and Socket.IO backend can now communicate in both:

```text
LOCAL DEVELOPMENT
http://localhost:5173
```

and:

```text
PRODUCTION
https://your-project.vercel.app
```

---

# 7. Add a Health Route

This is optional, but strongly recommended.

Add this before the error middleware:

```js
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Server is running"
    });
});
```

After deployment we can visit:

```text
https://your-backend.onrender.com/health
```

and immediately verify whether the server is alive.

---

# 8. Fix Authentication Cookies for Production

This application uses an `httpOnly` JWT cookie.

Locally we currently use settings similar to:

```js
sameSite: "lax",
secure: false
```

That is fine when working locally.

However, after deployment:

```text
Frontend = vercel.app
Backend  = onrender.com
```

They are different sites.

Use environment-aware cookie configuration.

In:

```text
backend/controllers/user.controllers.js
```

create:

```js
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
};
```

Then continue using:

```js
res.cookie("token", token, cookieOptions);
```

For logout, make sure the same cookie properties are used:

```js
res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/"
});
```

### Why?

Production cookies sent between different HTTPS sites require:

```text
SameSite=None
Secure=true
```

Localhost does not.

---

# 9. Backend Environment Variables

Update:

```text
backend/.env.example
```

to:

```env
dbURL=your-mongodb-connection-string

JWT_SECRET=your-jwt-secret

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

CLIENT_URL=http://localhost:5173

NODE_ENV=development
```

Your real:

```text
backend/.env
```

should never be committed.

---

# 10. Make Axios Deployment Ready

Open:

```text
frontend/vite-project/src/axiosCalls/axios.js
```

Instead of:

```js
baseURL: "http://localhost:8084/"
```

use:

```js
import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8084";

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export default axiosInstance;
```

Now the URL can be changed without modifying source code.

---

# 11. Make Socket.IO Client Deployment Ready

Open:

```text
frontend/vite-project/src/socket.js
```

Instead of:

```js
io("http://localhost:8084")
```

use:

```js
import { io } from "socket.io-client";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8084";

const socket = io(API_URL, {
    autoConnect: false,
    withCredentials: true
});

export default socket;
```

Notice that the same environment variable is used for:

```text
Axios
Socket.IO
```

That keeps the setup simple.

---

# 12. Create a Frontend Environment Example

Inside:

```text
frontend/vite-project/
```

create:

```text
.env.example
```

with:

```env
VITE_API_URL=http://localhost:8084
```

For local development you can create:

```text
.env
```

containing:

```env
VITE_API_URL=http://localhost:8084
```

Remember:

> Variables exposed to Vite must start with `VITE_`.

---

# 13. Fix React Router Refresh on Vercel

This application uses:

```js
<BrowserRouter>
```

with routes such as:

```text
/home
/profile/:username
/login
/signup
```

Without an SPA rewrite, opening:

```text
https://your-app.vercel.app/profile/mrinal
```

directly may produce a `404`.

Inside:

```text
frontend/vite-project/
```

create:

```text
vercel.json
```

with:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Commit this file.

---

# 14. Commit the Deployment Changes

Once everything works locally:

```bash
git add .
git commit -m "Prepare project for deployment"
git push origin main
```

Do not continue until the latest deployment-related code exists on GitHub.

---

# 15. Create a Free MongoDB Atlas Database

Go to MongoDB Atlas and create an account.

Create a project and then create a free cluster.

The exact Atlas UI may change, but the important steps remain the same.

---

## 15.1 Create a Database User

Create a database username and password.

Example:

```text
Username:
socialappuser

Password:
Use-A-Strong-Password
```

Do not use your Atlas account password as your database password.

Do not push the database password to GitHub.

---

## 15.2 Configure Network Access

MongoDB Atlas only allows connections from permitted networks.

For a classroom/student deployment using a cloud host with changing outbound IP addresses, the simplest demo setup is usually:

```text
0.0.0.0/0
```

This means:

```text
Allow connection attempts from any IP
```

### Important

This does **not** mean anyone can automatically access your database.

They still need:

```text
database username
+
database password
```

However, `0.0.0.0/0` is less restrictive than allowing only specific IP addresses.

It is acceptable for a classroom/demo project, but production systems should use stricter network controls whenever possible.

---

# 16. Get the MongoDB Connection String

From Atlas:

```text
Database
→ Connect
→ Drivers
→ Node.js
```

You will receive something similar to:

```text
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/
```

Add your database name:

```text
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/social_media
```

This becomes:

```env
dbURL=mongodb+srv://...
```

### Common MongoDB Password Problem

If your database password contains characters such as:

```text
@
:
/
#
%
```

they may need URL encoding inside the connection string.

For beginner projects, using a strong password containing letters and numbers can avoid accidental URI parsing issues.

---

# 17. Configure Cloudinary

Create a Cloudinary account.

From the Cloudinary dashboard/API Keys section, obtain:

```text
Cloud Name
API Key
API Secret
```

They map to:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Never expose:

```text
CLOUDINARY_API_SECRET
```

inside React code.

Cloudinary secrets belong only on the backend.

---

# 18. Create a JWT Secret

You need a strong secret for signing JWTs.

A simple way to generate one is:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated string.

Use it as:

```env
JWT_SECRET=your-generated-secret
```

Do not use:

```env
JWT_SECRET=secret
```

or:

```env
JWT_SECRET=12345
```

---

# 19. Deploy the Backend on Render

Now deploy the Express + Socket.IO server first.

Go to Render.

Choose:

```text
New
→ Web Service
```

Connect your GitHub account.

Select your project repository.

---

# 20. Render Backend Configuration

Because the backend exists inside:

```text
backend/
```

configure:

```text
Root Directory
backend
```

Use:

```text
Runtime
Node
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Select the free instance if available for your student account.

---

# 21. Add Render Environment Variables

Open:

```text
Render Service
→ Environment
```

Add:

```env
dbURL=YOUR_MONGODB_ATLAS_CONNECTION_STRING

JWT_SECRET=YOUR_JWT_SECRET

CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

CLIENT_URL=http://localhost:5173

NODE_ENV=production
```

For the first deployment we temporarily keep:

```env
CLIENT_URL=http://localhost:5173
```

because we do not know the Vercel URL yet.

We will update it later.

---

# 22. Deploy the Backend

Click:

```text
Deploy
```

Render will:

```text
Clone repository
        ↓
Enter backend/
        ↓
npm install
        ↓
npm start
        ↓
node index.js
```

Watch the logs.

You should eventually see something similar to:

```text
DB Connected
Server Started at 10000
```

The actual port is controlled by Render.

---

# 23. Test the Render Backend

Suppose Render gives:

```text
https://social-media-api.onrender.com
```

Visit:

```text
https://social-media-api.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

Save your Render URL.

We will call it:

```text
BACKEND_URL
```

Example:

```text
BACKEND_URL=https://social-media-api.onrender.com
```

---

# 24. Deploy the Frontend on Vercel

Now go to Vercel.

Choose:

```text
Add New
→ Project
```

Import the same GitHub repository.

---

# 25. Configure the Vercel Root Directory

Our frontend is not at the repository root.

It exists at:

```text
frontend/vite-project/
```

Set:

```text
Root Directory
frontend/vite-project
```

Vercel should detect:

```text
Framework Preset
Vite
```

The build command should normally be:

```bash
npm run build
```

Output directory:

```text
dist
```

---

# 26. Add the Vercel Environment Variable

Before deploying, add:

```env
VITE_API_URL=https://YOUR-BACKEND.onrender.com
```

Example:

```env
VITE_API_URL=https://social-media-api.onrender.com
```

Do **not** use:

```env
VITE_API_URL=http://localhost:8084
```

in production.

Also do not add:

```text
MongoDB URL
JWT secret
Cloudinary secret
```

to Vercel.

Those are backend secrets.

The frontend only needs the public backend URL.

---

# 27. Deploy the Frontend

Click:

```text
Deploy
```

Vercel will:

```text
npm install
     ↓
npm run build
     ↓
generate dist/
     ↓
deploy static frontend
```

After deployment you will receive something similar to:

```text
https://social-media-app.vercel.app
```

Save this URL.

We will call it:

```text
FRONTEND_URL
```

---

# 28. Update Render with the Real Frontend URL

Return to:

```text
Render
→ Backend Service
→ Environment
```

Change:

```env
CLIENT_URL=http://localhost:5173
```

to:

```env
CLIENT_URL=https://social-media-app.vercel.app
```

Use your actual Vercel production URL.

Save the environment variable.

Render will redeploy/restart the service.

Now your backend allows requests from the deployed frontend.

---

# 29. The Complete Production Flow

Your application should now work like this:

```text
Browser
   │
   ▼
Vercel
React Application
   │
   ├──────── REST API ──────────────┐
   │                                │
   └──────── Socket.IO ─────────────┤
                                    ▼
                               Render
                           Express + Socket.IO
                              │         │
                              │         │
                              ▼         ▼
                         MongoDB     Cloudinary
```

---

# 30. Test Authentication

Open:

```text
https://YOUR-APP.vercel.app
```

Try:

```text
Register
↓
Login
↓
Home
```

Open browser Developer Tools.

Check:

```text
Application
→ Cookies
```

or the equivalent cookie storage panel in your browser.

You should see a cookie named:

```text
token
```

The cookie should belong to the backend domain.

Production cookie properties should include:

```text
HttpOnly
Secure
SameSite=None
```

---

# 31. Test the Entire Application

Do not consider the project deployed after only seeing the landing page.

Test the complete application.

### Authentication

- Register
- Login
- Refresh page
- Logout
- Login again

### Profile

- Open own profile
- Open another user's profile
- Edit profile
- Upload profile image
- Follow user
- Unfollow user

### Feed

- Create image post
- Fetch posts
- Like post
- Comment on post

### Reels

- Upload reel
- Fetch reel
- Like/comment if supported

### Stories

- Upload story
- Fetch stories

### Notifications

Use two accounts.

For example:

```text
Browser 1
User A
```

and:

```text
Incognito / Browser 2
User B
```

Now:

```text
User A follows User B
```

User B should receive the real-time notification.

This confirms:

```text
MongoDB persistence
+
REST APIs
+
JWT authentication
+
Socket.IO connection
+
Socket room
+
real-time notification delivery
```

are all working.

---

# 32. Test React Router Properly

Do not only navigate using buttons.

Manually open:

```text
https://YOUR-APP.vercel.app/home
```

and:

```text
https://YOUR-APP.vercel.app/profile/YOUR_USERNAME
```

Then refresh the browser.

If you receive a Vercel `404`, verify:

```text
frontend/vite-project/vercel.json
```

contains:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Then push the file and redeploy.

---

# 33. Render Free Tier Behaviour

Render free web services may sleep after a period without inbound traffic.

Therefore the first request after inactivity may take noticeably longer.

This is normal for a student/demo deployment.

Example:

```text
First request after inactivity
        ↓
Render wakes service
        ↓
request may take longer

Later requests
        ↓
fast again
```

Do not immediately assume:

```text
"Backend is broken"
```

if the first request takes time.

---

# 34. Socket.IO on Render

Render supports WebSocket connections.

Your application already correctly creates Socket.IO on top of the same HTTP server:

```js
const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

httpServer.listen(port);
```

Do **not** do this:

```js
app.listen(...);
httpServer.listen(...);
```

You only want the HTTP server containing both:

```text
Express
+
Socket.IO
```

to listen publicly.

---

# 35. Common Error: CORS

You may see:

```text
Access to XMLHttpRequest has been blocked by CORS policy
```

Check Render:

```env
CLIENT_URL=https://your-project.vercel.app
```

The value must match the frontend origin exactly.

Good:

```text
https://social-media.vercel.app
```

Potentially wrong:

```text
http://social-media.vercel.app
```

or a completely different Vercel preview URL.

Also ensure:

```js
credentials: true
```

exists in both Express CORS and Socket.IO CORS.

---

# 36. Common Error: Login Works Locally but Not in Production

Symptoms:

```text
Login API returns 200
but
/users/me returns 401
```

or:

```text
User gets logged out after refresh
```

Check the cookie configuration.

Production should use:

```js
sameSite: "none",
secure: true
```

Axios must use:

```js
withCredentials: true
```

Socket.IO should also use:

```js
withCredentials: true
```

The backend CORS configuration must use:

```js
credentials: true
```

---

# 37. Browser Privacy / Third-Party Cookie Note

Because:

```text
Frontend → vercel.app
Backend  → onrender.com
```

the authentication cookie is cross-site.

Some browsers or strict privacy settings may block third-party/cross-site cookies.

If:

```text
Login API succeeds
but cookie never appears
```

inspect the browser privacy/cookie settings.

For a classroom project, students can allow cookies for their deployed project while testing.

For a larger production system, a same-site/custom-domain architecture is preferable.

Do not move JWTs from secure `httpOnly` cookies into `localStorage` only to avoid understanding the cookie issue.

---

# 38. Common Error: MongoDB Does Not Connect

Render logs may show:

```text
MongoServerSelectionError
```

Check:

### 1. Connection string

```env
dbURL=mongodb+srv://...
```

### 2. Database username

Make sure you created a MongoDB **database user**, not only an Atlas account.

### 3. Password

Verify the password is correct.

### 4. Network Access

For the classroom setup check whether:

```text
0.0.0.0/0
```

has been allowed.

### 5. Special characters

A password containing reserved URL characters may require URL encoding.

---

# 39. Common Error: Cloudinary Upload Fails

Check Render environment variables:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Do not add quotes unless the value actually requires them.

Wrong:

```env
CLOUDINARY_API_KEY="123456789"
```

Prefer:

```env
CLOUDINARY_API_KEY=123456789
```

Check the Render logs for the actual Cloudinary error.

---

# 40. Common Error: Render Says No Open Port

If Render reports that it cannot detect an open port, verify:

```js
const port = process.env.PORT || 8084;
```

and:

```js
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server Started at ${port}`);
});
```

Do not deploy with only:

```js
const port = 8084;
```

---

# 41. Common Error: `npm start` Fails on Render

If the log says:

```text
Missing script: "start"
```

open:

```text
backend/package.json
```

and add:

```json
"scripts": {
  "start": "node index.js"
}
```

Push again:

```bash
git add .
git commit -m "Add backend production start script"
git push
```

Render can automatically redeploy from the latest commit.

---

# 42. Common Error: Vercel Still Calls Localhost

Open browser Developer Tools:

```text
Network
```

If requests are going to:

```text
http://localhost:8084
```

your Vercel environment variable is missing or incorrect.

Add:

```env
VITE_API_URL=https://YOUR-BACKEND.onrender.com
```

Then **redeploy the frontend**.

Vite environment variables are included during the build.

Changing the environment variable does not magically modify an already-built deployment.

---

# 43. Common Error: Socket.IO Connection Fails

Open:

```text
Developer Tools
→ Console
```

Check the backend URL.

The Socket.IO client must use:

```js
const socket = io(API_URL, {
    autoConnect: false,
    withCredentials: true
});
```

Then check:

```text
Render Logs
```

When an authenticated user connects, your backend should log something similar to:

```text
Socket connected: abc123
Authenticated socket user: username 123456...
username joined room: user:123456...
```

If you see:

```text
Authentication required
```

the Socket.IO handshake did not receive the JWT cookie.

Check:

```text
cookie settings
CORS
withCredentials
browser cookie/privacy settings
```

---

# 44. Environment Variable Checklist

## Render / Backend

```env
dbURL=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=https://YOUR-FRONTEND.vercel.app

NODE_ENV=production
```

Render provides:

```env
PORT
```

automatically.

Do not manually depend on port `8084` in production.

---

## Vercel / Frontend

```env
VITE_API_URL=https://YOUR-BACKEND.onrender.com
```

That is normally all the frontend needs.

---

# 45. Secrets vs Public Environment Variables

Not every environment variable is a secret.

## Backend secrets

These must never appear in frontend code:

```text
dbURL
JWT_SECRET
CLOUDINARY_API_SECRET
```

## Public frontend configuration

This is safe to expose:

```text
VITE_API_URL
```

Why?

Because anyone using the website can already see the backend API domain in browser network requests.

---

# 46. Updating the Project After Deployment

One major advantage of Git-based deployment is that future updates are easy.

Typical workflow:

```bash
git add .
git commit -m "Add feature"
git push origin main
```

Then:

```text
GitHub receives new commit
        ↓
Render redeploys backend
        ↓
Vercel rebuilds frontend
```

depending on which files changed and your provider configuration.

---

# 47. Recommended Submission Format

Students should submit:

```text
GitHub Repository:
https://github.com/USERNAME/PROJECT

Live Frontend:
https://PROJECT.vercel.app

Backend API:
https://PROJECT.onrender.com
```

Optional:

```text
Demo Credentials:

Email:
demo@example.com

Password:
DemoPassword123
```

Do **not** submit real personal passwords.

---

# 48. What Should Be Demonstrated During Evaluation?

A deployed MERN project should prove more than:

```text
"The page opens."
```

Students should be able to demonstrate:

```text
Frontend deployed
        ↓
Frontend calls deployed backend
        ↓
Backend connects to cloud database
        ↓
Authentication works
        ↓
Data persists
        ↓
Media uploads
        ↓
Protected APIs work
        ↓
Socket.IO connects
        ↓
Real-time notification works
```

That is an actual deployed full-stack application.

---

# 49. Deployment Checklist

Before submitting, verify every item.

## GitHub

- [ ] Latest code pushed
- [ ] `.env` not committed
- [ ] `node_modules` not committed
- [ ] `dist` not required in Git
- [ ] README exists

## MongoDB Atlas

- [ ] Free cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] Correct connection string copied
- [ ] Database name included

## Cloudinary

- [ ] Account created
- [ ] Cloud name copied
- [ ] API key copied
- [ ] API secret copied
- [ ] Secrets stored only on backend

## Backend

- [ ] `npm start` works
- [ ] Dynamic `PORT`
- [ ] `CLIENT_URL`
- [ ] Production CORS
- [ ] Socket.IO CORS
- [ ] Production cookie settings
- [ ] `/health` endpoint
- [ ] Render deployment successful

## Frontend

- [ ] `VITE_API_URL`
- [ ] Axios no longer hardcoded to localhost
- [ ] Socket.IO no longer hardcoded to localhost
- [ ] `vercel.json` added
- [ ] Vercel deployment successful

## Testing

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Refresh authentication
- [ ] Profile
- [ ] Profile image upload
- [ ] Create post
- [ ] Create reel
- [ ] Create story
- [ ] Like
- [ ] Comment
- [ ] Follow/unfollow
- [ ] Notifications fetched
- [ ] Real-time Socket.IO notification
- [ ] Refresh `/home`
- [ ] Refresh `/profile/:username`

---

# 50. Quick Deployment Summary

If you already understand everything above, the complete process is:

```text
1. Push project to GitHub
        ↓
2. Replace hardcoded localhost URLs with environment variables
        ↓
3. Add dynamic process.env.PORT
        ↓
4. Add production CORS
        ↓
5. Add production cookie settings
        ↓
6. Create MongoDB Atlas database
        ↓
7. Create Cloudinary account
        ↓
8. Deploy backend on Render
        ↓
9. Copy Render backend URL
        ↓
10. Set VITE_API_URL
        ↓
11. Deploy frontend on Vercel
        ↓
12. Copy Vercel frontend URL
        ↓
13. Update Render CLIENT_URL
        ↓
14. Redeploy/restart backend
        ↓
15. Test complete application
        ↓
16. Test Socket.IO with two users
```

---

# 51. Reference Production Code

A simplified production-ready backend setup should resemble:

```js
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const port = process.env.PORT || 8084;

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Server is running"
    });
});

// routes...
// socket authentication...
// socket connection...
// error middleware...

httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server Started at ${port}`);
});
```

Do not blindly replace your complete `index.js` with this snippet.

Use it to understand the deployment-specific pieces:

```text
process.env.PORT
CLIENT_URL
CORS
Socket.IO CORS
health route
```

Your existing routes, MongoDB connection, Socket authentication, notification rooms, and middleware should remain.

---

# 52. Final Architecture

When everything is complete:

```text
                     ┌─────────────────────┐
                     │       GitHub        │
                     │     Source Code     │
                     └──────────┬──────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                    ▼                        ▼
          ┌──────────────────┐      ┌──────────────────┐
          │      Vercel      │      │      Render      │
          │   React + Vite   │◄────►│ Express + Socket│
          │      Redux       │      │       .IO        │
          └──────────────────┘      └────────┬─────────┘
                                             │
                                    ┌────────┴─────────┐
                                    │                  │
                                    ▼                  ▼
                           ┌────────────────┐  ┌────────────────┐
                           │ MongoDB Atlas  │  │   Cloudinary   │
                           │     Data       │  │  Media Files   │
                           └────────────────┘  └────────────────┘
```

For a student project, the target cost can remain:

```text
GitHub          ₹0
Vercel          ₹0
Render          ₹0
MongoDB Atlas   ₹0
Cloudinary      ₹0
------------------
Total           ₹0
```

subject to each platform's current free-tier limits.

---

# 53. Official Documentation

Platform interfaces and free-tier limits can change, so always check the current official documentation if a dashboard looks different from screenshots/tutorials.

- Render — Node/Express deployment documentation
- Render — WebSocket documentation
- Render — Free web service documentation
- Vercel — Vite deployment documentation
- Vercel — Environment variable documentation
- MongoDB Atlas — Connection and Network Access documentation
- Cloudinary — Node.js SDK documentation

---

## Final Rule

> **If your deployed frontend still contains `localhost`, the deployment is not finished.**

A production deployment should communicate entirely using cloud URLs and environment variables.

Good luck, and test your project **before** the evaluation day — not five minutes before your demo.
