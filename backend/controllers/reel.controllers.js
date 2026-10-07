import Reel from "../models/reel.model.js";
import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";

const uploadReelToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "social-media/reels",
                resource_type: "video"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

export const createReel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "A video file is required"
            });
        }

        const caption = req.body.caption?.trim() || "";

        if (caption.length > 500) {
            return res.status(400).json({
                message: "Caption cannot exceed 500 characters"
            });
        }

        const uploadedVideo = await uploadReelToCloudinary(req.file.buffer);

        const reel = await Reel.create({
            author: req.user._id,
            caption,
            video: uploadedVideo.secure_url
        });

        await User.findByIdAndUpdate(req.user._id, {
            $push: { reels: reel._id }
        });

        const populatedReel = await Reel.findById(reel._id)
            .populate("author", "name username profileImage");

        return res.status(201).json({
            message: "Reel Created",
            reel: populatedReel
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const getReels = async (req, res) => {
    try {
        const reels = await Reel.find()
            .populate("author", "name username profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Reels fetched successfully",
            reels
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const updateLikes = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);

        if (!reel) {
            return res.status(404).json({ message: "No Reel Found" });
        }

        const userId = req.user._id;
        const isAlreadyLiked = reel.likes.some(
            (id) => id.toString() === userId.toString()
        );

        if (isAlreadyLiked) {
            reel.likes.pull(userId);
        } else {
            reel.likes.push(userId);
        }

        await reel.save();

        return res.status(200).json({
            message: isAlreadyLiked ? "Reel Unliked" : "Reel Liked",
            likes: reel.likes.length,
            liked: !isAlreadyLiked
        });

        // Populate the user with username
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};
