import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadCloudinary.js";

export const createPost = async (req, res) => {
    try {

        // image , author , caption

        const { caption } = req.body

        // write some validations

        if (typeof caption !== "string" || !caption.trim()) {
            return res.status(400).json({ message: 'Please add a Caption' })
        }

        if (caption.length > 500) {
            return res.status(400).json({ message: 'Caption should be less than 500 characters' })
        }

        // upload the Image to cloudinary


        let image;

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(req.file.buffer)
            image = uploadedImage.secure_url
        }


        const postCreated = await Post.create({
            image,
            caption,
            author: req.user._id
        })

        // add the postID inside posts array of the User
        await User.findByIdAndUpdate(req.user._id, {
            $push: { posts: postCreated.id }
        })
        // relate the post with userData(username , profileImage , name)

        const populatedPost = await Post.findById(postCreated.id).populate('author', "name username profileImage")


        // send the Response

        res.status(201).json({ message: "Post Created", post: populatedPost })

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Errorr', error })
    }
}

export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', "name username profileImage")

        if (!posts) {
            res.status(404).json({ message: "No posts found" })
        }


        res.status(200).json({ message: "Posts Found", posts: posts })


    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Errorr', error })
    }
}

export const updateLikes = async (req, res) => {
    try {

        // post id
        const postId = req.params.id

        const post = await Post.findById(postId)

        console.log(post)

        // user id 
        const userId = req.user._id

        // check if the post is already liked - Unlike or we like

        const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString())

        if (alreadyLiked) {
            // We Unlike
            post.likes.pull(userId)
        } else {
            // We Like
            post.likes.push(userId)
        }


        res.status(200).json({ message: alreadyLiked ? "Unliked" : "Liked", count: post.likes.length })

        // Post <-model <- Likes <- userId

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Errorr', error })
    }
}