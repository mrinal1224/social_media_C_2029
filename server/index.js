import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import postRoutes from './routes/post.routes.js'
import reelRoutes from './routes/reel.routes.js'




const app = express()

const PORT = 8089

dotenv.config()


mongoose.connect(process.env.dbUrl).then(() => {
    console.log("DB Connected")
}).catch((err) => {
    console.log(err)
})

app.use(cors({
       origin :'http://localhost:5173',
       credentials : true
}))


app.use(express.json())
app.use(cookieParser())
app.use('/users' , userRoutes)
app.use('/post' , postRoutes)
app.use('/reel' , reelRoutes)



app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})