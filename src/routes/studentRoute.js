import express from "express";

const router = express.Router()

router.get('/getAll', (req, res) => {
    res.json({message: "this api is to display all students"})
})

export default router