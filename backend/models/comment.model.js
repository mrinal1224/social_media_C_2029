import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            trim: true,
            required: true,
            maxlength: 500
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel"
        }
    },
    { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
