import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        reciever: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        notificationType: {
            type: String,
            enum: ['follow', 'comment', 'like']
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },


        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel"
        },

        story: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Story"
        },

        isRead: {
            type: Boolean,
            default: false
        }




    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
