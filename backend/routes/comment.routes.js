import express from "express";
import isAuthenticated from "../middlewares/authMiddleware.js";
import {
    createComment,
    deleteComment,
    getComments
} from "../controllers/comment.controllers.js";

const commentRoutes = express.Router();

commentRoutes.get("/:type/:id", isAuthenticated, getComments);
commentRoutes.post("/:type/:id", isAuthenticated, createComment);
commentRoutes.delete("/:commentId", isAuthenticated, deleteComment);

export default commentRoutes;
