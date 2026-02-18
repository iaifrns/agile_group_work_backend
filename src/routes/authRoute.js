import express from "express";
import { check_token, login, logout, register } from "../controller/authController.js";

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/check_token', check_token)

export default router