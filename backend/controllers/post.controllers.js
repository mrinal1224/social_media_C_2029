import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

export const createPost = async (req, res, next) => {
    try {
        const { caption } = req.body;

        if (!caption?.trim() && !req.file) {
            return res.status(400).json({
                message: "Add a caption or upload an image"
            });
        }

        if (caption && caption.trim().length > 500) {
            return res.status(400).json({
                message: "Caption cannot exceed 500 characters"
            });
        }

        let image;

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(req.file.buffer);
            image = uploadedImage.secure_url;
        }

        const post = await Post.create({
            author: req.user._id,
            caption: caption?.trim() || "",
            image
        });

        await User.findByIdAndUpdate(req.user._id, {
            $push: { posts: post._id }
        });

        const populatedPost = await Post.findById(post._id)
            .populate("author", "name username profileImage");

        return res.status(201).json({
            message: "Post created successfully",
            post: populatedPost
        });
    } catch (error) {
        next(error);
    }
};

export const getFeed = async (req, res, next) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate("author", "name username profileImage");

        return res.status(200).json({
            message: "Feed fetched successfully",
            posts
        });
    } catch (error) {
        next(error);
    }
};


export const getPostsByUsername = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select("_id");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const posts = await Post.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate("author", "name username profileImage");

        return res.status(200).json({
            message: "User posts fetched successfully",
            posts
        });
    } catch (error) {
        next(error);
    }
};


export const togglePostLike = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const userId = req.user._id;
        const alreadyLiked = post.likes.some(
            (id) => id.toString() === userId.toString()
        );

        if (alreadyLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();

        return res.status(200).json({
            message: alreadyLiked ? "Post unliked" : "Post liked",
            liked: !alreadyLiked,
            likesCount: post.likes.length
        });
    } catch (error) {
        next(error);
    }
};
