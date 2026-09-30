import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import { createComment } from '../controllers/comment.controllers.js'






const commentRoutes = express.Router()

commentRoutes.post('/createComment/:type/:id', isAuthenticated , createComment)




export default commentRoutes