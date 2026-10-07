import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: Number
        },

        bio: {
            type: String
        },

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                // 123 - james
                ref: "User"
            }
        ],
        // people who follow me
        followings: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        // people I follow
        posts: [],
        stories: [],
        reels: [],

        profileImage: {
            type: String
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
