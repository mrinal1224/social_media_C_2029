import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/upload.middleware.js'
import { createPost, getPosts } from '../controllers/post.controllers.js'


const postRoutes = express.Router()


postRoutes.post('/createPost', isAuthenticated, upload.single('image'), createPost)
postRoutes.get('/getAllPosts' , isAuthenticated , getPosts)



export default postRoutes