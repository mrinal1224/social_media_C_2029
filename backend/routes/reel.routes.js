import express from "express";
import uploadReel from "../middlewares/reelUpload.middleware.js";
import {
    createReel,
    getReels,
    getReelsByUsername,
    toggleReelLike
} from "../controllers/reel.controllers.js";
import isAuthenticated from "../middlewares/authMiddleware.js";

const reelRoutes = express.Router();

reelRoutes.post(
    "/",
    isAuthenticated,
    uploadReel.single("video"),
    createReel
);

reelRoutes.get(
    "/",
    isAuthenticated,
    getReels
);

reelRoutes.get(
    "/user/:username",
    isAuthenticated,
    getReelsByUsername
);

reelRoutes.patch(
    "/:id/like",
    isAuthenticated,
    toggleReelLike
);

export default reelRoutes;
