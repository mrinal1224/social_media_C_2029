import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'




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



app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})