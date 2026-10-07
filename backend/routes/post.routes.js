import express from "express";
import {
    createPost,
    getFeed,
    getPostsByUsername,
    togglePostLike
} from "../controllers/post.controllers.js";
import isAuthenticated from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middleware.js";

const postRoutes = express.Router();

postRoutes.post(
    "/",
    isAuthenticated,
    upload.single("image"),
    createPost
);

postRoutes.get(
    "/feed",
    isAuthenticated,
    getFeed
);

postRoutes.get(
    "/user/:username",
    isAuthenticated,
    getPostsByUsername
);

postRoutes.patch(
    "/:id/like",
    isAuthenticated,
    togglePostLike
);

export default postRoutes;
