import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  
 author:{
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required:true
 },

 text : {
    type : String
 },

 post : {
    //123
    type : mongoose.Schema.Types.ObjectId,
    ref : "Post"
 },

 reel:{
    type : mongoose.Schema.Types.ObjectId,
    ref :"Reel"
 }



 }, { timestamps: true })


const Comment = mongoose.model('Comment', commentSchema)

export default Comment