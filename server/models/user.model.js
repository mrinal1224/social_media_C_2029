import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
     },

     username : {
        type : String,
        required : true,
        unique : true
     },
     email : {
        type : String,
        required : true,
        unique : true
     },
     password : {
        type : String,
        required : true
     },

     profileImage : {
      type : String
     },

     followers : [],

     followings : [],


     posts : [],
     stories : [],
     reels : []


} , {timestamps : true})


const User = mongoose.model('User' , userSchema)

export default User