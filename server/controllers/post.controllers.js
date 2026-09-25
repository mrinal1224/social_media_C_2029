import Post from "../models/post.model.js";
import uploadToCloudinary from "../utils/uploadCloudinary.js";

export const createPost = async(req , res)=>{
  try {

    // image , author , caption

    const {caption} = req.body

        // write some validations

    if(!caption.trim()){
        return res.status(400).json({ message: 'Please add a Caption' })
    }

    if(caption.length> 500){
        return res.status(400).json({ message: 'Caption should be less than 500 characters' })
    }

   // upload the Image to cloudinary


   let image; 

   if(req.file){
       const uploadedImage =  await uploadToCloudinary(req.file.buffer)
       image = uploadedImage.secure_url
   }


    const postCreated =  await Post.create({
        image,
        caption,
        author : req.user._id
     })

     // add the postID inside posts array of the User
     


    

    // relate the post with userData(username , profileImage , name)



    // send the Response

    res.status(201).json({message : "Post Created" , post : postCreated})
    
  } catch (error) {
    
  }
}