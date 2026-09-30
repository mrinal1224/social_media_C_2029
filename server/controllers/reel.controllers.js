import uploadVideoToCloudinary from "../utils/uploadVideoToCloudinary.js";
import Reel from "../models/reel.model.js";
import User from "../models/user.model.js";

export const createReel = async (req, res) => {
    try {

        // video , author , caption

        const { caption } = req.body

        // write some validations

        if (typeof caption !== "string" || !caption.trim()) {
            return res.status(400).json({ message: 'Please add a Caption' })
        }

        if (caption.length > 500) {
            return res.status(400).json({ message: 'Caption should be less than 500 characters' })
        }

        // upload the Image to cloudinary


        if (!req.file) {
            return res.status(400).json({ message: "Please add a video" })
        }

        let video;

        if (req.file) {
            const uploadedVideo = await uploadVideoToCloudinary(req.file.buffer)
            video = uploadedVideo.secure_url
        }


        const reelCreated = await Reel.create({
            video,
            caption,
            author: req.user._id
        })

        // add the postID inside posts array of the User
        await User.findByIdAndUpdate(req.user._id, {
            $push: { reels: reelCreated.id }
        })
      // relate the post with userData(username , profileImage , name)
        
      const populatedReel = await Reel.findById(reelCreated.id).populate('author' , "name username profileImage")


        // send the Response

        res.status(201).json({ message: "Reel Created", reel:populatedReel  })

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error : error })
    }
}

export const getReels = async(req , res)=>{
    try {
        const reels= await Reel.find().sort({ createdAt: -1 }).populate('author' , "name username profileImage" )

        if(!reels){
           res.status(404).json({message : "No reels found"})
        }


        res.status(200).json({message : "Reels Found" , reels : reels})


    } catch (error) {
       return res.status(500).json({ message: 'Internal Server Errorr', error })
    }
}