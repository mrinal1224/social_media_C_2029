import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import { createReel, getReels } from '../controllers/reel.controllers.js'
import uploadReel from '../middlewares/uploadReel.middleware.js'





const reelRoutes = express.Router()

reelRoutes.post('/createReel', isAuthenticated , uploadReel.single('video') , createReel)
reelRoutes.get('/getAllReels' , isAuthenticated ,getReels )



export default reelRoutes