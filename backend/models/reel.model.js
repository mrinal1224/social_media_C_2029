import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        caption: {
            type: String,
            trim: true,
            maxlength: 500
        },
        video: {
            type: String,
            required: true
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

const Reel = mongoose.model("Reel", reelSchema);

export default Reel;
