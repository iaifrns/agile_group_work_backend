import express from "express";
import {
  register,
  login,
  logout,
  check_token,
} from "../controller/authController";

const router = express.Router();

// Authentication routes
router.post("/register", register);      // Create new user account
router.post("/login", login);            // Authenticate and get token
router.get("/logout", logout);           // Clear authentication cookie
router.get("/check_token", check_token); // Verify token validity

export default router;