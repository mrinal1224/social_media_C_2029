import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'


const app = express()

const PORT = 8089

dotenv.config()


mongoose.connect(process.env.dbUrl).then(() => {
    console.log("DB Connected")
}).catch((err) => {
    console.log(err)
})



app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})