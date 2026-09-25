import mongoose, { Mongoose } from "mongoose";
const reelSchema = new mongoose.Schema({
  
 author:{
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required:true
 },

 caption:{
    type : String,
    maxLength : 500
 },

 video:{
    type : String
 }
  

}, { timestamps: true })


const Reel = mongoose.model('Reel', reelSchema)

export default Reel