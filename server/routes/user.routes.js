import express from 'express'
import { resgiterUser } from '../controllers/user.controllers.js'



const userRoutes = express.Router()

// register

userRoutes.post('/register' , resgiterUser)


export default userRoutes