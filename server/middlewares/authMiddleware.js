import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const isAuthenticated = async (req , res , next)=>{
    const token =  req.cookies.token

    if(!token){
        res.status(401).json({message:"Not Authorized"})
    }

    const decoded = jwt.verify(token , process.env.JWT_SECRET)

    const user =  await User.findById(decoded.userId)

    if(!user){
        res.status(404).json({message:"User Not Found Token Invalid"})
    }

    req.user = user

    next()
}