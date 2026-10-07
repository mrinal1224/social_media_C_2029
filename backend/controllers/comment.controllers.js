import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import Reel from "../models/reel.model.js";

const getFilter = (type, id) =>
    type === "post" ? { post: id } :
    type === "reel" ? { reel: id } :
    null;

const contentExists = async (type, id) => {
    if (type === "post") return Post.exists({ _id: id });
    if (type === "reel") return Reel.exists({ _id: id });
    return null;
};

export const getComments = async (req, res) => {
    try {
        const { type, id } = req.params;
        const filter = getFilter(type, id);

        if (!filter) {
            return res.status(400).json({
                message: "Content type must be post or reel"
            });
        }

        if (!(await contentExists(type, id))) {
            return res.status(404).json({ message: "Content not found" });
        }

        const comments = await Comment.find(filter)
            .populate("user", "name username profileImage")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Comments fetched successfully",
            comments
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const createComment = async (req, res) => {
    try {
        const { type, id } = req.params;
        const filter = getFilter(type, id);
        const text = req.body.text?.trim();

        if (!filter) {
            return res.status(400).json({
                message: "Content type must be post or reel"
            });
        }

        if (!text) {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        if (text.length > 500) {
            return res.status(400).json({
                message: "Comment cannot exceed 500 characters"
            });
        }

        if (!(await contentExists(type, id))) {
            return res.status(404).json({ message: "Content not found" });
        }

        const comment = await Comment.create({
            text,
            user: req.user._id,
            ...filter
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate("user", "name username profileImage");

        return res.status(201).json({
            message: "Comment Added",
            comment: populatedComment
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You can delete only your own comments"
            });
        }

        await comment.deleteOne();

        return res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};
