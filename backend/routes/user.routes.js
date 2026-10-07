import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getUserProfile,
    followUser,
    unfollowUser,
    updateProfile
} from "../controllers/user.controllers.js";
import isAuthenticated from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/logout", isAuthenticated, logoutUser);
userRoutes.get("/me", isAuthenticated, getMe);
userRoutes.get("/profile/:username", isAuthenticated, getUserProfile);

// Following and followers
userRoutes.post("/:id/follow", isAuthenticated, followUser);
userRoutes.delete("/:id/follow", isAuthenticated, unfollowUser);

userRoutes.post('/updateProfile', isAuthenticated,   upload.single('profileImage'), updateProfile)

export default userRoutes;
