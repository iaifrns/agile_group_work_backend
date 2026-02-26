import express from "express";
import { register, login, logout, check_token, } from "../controller/authController.js";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check_token", check_token);
export default router;
