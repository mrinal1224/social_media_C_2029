import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.middleware.js';
import { createStory, getStories } from '../controllers/story.controllers.js';



const storyRoutes = express.Router();


storyRoutes.post('/createStory', isAuthenticated, upload.single('image'), createStory)
storyRoutes.get('/getStories', isAuthenticated, getStories)





export default storyRoutes;