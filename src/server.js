import express from "express";

import studentRoute from './routes/studentRoute.js'
import authRoute from './routes/authRoute.js'

const app = express()

app.use('/student', studentRoute)
app.use('/auth', authRoute)

const port = 5002

app.listen(port, ()=>{
    console.log("Server runing on port ",port)
})