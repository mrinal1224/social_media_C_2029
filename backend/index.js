import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

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
      credentials : true
    },
  });




const port = 8084;


io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
  
    // Receive an event from the React client
    socket.on("client-message", (data) => {
        console.log("Message from client:", data.message);
    
        // Reply to the same client
        socket.emit("server-reply", {
            message: "Hello Client! Message received."
          });
        
      });

      
    
    
  
    // When the client disconnects
    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, reason);
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
app.use('/story' , storyRoutes)

app.use(errorMiddleware);

server.listen(port, () => {
    console.log(`Server Started at ${port}`);
});
