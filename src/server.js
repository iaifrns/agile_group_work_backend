import express from "express";

import studentRoute from './routes/studentRoute.js'

const app = express()

app.use('/student', studentRoute)

const port = 5002

app.listen(port, ()=>{
    console.log("Server runing on port ",port)
})