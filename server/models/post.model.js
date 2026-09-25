import mongoose, { Mongoose } from "mongoose";
const postSchema = new mongoose.Schema({
  
 author:{
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required:true
 },

 caption:{
    type : String,
    maxLength : 500
 },

 image:{
    type : String
 }
  

}, { timestamps: true })


const Post = mongoose.model('Post', postSchema)

export default Post