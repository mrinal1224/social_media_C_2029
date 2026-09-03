import express from 'express'
import { loginUser, resgiterUser } from '../controllers/user.controllers.js'



const userRoutes = express.Router()

// register

userRoutes.post('/register' , resgiterUser)

userRoutes.post('/login' , loginUser)


export default userRoutes