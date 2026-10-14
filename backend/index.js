import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import User from "./models/user.model.js";

import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import reelRoutes from "./routes/reel.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import storyRoutes from "./routes/story.routes.js";

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  },
});

// userId -> Set of socket IDs
const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {

    const cookieHeader = socket.handshake.headers.cookie || "";

    const cookies = cookie.parse(cookieHeader);

    const token = cookies.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    // Store verified identity on the socket
    socket.data.userId = user._id.toString();

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});








const port = 8084;


io.on("connection", (socket) => {
  const userId = socket.data.userId;

  // Retrieve this user's existing socket connections
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  // Add this socket to the user's connections
  onlineUsers.get(userId).add(socket.id);

  console.log("User connected:", userId);
  console.log("Socket ID:", socket.id);

  socket.on("disconnect", () => {
    const userSockets = onlineUsers.get(userId);

    if (userSockets) {
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }

    console.log("User disconnected:", userId);
  });
});


mongoose.connect(process.env.dbURL)
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/post", postRoutes);
app.use("/reel", reelRoutes);
app.use("/comment", commentRoutes);
app.use('/story', storyRoutes)

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server Started at ${port}`);
});
